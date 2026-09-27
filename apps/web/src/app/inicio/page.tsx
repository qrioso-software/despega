import { listProgressForStudent, type CareerProgressRecord } from '@despega/data';
import { AFFINITY_LABELS, CAREERS, findModule, progressSnapshot, type Career } from '@despega/simulator';
import { ArrowRight, Sparkles, TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PerformanceMeter, SessionTrack } from '@/components/dashboard/career-progress';
import { AffinityRadar } from '@/components/simulator/affinity-radar';
import { SiteHeader } from '@/components/site/site-header';
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
    <>
      <SiteHeader student={student} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="eyebrow">Tu espacio</p>
        <h1 className="mt-2 text-4xl font-bold">Hola, {student.givenName} 👋</h1>
        <p className="mt-2 text-ink-soft">Elige una carrera y vive su semana. Tu progreso se guarda después de cada escena.</p>

        {unavailable && (
          <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl bg-bad-soft px-4 py-3 text-sm text-bad-strong">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            No pudimos cargar tu progreso en este momento. Tus datos no se perdieron; vuelve a intentar en unos segundos.
          </p>
        )}

        <section className="mt-10 grid gap-6" aria-labelledby="disponibles">
          <h2 id="disponibles" className="text-2xl font-bold">Carreras disponibles</h2>
          {available.map((career) => (
            <CareerCard key={career.id} career={career} record={progressByCareer.get(career.id)} />
          ))}
        </section>

        <section className="mt-14" aria-labelledby="proximamente">
          <h2 id="proximamente" className="text-2xl font-bold">Próximamente</h2>
          <p className="mt-1 text-sm text-muted">Cada carrera tendrá su propio desempeño y perfil, para que puedas compararlas.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((career) => (
              <li key={career.id} className="rounded-2xl border border-line bg-surface p-4">
                <span className="text-2xl" aria-hidden>{career.emoji}</span>
                <p className="mt-2 font-semibold">{career.name}</p>
                <p className="text-xs text-muted">{career.area}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
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
  const strongest = snapshot?.affinity.ranking
    .filter((axis) => snapshot.affinity.normalized[axis] > 0)
    .slice(0, 2)
    .map((axis) => AFFINITY_LABELS[axis].toLowerCase());

  return (
    <article className="card overflow-hidden">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl" aria-hidden>{career.emoji}</span>
            <div>
              <p className="eyebrow">{careerModule.company} · {careerModule.playerRole}</p>
              <h3 className="text-2xl font-bold">{career.name}: {careerModule.tagline}</h3>
            </div>
          </div>
          <p className="mt-4 text-ink-soft">{career.description}</p>
          <div className="mt-6">
            <SessionTrack sessions={sessions} />
          </div>
          <Link href={href} className="btn btn-primary mt-6 min-h-12 px-6">
            {cta} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
        <div className="rounded-3xl bg-mist p-5">
          {snapshot ? (
            <>
              <PerformanceMeter value={snapshot.performance} />
              <AffinityRadar values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} size={260} className="mx-auto mt-2" />
              {strongest && strongest.length > 0 && (
                <p className="text-center text-sm text-ink-soft">Tus ejes más fuertes: <strong>{strongest.join(' y ')}</strong>.</p>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
              <Sparkles className="size-8 text-accent" aria-hidden />
              <p className="font-semibold">Aquí aparecerán tu desempeño y tu perfil de afinidad.</p>
              <p className="text-sm text-muted">Empiezas con 50 puntos. Cada decisión los mueve.</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
