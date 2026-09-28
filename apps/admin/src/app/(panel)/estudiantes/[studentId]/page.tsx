import { getStudent, listProgressForStudent, listRunEvents, type CareerProgressRecord, type DecisionEvent } from '@despega/data';
import { CAREERS, findModule, progressSnapshot, scoreBranches } from '@despega/simulator';
import { Card, Chip, Meter, Label } from '@heroui/react';
import { CircleCheck, CircleDashed, Clock3, Compass, Lock, Route } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CareerIcon } from '@/components/career-icon';
import { Initials } from '@/components/initials';
import { RestartCareerButton } from '@/components/restart-career-button';
import { DecisionsTable } from '@/components/tables';
import { AffinityBars, AffinityRadar, DataUnavailable, EmptyState, PageHeader, ProgressChip, SectionHeader } from '@/components/ui';
import { requireStaff } from '@/lib/auth';
import { dataConfig } from '@/lib/data';
import { decisionRows } from '@/lib/decisions';
import { formatDate, formatDateTime, formatDuration } from '@/lib/format';
import { canManageProgress } from '@/lib/staff';
import { fullName } from '@/lib/students';

export const metadata: Metadata = { title: 'Estudiante' };

export default async function StudentDetailPage({ params }: PageProps<'/estudiantes/[studentId]'>) {
  const { studentId: rawId } = await params;
  const studentId = decodeURIComponent(rawId);
  if (!/^[A-Za-z0-9_.:@+-]{1,128}$/.test(studentId)) notFound();
  const staff = await requireStaff();
  const profile = await getStudent(dataConfig(), studentId).catch((error: unknown) => {
    console.error('No se pudo leer el estudiante.', error);
    return undefined;
  });
  if (profile === null) notFound();
  if (!profile) return <DataUnavailable what="el estudiante" />;

  let records: CareerProgressRecord[] = [];
  const events = new Map<string, DecisionEvent[]>();
  let failed = false;
  try {
    records = await listProgressForStudent(dataConfig(), profile.studentId);
    for (const record of records) events.set(record.careerId, await listRunEvents(dataConfig(), record.runId));
  } catch (error) {
    console.error('No se pudo leer el progreso del estudiante.', error);
    failed = true;
  }
  const name = fullName(profile) || 'Estudiante';

  return (
    <>
      <PageHeader leading={<Initials name={name} size="lg" tone="soft" />} title={name} description={profile.email} />

      <div className="grid gap-8">
        <Card className="p-0">
          <dl className="grid grid-cols-2 divide-line max-lg:[&>*:nth-child(-n+2)]:border-b max-lg:[&>*:nth-child(odd)]:border-r lg:grid-cols-4 lg:divide-x">
            <Detail label="Curso" value={profile.grade || '—'} />
            <Detail label="Colegio" value={profile.school || '—'} />
            <Detail label="Registro" value={formatDate(profile.createdAt)} />
            <Detail label="Acceso" value={profile.authProvider === 'local' ? 'Local (desarrollo)' : 'Cognito'} />
          </dl>
        </Card>

        {failed ? (
          <DataUnavailable what="el progreso" />
        ) : records.length === 0 ? (
          <Card>
            <EmptyState icon={Compass} title="Sin carreras iniciadas">{profile.givenName} todavía no empezó ninguna carrera.</EmptyState>
          </Card>
        ) : (
          records.map((record) => {
            const careerModule = findModule(record.careerId);
            const career = CAREERS.find((item) => item.id === record.careerId);
            if (!careerModule) return null;
            const snapshot = progressSnapshot(careerModule, record.state);
            const aligned = snapshot.status === 'completed' ? scoreBranches(careerModule, record.state).find((branch) => branch.aligned) : undefined;
            return (
              <section key={record.careerId} className="grid gap-4 sm:gap-6" aria-labelledby={`career-${record.careerId}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CareerIcon careerId={record.careerId} />
                    <div className="min-w-0">
                      <h2 id={`career-${record.careerId}`} className="text-xl font-bold text-ink">{career?.name ?? careerModule.title}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <ProgressChip status={snapshot.status} session={snapshot.currentSessionNumber} />
                        <Chip size="sm" variant="soft"><Chip.Label>Intento {record.attempt}</Chip.Label></Chip>
                      </div>
                    </div>
                  </div>
                  {canManageProgress(staff.groups) && (
                    <RestartCareerButton studentId={profile.studentId} careerId={record.careerId} studentName={profile.givenName} />
                  )}
                </div>

                <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                  <Card>
                    <Card.Header>
                      <Card.Title>Desempeño</Card.Title>
                      <Card.Description>Empieza en {careerModule.initialPerformance}; sube o baja con cada decisión.</Card.Description>
                    </Card.Header>
                    <Card.Content className="grid content-start gap-5">
                      <Meter value={snapshot.performance} minValue={0} maxValue={100} valueLabel={`${snapshot.performance} / 100`} color="accent" aria-label="Desempeño">
                        <div className="flex items-baseline justify-between">
                          <Label>Desempeño actual</Label>
                          <Meter.Output className="font-sans text-2xl font-bold" />
                        </div>
                        <Meter.Track>
                          <Meter.Fill />
                        </Meter.Track>
                      </Meter>
                      <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                        {snapshot.sessions.map((session) => {
                          const Icon = session.status === 'completed' ? CircleCheck : session.status === 'locked' ? Lock : session.status === 'in_progress' ? Clock3 : CircleDashed;
                          return (
                            <li key={session.id} className="flex items-center gap-3 px-3.5 py-3 text-sm">
                              <Icon
                                className={`size-4 shrink-0 ${session.status === 'completed' ? 'text-success-soft-foreground' : session.status === 'in_progress' ? 'text-accent' : 'text-placeholder'}`}
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1">
                                <span className="label-caps block">Sesión {session.number}</span>
                                <span className={`font-semibold ${session.status === 'locked' ? 'text-muted-ink' : 'text-ink'}`}>{session.title}</span>
                              </span>
                              <span className="shrink-0 text-right text-xs text-muted-ink">
                                {session.status === 'completed' ? (
                                  <>
                                    <span className="block font-semibold tabular-nums text-ink">{session.performanceStart} → {session.performanceEnd}</span>
                                    {formatDuration(session.elapsedMs)}
                                  </>
                                ) : session.status === 'in_progress' ? (
                                  'En curso'
                                ) : session.status === 'available' ? (
                                  'Disponible'
                                ) : (
                                  'Bloqueada'
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      {aligned && (
                        <div className="flex gap-3 rounded-xl border border-accent/20 bg-accent-soft p-4">
                          <Route className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                          <div>
                            <p className="label-caps text-accent-soft-foreground">Camino que más se parece a su perfil</p>
                            <p className="mt-1 font-display text-lg font-bold text-ink">{aligned.title}</p>
                            <p className="text-sm text-muted-ink">{aligned.path}. Es una pista para conversar, no una predicción.</p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-ink">Inició el {formatDateTime(record.startedAt)} · Última actividad: {formatDateTime(record.updatedAt)}</p>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Header>
                      <Card.Title>Perfil de afinidad</Card.Title>
                      <Card.Description>Normalizado contra lo que podía ganar en las sesiones jugadas. Sin bien ni mal.</Card.Description>
                    </Card.Header>
                    <Card.Content className="@container">
                      <div className="grid items-center gap-6 @2xl:grid-cols-2">
                        <AffinityRadar values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} width={440} />
                        <AffinityBars values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} />
                      </div>
                    </Card.Content>
                  </Card>
                </div>

                <div className="grid gap-3">
                  <SectionHeader level={3} title="Decisiones, escena por escena" description="Lo que eligió en cada escena, cuánto tardó y cómo movió su desempeño y su perfil." />
                  <DecisionsTable rows={decisionRows(careerModule, events.get(record.careerId) ?? [])} />
                </div>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-line px-4 py-3.5 sm:px-5">
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 truncate font-semibold text-ink">{value}</dd>
    </div>
  );
}
