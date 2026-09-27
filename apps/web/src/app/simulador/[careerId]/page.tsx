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
import { ArrowLeft, ArrowRight, Clock3, Compass, Timer } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { PerformanceMeter, SessionTrack } from '@/components/dashboard/career-progress';
import { AffinityBars, AffinityRadar } from '@/components/simulator/affinity-radar';
import { SiteHeader } from '@/components/site/site-header';
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

  return (
    <>
      <SiteHeader student={student} />
      <main>
        <section className="bg-night text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <Link href="/inicio" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
                <ArrowLeft className="size-4" aria-hidden /> Mi inicio
              </Link>
              <p className="eyebrow mt-6 text-sun">{careerModule.title}</p>
              <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{careerModule.tagline}</h1>
              <p className="mt-4 max-w-xl text-white/75">
                Eres {careerModule.playerRole.toLowerCase()} en {careerModule.company}. Cada sesión abre con algo urgente y cierra con un
                gancho para la siguiente. No hay forma de perder: tus decisiones cambian la historia y tu perfil.
              </p>
              <div className="mt-6">
                <SessionTrack sessions={sessions} tone="dark" />
              </div>
              {!completed && (
                <Link href={`/simulador/${careerId}/jugar`} className="btn btn-primary mt-8 min-h-12 px-6 text-base">
                  {current?.status === 'in_progress' ? `Continuar la sesión ${current.number}` : `Empezar la sesión ${current?.number ?? 1}`}
                  <ArrowRight className="size-5" aria-hidden />
                </Link>
              )}
            </div>
            <ul className="grid gap-3">
              {Object.values(careerModule.characters).map((character) => (
                <li key={character.id} className="flex items-center gap-4 rounded-2xl bg-white/5 p-3">
                  <CharacterAvatar characterId={character.id} mood="happy" size={64} decorative />
                  <div>
                    <p className="font-display text-lg font-bold">{character.name}</p>
                    <p className="text-sm text-white/60">{character.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {snapshot && record ? (
          completed ? (
            <Results careerModule={careerModule} state={record.state} />
          ) : (
            <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
              <h2 className="text-2xl font-bold">Tu progreso hasta ahora</h2>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="card p-6">
                  <PerformanceMeter value={snapshot.performance} />
                  <AffinityRadar values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} size={300} className="mx-auto mt-4" />
                </div>
                <div className="card p-6">
                  <AffinityBars values={snapshot.affinity.normalized} unavailable={snapshot.affinity.unavailable} />
                  <p className="mt-6 text-sm text-muted">
                    El perfil se compara con lo que podías ganar en las sesiones jugadas. No hay ejes buenos o malos: muestran
                    cómo decides.
                  </p>
                </div>
              </div>
            </section>
          )
        ) : (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Timer, title: 'Reloj real', text: 'Algunas decisiones tienen 15 o 20 segundos. Si no eliges, el juego sigue.' },
                { icon: Clock3, title: '~30 minutos por sesión', text: 'Puedes pausar entre escenas: tu progreso se guarda al instante.' },
                { icon: Compass, title: 'Tu perfil al final', text: 'Desempeño, afinidad en 5 ejes y el camino que más se parece a ti.' },
              ].map((item) => (
                <div key={item.title} className="card p-6">
                  <item.icon className="size-6 text-accent" aria-hidden />
                  <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function Results({ careerModule, state }: { careerModule: CareerModule; state: SimulationState }) {
  const snapshot = progressSnapshot(careerModule, state);
  const branches = scoreBranches(careerModule, state);
  const aligned = branches.find((branch) => branch.aligned);
  const scenes = new Map(careerModule.sessions.flatMap((session) => session.scenes).map((scene) => [scene.id, scene]));

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="eyebrow">Módulo completado</p>
      <h2 className="mt-2 text-3xl font-bold">Tus resultados en {careerModule.company}</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Desempeño final</p>
          <p className="font-sans text-6xl font-bold text-ink">{snapshot.performance}</p>
          <p className="text-sm text-muted">de 100 · empezaste con {careerModule.initialPerformance}</p>
          <ul className="mt-6 grid gap-2">
            {snapshot.sessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between rounded-xl bg-mist px-4 py-2 text-sm">
                <span className="font-semibold">Sesión {session.number} · {session.title}</span>
                <span className="tabular-nums text-muted">{session.performanceStart ?? '—'} → {session.performanceEnd ?? '—'}</span>
              </li>
            ))}
          </ul>
          {aligned && (
            <div className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">{aligned.path}</p>
              <p className="mt-1 font-display text-xl font-bold">{aligned.title}</p>
              <p className="mt-1 text-sm text-ink-soft">
                Tu forma de decidir se parece a este camino ({aligned.axes.map((axis) => AFFINITY_SHORT_LABELS[axis].toLowerCase()).join(' y ')}).
                No es una predicción: es una pista.
              </p>
            </div>
          )}
        </div>
        <div className="card grid gap-6 p-6 md:grid-cols-2 md:items-center">
          <AffinityRadar values={snapshot.affinity.normalized} size={300} className="mx-auto" />
          <AffinityBars values={snapshot.affinity.normalized} />
        </div>
      </div>

      <h3 className="mt-12 text-2xl font-bold">Tu recorrido, decisión por decisión</h3>
      <ol className="mt-6 grid gap-3">
        {state.log.map((entry) => (
          <li key={`${entry.sceneId}-${entry.at}`} className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Escena {entry.sceneId} · {scenes.get(entry.sceneId)?.title}</p>
              <p className="font-semibold">{entry.label}{entry.timedOut ? ' ⏱' : ''}</p>
            </div>
            <DeltaChips performance={entry.performanceDelta} affinity={entry.affinityDelta} />
          </li>
        ))}
      </ol>
    </section>
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
