import { getProgress } from '@despega/data';
import {
  AFFINITY_LABELS,
  AFFINITY_SHORT_LABELS,
  progressSnapshot,
  scoreBranches,
  type AffinityDelta,
  type CareerModule,
  type SimulationState,
} from '@despega/simulator';
import { ArrowRight, Clock3, Compass, Timer } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app/app-shell';
import { CareerIcon } from '@/components/careers/career-icon';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { PerformanceMeter, SessionStatusBadge } from '@/components/dashboard/career-progress';
import { AffinityBars, AffinityRadar } from '@/components/simulator/affinity-radar';
import { requireStudent } from '@/lib/auth';
import { dataConfig } from '@/lib/data';
import { playableModule } from '@/lib/simulation';

export async function generateMetadata({ params }: PageProps<'/simulador/[careerId]'>): Promise<Metadata> {
  const { careerId } = await params;
  const careerModule = playableModule(careerId);
  return { title: careerModule ? `${careerModule.title} · ${careerModule.tagline}` : 'Carrera' };
}

export default async function CareerHubPage({ params }: PageProps<'/simulador/[careerId]'>) {
  const { careerId } = await params;
  const careerModule = playableModule(careerId);
  if (!careerModule) notFound();
  const student = await requireStudent(`/simulador/${careerId}`);
  const record = await getProgress(dataConfig(), student.studentId, careerId);
  const snapshot = record ? progressSnapshot(careerModule, record.state) : null;
  const completed = snapshot?.status === 'completed';
  const current = snapshot?.sessions.find((session) => session.status === 'in_progress' || session.status === 'available');
  const sessions = snapshot?.sessions ?? careerModule.sessions.map((session, index) => ({
    number: session.number,
    title: session.title,
    synopsis: session.synopsis,
    estimatedMinutes: session.estimatedMinutes,
    status: index === 0 ? ('available' as const) : ('locked' as const),
    performanceStart: undefined,
    performanceEnd: undefined,
  }));
  const cta = current?.status === 'in_progress' ? `Continuar la sesión ${current.number}` : `Empezar la sesión ${current?.number ?? 1}`;

  return (
    <AppShell
      student={student}
      crumbs={[{ label: 'Inicio', href: '/inicio' }, { label: careerModule.title }]}
      back={{ href: '/inicio', label: 'Inicio' }}
    >
      <div className="grid gap-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="relative overflow-hidden rounded-2xl bg-night p-6 text-white sm:p-8">
            <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent/35 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-brand/20 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center gap-3">
                <CareerIcon careerId={careerId} tone="night" />
                <p className="text-sm font-semibold text-white/75">{careerModule.title}</p>
              </div>
              <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{careerModule.tagline}</h1>
              <p className="mt-3 max-w-2xl text-white/75">
                Eres {careerModule.playerRole.toLowerCase()} en {careerModule.company}. Cada sesión abre con algo urgente y cierra con un
                gancho para la siguiente. No hay forma de perder: tus decisiones cambian la historia y tu perfil.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                {completed ? (
                  <span className="chip bg-good text-white">Módulo completado</span>
                ) : (
                  <Link href={`/simulador/${careerId}/jugar`} className="btn btn-primary btn-lg">
                    {cta} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
                <p className="text-sm text-white/65">
                  {snapshot ? `${snapshot.completedSessions} de ${sessions.length} sesiones completadas` : `${sessions.length} sesiones · tu progreso se guarda solo`}
                </p>
              </div>
            </div>
          </section>

          <section className="card p-5" aria-labelledby="equipo">
            <h2 id="equipo" className="text-sm font-semibold text-ink">Tu equipo en {careerModule.company}</h2>
            <ul className="mt-2 divide-y divide-line">
              {Object.values(careerModule.characters).map((character) => (
                <li key={character.id} className="flex items-center gap-3 py-3 last:pb-0">
                  <CharacterAvatar characterId={character.id} mood="happy" size={44} decorative />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{character.name}</p>
                    <p className="text-sm text-muted">{character.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="grid gap-4" aria-labelledby="sesiones">
          <h2 id="sesiones" className="text-lg font-bold">Sesiones</h2>
          <ol className="grid gap-4 lg:grid-cols-3">
            {sessions.map((session) => {
              const open = session.status === 'available' || session.status === 'in_progress';
              return (
                <li key={session.number} className={`card flex flex-col p-5 ${open ? 'border-brand ring-1 ring-brand' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted">Sesión {session.number} · ~{session.estimatedMinutes} min</span>
                    <SessionStatusBadge status={session.status} />
                  </div>
                  <h3 className={`mt-2 text-lg font-bold ${session.status === 'locked' ? 'text-ink-soft' : ''}`}>{session.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{session.synopsis}</p>
                  {session.performanceStart !== undefined && session.performanceEnd !== undefined && (
                    <p className="mt-auto pt-4 text-sm tabular-nums text-muted">
                      Desempeño {session.performanceStart} → <strong className="text-ink">{session.performanceEnd}</strong>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {snapshot && record ? (
          completed ? (
            <Results careerModule={careerModule} state={record.state} />
          ) : (
            <section className="grid gap-4" aria-labelledby="progreso">
              <SectionTitle id="progreso" title="Tu progreso hasta ahora" description="El perfil se compara con lo que podías ganar en las sesiones jugadas." />
              <div className="card grid gap-8 p-5 sm:p-6 lg:grid-cols-2 lg:items-center">
                <AffinityRadar values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} size={440} className="mx-auto" />
                <div className="grid gap-6">
                  <PerformanceMeter value={snapshot.performance} />
                  <div className="border-t border-line pt-6">
                    <AffinityBars values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} />
                  </div>
                  <p className="text-sm text-muted">No hay ejes buenos o malos: muestran cómo decides.</p>
                </div>
              </div>
            </section>
          )
        ) : (
          <section className="grid gap-4" aria-labelledby="como-se-juega">
            <SectionTitle id="como-se-juega" title="Cómo se juega" />
            <ul className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Timer, title: 'Reloj real', text: 'Algunas decisiones tienen 15 o 20 segundos. Si no eliges, el juego sigue.' },
                { icon: Clock3, title: '~30 minutos por sesión', text: 'Puedes pausar entre escenas: tu progreso se guarda al instante.' },
                { icon: Compass, title: 'Tu perfil al final', text: 'Desempeño, afinidad en 5 ejes y el camino que más se parece a ti.' },
              ].map((item) => (
                <li key={item.title} className="card flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function SectionTitle({ id, title, description }: { id: string; title: string; description?: ReactNode }) {
  return (
    <div>
      <h2 id={id} className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
    </div>
  );
}

function Results({ careerModule, state }: { careerModule: CareerModule; state: SimulationState }) {
  const snapshot = progressSnapshot(careerModule, state);
  const branches = scoreBranches(careerModule, state);
  const aligned = branches.find((branch) => branch.aligned);
  const scenes = new Map(careerModule.sessions.flatMap((session) => session.scenes).map((scene) => [scene.id, scene]));

  return (
    <>
      <section className="grid gap-4" aria-labelledby="resultados">
        <SectionTitle id="resultados" title={`Tus resultados en ${careerModule.company}`} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="card p-5 sm:p-6">
            <p className="text-sm font-semibold text-muted">Desempeño final</p>
            <p className="mt-1 font-display text-6xl font-bold text-ink">{snapshot.performance}</p>
            <p className="text-sm text-muted">de 100 · empezaste con {careerModule.initialPerformance}</p>
            <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
              {snapshot.sessions.map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="font-semibold">Sesión {session.number} · {session.title}</span>
                  <span className="shrink-0 tabular-nums text-muted">{session.performanceStart ?? '—'} → {session.performanceEnd ?? '—'}</span>
                </li>
              ))}
            </ul>
            {aligned && (
              <div className="mt-6 rounded-xl border border-accent/25 bg-accent-soft/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-strong">{aligned.path}</p>
                <p className="mt-1 font-display text-xl font-bold">{aligned.title}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Tu forma de decidir se parece a este camino ({aligned.axes.map((axis) => AFFINITY_SHORT_LABELS[axis].toLowerCase()).join(' y ')}).
                  No es una predicción: es una pista.
                </p>
              </div>
            )}
          </div>
          <div className="card grid gap-6 p-5 sm:p-6 md:grid-cols-2 md:items-center">
            <AffinityRadar values={snapshot.affinity.normalized} size={400} className="mx-auto" />
            <AffinityBars values={snapshot.affinity.normalized} />
          </div>
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="recorrido">
        <SectionTitle id="recorrido" title="Tu recorrido, decisión por decisión" />
        <ol className="card divide-y divide-line overflow-hidden">
          {state.log.map((entry) => (
            <li key={`${entry.sceneId}-${entry.at}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">Escena {entry.sceneId} · {scenes.get(entry.sceneId)?.title}</p>
                <p className="mt-0.5 font-semibold">
                  {entry.label}
                  {entry.timedOut && <Timer className="ml-1.5 inline size-4 text-sun-strong" aria-label="Tiempo agotado" />}
                </p>
              </div>
              <DeltaChips performance={entry.performanceDelta} affinity={entry.affinityDelta} />
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function DeltaChips({ performance, affinity }: { performance: number; affinity: AffinityDelta }) {
  const axes = Object.entries(affinity).filter(([, value]) => value) as [keyof typeof AFFINITY_LABELS, number][];
  return (
    <div className="flex flex-wrap gap-1.5">
      {performance !== 0 && (
        <span className={`chip ${performance > 0 ? 'bg-good-soft text-good-strong' : 'bg-bad-soft text-bad-strong'}`}>
          {performance > 0 ? `▲ +${performance}` : `▼ ${performance}`} desempeño
        </span>
      )}
      {axes.map(([axis, value]) => (
        <span key={axis} className="chip bg-accent-soft text-accent-strong">
          {value > 0 ? `+${value}` : value} {AFFINITY_SHORT_LABELS[axis].toLowerCase()}
        </span>
      ))}
    </div>
  );
}
