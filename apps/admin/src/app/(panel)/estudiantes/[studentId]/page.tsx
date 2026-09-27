import { getStudent, listProgressForStudent, listRunEvents, type CareerProgressRecord, type DecisionEvent } from '@despega/data';
import { CAREERS, findModule, progressSnapshot, scoreBranches } from '@despega/simulator';
import { Card, Chip, Meter, Label } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RestartCareerButton } from '@/components/restart-career-button';
import { DecisionsTable } from '@/components/tables';
import { AffinityBars, AffinityRadar, DataUnavailable, PageHeader, ProgressChip } from '@/components/ui';
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
      <Link href="/estudiantes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-ink hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Estudiantes
      </Link>
      <PageHeader eyebrow="Estudiante" title={name} description={profile.email} />

      <div className="grid gap-6">
        <Card>
          <Card.Content>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Curso" value={profile.grade || '—'} />
              <Detail label="Colegio" value={profile.school || '—'} />
              <Detail label="Registro" value={formatDate(profile.createdAt)} />
              <Detail label="Acceso" value={profile.authProvider === 'local' ? 'Local (desarrollo)' : 'Cognito'} />
            </dl>
          </Card.Content>
        </Card>

        {failed ? (
          <DataUnavailable what="el progreso" />
        ) : records.length === 0 ? (
          <Card>
            <Card.Content>
              <p className="py-6 text-center text-muted-ink">{profile.givenName} todavía no empezó ninguna carrera.</p>
            </Card.Content>
          </Card>
        ) : (
          records.map((record) => {
            const careerModule = findModule(record.careerId);
            const career = CAREERS.find((item) => item.id === record.careerId);
            if (!careerModule) return null;
            const snapshot = progressSnapshot(careerModule, record.state);
            const aligned = snapshot.status === 'completed' ? scoreBranches(careerModule, record.state).find((branch) => branch.aligned) : undefined;
            return (
              <section key={record.careerId} className="grid gap-6" aria-labelledby={`career-${record.careerId}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 id={`career-${record.careerId}`} className="text-2xl font-bold text-ink">{career?.emoji} {careerModule.title}</h2>
                    <ProgressChip status={snapshot.status} session={snapshot.currentSessionNumber} />
                    <Chip size="sm" variant="soft"><Chip.Label>Intento {record.attempt}</Chip.Label></Chip>
                  </div>
                  {canManageProgress(staff.groups) && (
                    <RestartCareerButton studentId={profile.studentId} careerId={record.careerId} studentName={profile.givenName} />
                  )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
                  <Card>
                    <Card.Header>
                      <Card.Title>Desempeño</Card.Title>
                      <Card.Description>Empieza en {careerModule.initialPerformance}; sube o baja con cada decisión.</Card.Description>
                    </Card.Header>
                    <Card.Content className="grid gap-5">
                      <Meter value={snapshot.performance} minValue={0} maxValue={100} valueLabel={`${snapshot.performance} / 100`} color="accent" aria-label="Desempeño">
                        <div className="flex items-baseline justify-between">
                          <Label>Desempeño actual</Label>
                          <Meter.Output className="font-sans text-2xl font-bold" />
                        </div>
                        <Meter.Track>
                          <Meter.Fill />
                        </Meter.Track>
                      </Meter>
                      <ul className="grid gap-2">
                        {snapshot.sessions.map((session) => (
                          <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-secondary px-4 py-2.5 text-sm">
                            <span className="font-semibold text-ink">Sesión {session.number} · {session.title}</span>
                            <span className="text-muted-ink">
                              {session.status === 'completed'
                                ? `${session.performanceStart} → ${session.performanceEnd} · ${formatDuration(session.elapsedMs)}`
                                : session.status === 'in_progress'
                                  ? 'En curso'
                                  : session.status === 'available'
                                    ? 'Disponible'
                                    : 'Bloqueada'}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {aligned && (
                        <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-accent">Camino que más se parece a su perfil</p>
                          <p className="mt-1 font-display text-lg font-bold text-ink">{aligned.title}</p>
                          <p className="text-sm text-muted-ink">{aligned.path}. Es una pista para conversar, no una predicción.</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-ink">Inició: {formatDateTime(record.startedAt)} · Última actividad: {formatDateTime(record.updatedAt)}</p>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Header>
                      <Card.Title>Perfil de afinidad</Card.Title>
                      <Card.Description>Normalizado contra lo que podía ganar en las sesiones jugadas. Sin bien ni mal.</Card.Description>
                    </Card.Header>
                    <Card.Content className="grid items-center gap-6 md:grid-cols-2">
                      <AffinityRadar values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} width={340} />
                      <AffinityBars values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} />
                    </Card.Content>
                  </Card>
                </div>

                <div className="grid gap-3">
                  <h3 className="text-xl font-bold text-ink">Decisiones, escena por escena</h3>
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
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-ink">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}
