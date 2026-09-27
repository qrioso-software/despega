import { careerOverview, countStudents, getStudents, type CareerOverview, type StudentProfile } from '@despega/data';
import { findModule } from '@despega/simulator';
import { Card } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { StudentsTable } from '@/components/tables';
import { AffinityBars, AffinityRadar, DataUnavailable, PageHeader, StatTile } from '@/components/ui';
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
        eyebrow="Panel"
        title="Así va el piloto"
        description={`${pilot.title} · ${pilot.tagline}. Los datos se leen en vivo desde DynamoDB.`}
      />
      {!overview ? (
        <DataUnavailable what="el panel" />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Estudiantes registrados" value={students} />
            <StatTile label="Iniciaron el módulo" value={overview.started} hint={percent(overview.started, students) + ' de los registrados'} />
            <StatTile label="Completaron las 3 sesiones" value={overview.completed} hint={percent(overview.completed, overview.started) + ' de quienes iniciaron'} />
            <StatTile
              label="Desempeño promedio al terminar"
              value={overview.averagePerformanceCompleted ?? '—'}
              hint={overview.averagePerformance === null ? 'Aún sin datos' : `Promedio general: ${overview.averagePerformance}`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <Card>
              <Card.Header>
                <Card.Title>Avance por sesión</Card.Title>
                <Card.Description>Estudiantes que completaron cada sesión de {pilot.tagline}.</Card.Description>
              </Card.Header>
              <Card.Content>
                <ul className="grid gap-4">
                  {overview.bySession.map((item) => {
                    const session = pilot.sessions[item.sessionNumber - 1];
                    const share = overview.started > 0 ? (item.completed / overview.started) * 100 : 0;
                    return (
                      <li key={item.sessionNumber}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-semibold text-ink">Sesión {item.sessionNumber} · {session?.title}</span>
                          <span className="whitespace-nowrap tabular-nums text-muted-ink">{item.completed} de {overview.started}</span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-tertiary" aria-hidden="true">
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
              <Card.Content>
                {overview.averageAffinityCompleted ? (
                  <div className="grid items-center gap-6 md:grid-cols-2">
                    <AffinityRadar values={overview.averageAffinityCompleted} width={340} />
                    <AffinityBars values={overview.averageAffinityCompleted} />
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-ink">Aparecerá cuando al menos un estudiante termine las tres sesiones.</p>
                )}
              </Card.Content>
            </Card>
          </div>

          <section className="grid gap-3" aria-labelledby="actividad">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="actividad" className="text-xl font-bold text-ink">Actividad reciente</h2>
                <p className="text-sm text-muted-ink">Últimos estudiantes que avanzaron en {pilot.title}.</p>
              </div>
              <Link href="/estudiantes" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                Ver todos <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
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
