import { careerOverview, countStudents, getStudents, type CareerOverview, type StudentProfile } from '@despega/data';
import { findModule } from '@despega/simulator';
import { Card, Chip } from '@heroui/react';
import { ArrowRight, Flag, Gauge, PlayCircle, Radar, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CareerIcon } from '@/components/career-icon';
import { StudentsTable } from '@/components/tables';
import { AffinityBars, AffinityRadar, DataUnavailable, EmptyState, PageHeader, SectionHeader, StatTile } from '@/components/ui';
import { dataConfig } from '@/lib/data';
import { percent } from '@/lib/format';
import { studentRow } from '@/lib/students';

export const metadata: Metadata = { title: 'Panel' };

const PILOT_CAREER = 'ingenieria-software';

export default async function DashboardPage() {
  const pilot = findModule(PILOT_CAREER)!;
  let students = 0;
  let overview: CareerOverview | null = null;
  let profiles = new Map<string, StudentProfile>();
  try {
    [students, overview] = await Promise.all([countStudents(dataConfig()), careerOverview(dataConfig(), PILOT_CAREER, { recent: 8 })]);
    profiles = await getStudents(dataConfig(), overview.recent.map((item) => item.studentId));
  } catch (error) {
    console.error('No se pudo cargar el panel.', error);
  }

  return (
    <>
      <PageHeader
        leading={<CareerIcon careerId={pilot.careerId} />}
        title="Así va el piloto"
        description={`${pilot.title} · ${pilot.tagline}. Datos en vivo desde DynamoDB.`}
        actions={
          <Chip size="sm" color="success" variant="soft">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            <Chip.Label>En vivo</Chip.Label>
          </Chip>
        }
      />
      {!overview ? (
        <DataUnavailable what="el panel" />
      ) : (
        <div className="grid gap-6 lg:gap-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatTile icon={Users} label="Registrados" value={students} hint="Cuentas de estudiantes" />
            <StatTile icon={PlayCircle} label="Iniciaron" value={overview.started} hint={`${percent(overview.started, students)} de los registrados`} />
            <StatTile
              icon={Flag}
              tone="brand"
              label="Completaron"
              value={overview.completed}
              hint={`${percent(overview.completed, overview.started)} de quienes iniciaron`}
            />
            <StatTile
              icon={Gauge}
              tone="sun"
              label="Desempeño final"
              value={overview.averagePerformanceCompleted ?? '—'}
              hint={overview.averagePerformance === null ? 'Aún sin datos' : `Promedio general: ${overview.averagePerformance}`}
            />
          </div>

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Card>
              <Card.Header>
                <Card.Title>Avance por sesión</Card.Title>
                <Card.Description>Estudiantes que completaron cada sesión de {pilot.tagline}.</Card.Description>
              </Card.Header>
              <Card.Content>
                <ul className="grid gap-5">
                  {overview.bySession.map((item) => {
                    const session = pilot.sessions[item.sessionNumber - 1];
                    const share = overview.started > 0 ? (item.completed / overview.started) * 100 : 0;
                    return (
                      <li key={item.sessionNumber}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="min-w-0">
                            <span className="label-caps block">Sesión {item.sessionNumber}</span>
                            <span className="font-semibold text-ink">{session?.title}</span>
                          </span>
                          <span className="whitespace-nowrap tabular-nums text-muted-ink">
                            <strong className="text-ink">{item.completed}</strong> de {overview.started}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary" aria-hidden="true">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {overview.truncated && <p className="mt-4 text-xs text-muted-ink">Se muestran los {overview.sampled} registros más recientes.</p>}
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Perfil de afinidad promedio</Card.Title>
                <Card.Description>
                  Quienes completaron el módulo, normalizado de 0 a 100. No hay ejes buenos o malos: describe cómo decide el grupo.
                </Card.Description>
              </Card.Header>
              <Card.Content className="@container">
                {overview.averageAffinityCompleted ? (
                  <div className="grid items-center gap-6 @2xl:grid-cols-2">
                    <AffinityRadar values={overview.averageAffinityCompleted} width={440} />
                    <AffinityBars values={overview.averageAffinityCompleted} />
                  </div>
                ) : (
                  <EmptyState icon={Radar} title="Todavía sin perfil de grupo">
                    Aparecerá cuando al menos un estudiante termine las tres sesiones.
                  </EmptyState>
                )}
              </Card.Content>
            </Card>
          </div>

          <section className="grid gap-3" aria-labelledby="actividad">
            <SectionHeader
              id="actividad"
              title="Actividad reciente"
              description={`Últimos estudiantes que avanzaron en ${pilot.title}.`}
              action={
                <Link href="/estudiantes" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                  Ver todos <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            />
            <StudentsTable
              label="Actividad reciente"
              empty="Todavía nadie empezó el módulo."
              rows={overview.recent.flatMap((item) => {
                const profile = profiles.get(item.studentId);
                return profile ? [studentRow(pilot, profile, item)] : [];
              })}
            />
          </section>
        </div>
      )}
    </>
  );
}
