'use client';

import type { AppliedOutcome, PublicScene, SceneResponse } from '@despega/simulator';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { beginSessionAction, reloadProgressAction, submitSceneAction } from '@/app/simulador/[careerId]/actions';
import type { ActionFailure, ModuleView, ProgressView, SubmitResult } from '@/lib/simulation-types';
import { PlayerHud } from './hud';
import { InteractionView } from './interactions';
import { OutcomeSheet } from './outcome-sheet';
import { CutsceneScreen } from './screens/cutscene';
import { NotificationScreen } from './screens/notification';
import { SummaryScreen } from './screens/summary';
import { TimelineScreen } from './screens/timeline';
import type { ScreenProps } from './screens/types';
import { VideoCallScreen } from './screens/video-call';
import { ChatScreen, DashboardScreen, InboxScreen, TaskBoardScreen } from './screens/workspace';
import { ModuleComplete, SessionGate } from './session-gate';
import { ScrollStage } from './stage';
import { useLineReveal } from './use-line-reveal';

type Phase = 'gate' | 'scene' | 'complete';

/** Pantallas de herramienta de oficina: se dibujan como espacio de trabajo de dos paneles. */
const WORKSPACE_SCREENS: ReadonlySet<PublicScene['screen']> = new Set(['chat', 'inbox', 'task-board', 'dashboard', 'video-call']);

const BLACKOUT_MS = 1_700;

/**
 * Reproductor del simulador. El servidor es la autoridad: cada respuesta se envía como
 * Server Action y vuelve con la consecuencia, el progreso y la escena siguiente.
 */
