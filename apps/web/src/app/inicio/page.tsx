import { listProgressForStudent, type CareerProgressRecord } from '@despega/data';
import { CAREERS, findModule, progressSnapshot, type Career } from '@despega/simulator';
import { ArrowRight, Clock3, Gauge, Radar, TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/app-shell';
import { CareerIcon } from '@/components/careers/career-icon';
import { PerformanceMeter, SessionTrack } from '@/components/dashboard/career-progress';
import { AffinityBars } from '@/components/simulator/affinity-radar';
import { requireStudent } from '@/lib/auth';
import { dataConfig } from '@/lib/data';

export const metadata: Metadata = { title: 'Mi inicio' };

export default async function StudentHomePage() {
  const student = await requireStudent('/inicio');
  let records: CareerProgressRecord[] = [];
  let unavailable = false;
  try {
    records = await listProgressForStudent(dataConfig(), student.studentId);
  } catch (error) {
    console.error('No se pudo leer el progreso del estudiante.', error);
    unavailable = true;
  }
  const progressByCareer = new Map(records.map((record) => [record.careerId, record]));
  const available = CAREERS.filter((career) => career.status === 'available');
  const upcoming = CAREERS.filter((career) => career.status !== 'available');

  return (
    <AppShell student={student} crumbs={[{ label: 'Inicio' }]}>
      <div className="grid gap-10">
        <header>
          <h1 className="text-2xl font-bold sm:text-3xl">Hola, {student.givenName}</h1>
          <p className="mt-1.5 text-ink-soft">Elige una carrera y vive su semana. Tu progreso se guarda después de cada escena.</p>
        </header>

        {unavailable && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad-strong">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            No pudimos cargar tu progreso en este momento. Tus datos no se perdieron; vuelve a intentar en unos segundos.
          </p>
        )}

        <section className="grid gap-4" aria-labelledby="disponibles">
          <SectionHeader id="disponibles" title="Carreras disponibles" />
          {available.map((career) => (
            <CareerCard key={career.id} career={career} record={progressByCareer.get(career.id)} />
          ))}
        </section>

        <section className="grid gap-4" aria-labelledby="proximamente">
          <SectionHeader
            id="proximamente"
            title="Próximamente"
            description="Cada carrera tendrá su propio desempeño y perfil, para que puedas compararlas."
            aside={<span className="chip bg-mist text-muted">{upcoming.length} carreras</span>}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {upcoming.map((career) => (
              <li key={career.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5">
                <CareerIcon careerId={career.id} tone="muted" />
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-ink">{career.name}</p>
                  <p className="text-sm text-muted">{career.area}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function SectionHeader({ id, title, description, aside }: { id: string; title: string; description?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div>
        <h2 id={id} className="text-lg font-bold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {aside}
    </div>
  );
}

function CareerCard({ career, record }: { career: Career; record?: CareerProgressRecord }) {
  const careerModule = findModule(career.id);
  if (!careerModule) return null;
  const snapshot = record ? progressSnapshot(careerModule, record.state) : null;
  const completed = snapshot?.status === 'completed';
  const href = `/simulador/${career.id}`;
  const current = snapshot?.sessions.find((session) => session.status === 'in_progress' || session.status === 'available');
  const cta = !snapshot
    ? 'Empezar la sesión 1'
    : completed
      ? 'Ver mis resultados'
      : current?.status === 'in_progress'
        ? `Continuar la sesión ${current.number}`
        : `Empezar la sesión ${current?.number ?? 1}`;
  const sessions = snapshot?.sessions ?? careerModule.sessions.map((session, index) => ({
    number: session.number,
    title: session.title,
    status: index === 0 ? ('available' as const) : ('locked' as const),
  }));
  const minutes = Math.round(careerModule.sessions.reduce((total, session) => total + session.estimatedMinutes, 0) / careerModule.sessions.length);

  return (
    <article className="card overflow-hidden">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <CareerIcon careerId={career.id} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h3 className="text-xl font-bold">{career.name}</h3>
                <ProgressChip completed={completed} started={Boolean(snapshot)} done={snapshot?.completedSessions ?? 0} total={careerModule.sessions.length} />
              </div>
              <p className="mt-1 text-sm text-muted">{careerModule.tagline} · {careerModule.playerRole}</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-ink-soft">{career.description}</p>
          <div className="mt-5">
            <SessionTrack sessions={sessions} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={href} className="btn btn-primary btn-lg">
              {cta} <ArrowRight className="size-4" aria-hidden />
            </Link>
            {!completed && (
              <Link href={href} className="btn btn-ghost btn-lg">Ver detalles</Link>
            )}
          </div>
        </div>

        <div className="border-t border-line bg-paper p-5 sm:p-6 xl:border-l xl:border-t-0">
          {snapshot ? (
            <div className="grid gap-5">
              <PerformanceMeter value={snapshot.performance} />
              <div className="border-t border-line pt-5">
                <h4 className="mb-3 text-sm font-semibold text-muted">Perfil de afinidad</h4>
                <AffinityBars values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} compact />
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <h4 className="text-sm font-semibold text-ink">Lo que te espera</h4>
              <ul className="grid gap-4">
                <Fact icon={<Clock3 className="size-4" aria-hidden />} title={`${careerModule.sessions.length} sesiones de ~${minutes} min`} text="Puedes pausar entre escenas cuando quieras." />
                <Fact icon={<Gauge className="size-4" aria-hidden />} title="Desempeño de 0 a 100" text={`Empiezas con ${careerModule.initialPerformance} puntos. Cada decisión los mueve.`} />
                <Fact icon={<Radar className="size-4" aria-hidden />} title="Perfil de afinidad en 5 ejes" text="Muestra cómo decides; no hay ejes buenos o malos." />
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ProgressChip({ completed, started, done, total }: { completed: boolean; started: boolean; done: number; total: number }) {
  if (completed) return <span className="chip bg-good-soft text-good-strong">Completada</span>;
  if (started) return <span className="chip bg-accent-soft text-accent-strong">{done} de {total} sesiones</span>;
  return <span className="chip bg-sun-soft text-sun-strong">Nueva</span>;
}

function Fact({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-accent ring-1 ring-line">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-muted">{text}</p>
      </div>
    </li>
  );
}