export function SimulatorPlayer({
  module,
  playerName,
  initialScene,
  initialProgress,
}: {
  module: ModuleView;
  playerName: string;
  initialScene: PublicScene | null;
  initialProgress: ProgressView;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [scene, setScene] = useState<PublicScene | null>(initialScene);
  const [phase, setPhase] = useState<Phase>(initialScene ? 'scene' : initialProgress.status === 'completed' ? 'complete' : 'gate');
  const [justCompleted, setJustCompleted] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<AppliedOutcome | null>(null);
  const [nextScene, setNextScene] = useState<PublicScene | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [error, setError] = useState<{ message: string; retry?: () => void } | null>(null);
  const [sceneRun, setSceneRun] = useState(0);
  const startedAt = useRef(0);
  const reveal = useLineReveal(scene?.lines ?? [], `${scene?.id ?? 'none'}-${sceneRun}`);

  useEffect(() => {
    startedAt.current = performance.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scene?.id, sceneRun]);

  function showScene(next: PublicScene | null, nextProgress: ProgressView, completedSession?: number) {
    setOutcome(null);
    setNextScene(null);
    setSubmitted(false);
    setError(null);
    if (next) {
      setScene(next);
      setPhase('scene');
      setSceneRun((run) => run + 1);
      return;
    }
    setScene(null);
    if (nextProgress.status === 'completed') {
      setPhase('complete');
    } else {
      setJustCompleted(completedSession ?? null);
      setPhase('gate');
    }
  }

  function handleFailure(failure: ActionFailure, retry?: () => void) {
    if (failure.code === 'UNAUTHENTICATED') {
      router.push(`/ingresar?next=${encodeURIComponent(`/simulador/${module.careerId}/jugar`)}&motivo=sesion-vencida`);
      return;
    }
    if (['CONFLICT', 'SCENE_MISMATCH', 'SESSION_NOT_STARTED', 'SESSION_LOCKED', 'MODULE_COMPLETED'].includes(failure.code)) {
      setError({ message: failure.message });
      void resync();
      return;
    }
    setError({ message: failure.message, retry });
  }

  async function resync() {
    const result = await reloadProgressAction({ careerId: module.careerId });
    if (!result.ok) {
      setError({ message: result.message, retry: () => void resync() });
      return;
    }
    setProgress(result.progress);
    showScene(result.scene, result.progress);
  }

  async function begin() {
    if (!progress.currentSessionNumber || busy) return;
    setBusy(true);
    setError(null);
    const result = await beginSessionAction({ careerId: module.careerId, sessionNumber: progress.currentSessionNumber }).catch(() => null);
    setBusy(false);
    if (!result) return setError({ message: 'No pudimos conectar con el servidor.', retry: () => void begin() });
    if (!result.ok) return handleFailure(result, () => void begin());
    setJustCompleted(null);
    setProgress(result.progress);
    showScene(result.scene, result.progress);
  }

  async function submit(response: SceneResponse) {
    if (!scene || submitted) return;
    setSubmitted(true);
    await send(scene, response, Math.round(performance.now() - startedAt.current));
  }

  async function send(current: PublicScene, response: SceneResponse, elapsedMs: number) {
    setBusy(true);
    setError(null);
    let result: SubmitResult | null = null;
    try {
      result = await submitSceneAction({
        careerId: module.careerId,
        runId: progress.runId,
        version: progress.version,
        sceneId: current.id,
        elapsedMs,
        response,
      });
    } catch {
      result = null;
    }
    setBusy(false);
    const retry = () => void send(current, response, elapsedMs);
    if (!result) return setError({ message: 'No pudimos conectar con el servidor. Tu decisión no se perdió.', retry });
    if (!result.ok) return handleFailure(result, retry);

    const { outcome: applied, scene: upcoming, progress: updated } = result;
    setProgress(updated);
    if (applied.detail.kind !== 'continue') {
      setOutcome(applied);
      setNextScene(upcoming);
      return;
    }
    const completedSession = applied.sessionCompleted ? current.session.number : undefined;
    if (current.interaction.kind === 'none' && current.interaction.cutToBlack) {
      setBlackout(true);
      window.setTimeout(() => {
        showScene(upcoming, updated, completedSession);
        window.setTimeout(() => setBlackout(false), 150);
      }, BLACKOUT_MS);
      return;
    }
    showScene(upcoming, updated, completedSession);
  }

  function continueAfterOutcome() {
    if (!outcome) return;
    showScene(nextScene, progress, outcome.sessionCompleted ? scene?.session.number : undefined);
  }

  const locked = submitted || busy;
  // Mientras se muestra la consecuencia, el HUD refleja el mundo que viene (p. ej. las
  // quejas dejan de subir tras el diagnóstico correcto).
  const hud = outcome ? (nextScene?.hud ?? scene?.hud) : scene?.hud;
  // En las herramientas de oficina la consecuencia se acopla al panel del jugador.
  const docked = Boolean(phase === 'scene' && scene && WORKSPACE_SCREENS.has(scene.screen));
  const outcomeSheet = outcome ? (
    <OutcomeSheet key={outcome.sceneId} outcome={outcome} module={module} onContinue={continueAfterOutcome} docked={docked} />
  ) : null;

  return (
    <div className="bg-dots flex min-h-dvh flex-col bg-paper lg:h-dvh lg:overflow-hidden">
      <PlayerHud module={module} scene={scene} hud={hud} progress={progress} frozen={Boolean(outcome && !nextScene)} />

      <main className={`flex flex-1 flex-col lg:min-h-0 ${outcome && !docked ? 'pb-64' : ''}`}>
        {error && (
          <div role="alert" className="mx-3 mt-3 flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad-strong sm:mx-6">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{error.message}</span>
            {error.retry && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={error.retry} disabled={busy}>
                <RotateCcw className="size-4" aria-hidden /> Reintentar
              </button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'gate' && (
            <motion.div key="gate" exit={{ opacity: 0 }} className="flex flex-1 flex-col lg:min-h-0">
              <ScrollStage center>
                <SessionGate module={module} progress={progress} justCompleted={justCompleted} busy={busy} onStart={() => void begin()} />
              </ScrollStage>
            </motion.div>
          )}
          {phase === 'complete' && (
            <motion.div key="complete" className="flex flex-1 flex-col lg:min-h-0">
              <ScrollStage center>
                <ModuleComplete module={module} />
              </ScrollStage>
            </motion.div>
          )}
          {phase === 'scene' && scene && (
            <motion.div
              key={`${scene.id}-${sceneRun}`}
              className="flex flex-1 flex-col lg:min-h-0"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <SceneStage
                scene={scene}
                module={module}
                playerName={playerName}
                reveal={reveal}
                locked={locked}
                outcome={outcome}
                outcomeCard={docked ? outcomeSheet : undefined}
                onSubmit={(response) => void submit(response)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>{!docked && outcomeSheet}</AnimatePresence>

      <AnimatePresence>
        {blackout && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SceneStage({
  scene,
  module,
  playerName,
  reveal,
  locked,
  outcome,
  outcomeCard,
  onSubmit,
}: Omit<ScreenProps, 'interaction' | 'outcome'> & {
  locked: boolean;
  outcome: AppliedOutcome | null;
  outcomeCard?: ReactNode;
  onSubmit: (response: SceneResponse) => void;
}) {
  if (scene.screen === 'summary') {
    return (
      <ScrollStage>
        <SummaryScreen scene={scene} module={module} locked={locked} onContinue={() => onSubmit({ kind: 'continue' })} />
      </ScrollStage>
    );
  }
  if (scene.screen === 'timeline') {
    return (
      <ScrollStage>
        <TimelineScreen scene={scene} module={module} reveal={reveal} locked={locked} onContinue={() => onSubmit({ kind: 'continue' })} />
      </ScrollStage>
    );
  }

  const interaction = (
    <InteractionView
      scene={scene}
      active={reveal.done}
      locked={locked || !reveal.done}
      outcome={outcome}
      onSubmit={onSubmit}
      module={module}
      playerName={playerName}
      continueVariant={scene.screen === 'cutscene' ? 'light' : 'primary'}
    />
  );
  const props: ScreenProps = { scene, module, playerName, reveal, interaction, outcome: outcomeCard };

  switch (scene.screen) {
    case 'notification':
      return <NotificationScreen {...props} />;
    case 'video-call':
      return <VideoCallScreen {...props} />;
    case 'chat':
      return <ChatScreen {...props} />;
    case 'inbox':
      return <InboxScreen {...props} />;
    case 'task-board':
      return <TaskBoardScreen {...props} />;
    case 'dashboard':
      return <DashboardScreen {...props} />;
    case 'cutscene':
      return <CutsceneScreen {...props} />;
    default:
      return null;
  }
}
