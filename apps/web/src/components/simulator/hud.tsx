'use client';

import { COMPLAINT_INTERVAL_MS, type HudState, type PublicScene } from '@despega/simulator';
import { BarChart3, CheckCircle2, Clock, LogOut, Rocket, TrendingUp, X } from 'lucide-react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ModuleView, ProgressView } from '@/lib/simulation-types';
import { AffinityBars, AffinityRadar } from './affinity-radar';

/**
 * HUD persistente: sesión y escena, hora de la historia, contadores del mundo (quejas,
 * ventana de lanzamiento), desempeño 0–100 y acceso al perfil de afinidad.
 */
export function PlayerHud({
  module,
  scene,
  hud,
  progress,
  frozen,
}: {
  module: ModuleView;
  scene: PublicScene | null;
  hud: HudState | undefined;
  progress: ProgressView;
  frozen: boolean;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const session = progress.sessions.find((item) => item.number === (scene?.session.number ?? progress.currentSessionNumber));

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-5">
        <Link href={`/simulador/${module.careerId}`} className="flex items-center gap-2" aria-label="Salir al resumen de la carrera (tu progreso queda guardado)">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Rocket className="size-5" aria-hidden /></span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-muted">
            {module.company} · {session ? `Sesión ${session.number}` : module.tagline}
          </p>
          <p className="truncate font-display text-base font-bold text-ink">
            {scene ? scene.title : session?.title ?? module.tagline}
          </p>
          {scene && (
            <div className="mt-1 flex h-1.5 max-w-56 gap-1" aria-label={`Escena ${scene.sceneNumber} de ${scene.sceneCount}`}>
              {Array.from({ length: scene.sceneCount }, (_, index) => (
                <span key={index} className={`flex-1 rounded-full ${index < scene.sceneNumber ? 'bg-violet' : 'bg-line'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-2 sm:order-none sm:w-auto">
          {scene?.clock && (
            <span className="chip bg-surface text-ink-soft ring-1 ring-line"><Clock className="size-3.5" aria-hidden /> {scene.clock}</span>
          )}
          {hud?.complaints && <ComplaintsChip key={`${scene?.id}-${hud.complaints.count}`} count={hud.complaints.count} rising={hud.complaints.rising && !frozen} />}
          {hud?.launchWindow && (
            <LaunchWindowChip key={`${scene?.id}-${hud.launchWindow.seconds}`} seconds={hud.launchWindow.seconds} closed={hud.launchWindow.closed} frozen={frozen} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <PerformancePill value={progress.performance} />
          <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={() => setProfileOpen(true)} aria-haspopup="dialog">
            <BarChart3 className="size-4" aria-hidden /> <span className="hidden sm:inline">Perfil</span>
          </button>
          <Link href={`/simulador/${module.careerId}`} className="btn btn-ghost min-h-10 px-3" title="Salir (tu progreso queda guardado)">
            <LogOut className="size-4" aria-hidden /> <span className="sr-only">Salir del simulador</span>
          </Link>
        </div>
      </div>
      <AnimatePresence>
        {profileOpen && <ProfileDialog progress={progress} onClose={() => setProfileOpen(false)} />}
      </AnimatePresence>
    </header>
  );
}

function ComplaintsChip({ count, rising }: { count: number; rising: boolean }) {
  const [value, setValue] = useState(count);
  useEffect(() => {
    if (!rising) return;
    const timer = window.setInterval(() => setValue((current) => Math.min(999, current + 1)), COMPLAINT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [rising]);

  return (
    <span className={`chip ${rising ? 'bg-bad-soft text-[#a1262b]' : 'bg-good-soft text-[#0b6e51]'}`} aria-live="off">
      {rising ? <TrendingUp className="size-3.5" aria-hidden /> : <CheckCircle2 className="size-3.5" aria-hidden />}
      <motion.span key={value} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="tabular-nums">{value}</motion.span>
      {rising ? 'quejas y subiendo' : 'quejas · estable'}
    </span>
  );
}

function LaunchWindowChip({ seconds, closed, frozen }: { seconds: number; closed: boolean; frozen: boolean }) {
  const [value, setValue] = useState(seconds);
  const running = !closed && !frozen && value > 0;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setValue((current) => Math.max(0, current - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [running]);

  if (closed) {
    return <span className="chip bg-good-soft text-[#0b6e51]"><CheckCircle2 className="size-3.5" aria-hidden /> Lanzamiento decidido</span>;
  }
  const minutes = Math.floor(value / 60);
  const rest = value % 60;
  const urgent = value <= 5 * 60;
  return (
    <span className={`chip ${urgent ? 'bg-bad-soft text-[#a1262b]' : 'bg-sun-soft text-[#6b4700]'}`} role="timer" aria-label={`Ventana de lanzamiento: ${minutes} minutos y ${rest} segundos`}>
      <Rocket className="size-3.5" aria-hidden /> Ventana de lanzamiento
      <span className="tabular-nums">{String(minutes).padStart(2, '0')}:{String(rest).padStart(2, '0')}</span>
    </span>
  );
}

function PerformancePill({ value }: { value: number }) {
  const shown = useMotionValue(value);
  const rounded = useTransform(shown, (latest) => Math.round(latest));
  const previous = useRef(value);
  const [delta, setDelta] = useState<{ amount: number; id: number } | null>(null);

  useEffect(() => {
    const change = value - previous.current;
    previous.current = value;
    const controls = animate(shown, value, { duration: 0.9, ease: 'easeOut' });
    if (change !== 0) {
      setDelta({ amount: change, id: Date.now() });
      const timer = window.setTimeout(() => setDelta(null), 2_400);
      return () => {
        controls.stop();
        window.clearTimeout(timer);
      };
    }
    return () => controls.stop();
  }, [shown, value]);

  return (
    <div className="relative flex items-center gap-2 rounded-full bg-surface py-1 pl-3 pr-1.5 ring-1 ring-line" role="meter" aria-label="Desempeño" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <span className="text-xs font-bold text-muted">Desempeño</span>
      <span className="h-2 w-16 overflow-hidden rounded-full bg-violet-soft sm:w-24" aria-hidden>
        <span className="block h-full rounded-full bg-violet transition-[width] duration-700" style={{ width: `${value}%` }} />
      </span>
      <motion.span className="min-w-9 rounded-full bg-violet px-2 py-0.5 text-center text-sm font-bold text-white">{rounded}</motion.span>
      <AnimatePresence>
        {delta && (
          <motion.span
            key={delta.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 18 }}
            exit={{ opacity: 0 }}
            className={`pointer-events-none absolute right-2 top-full rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-soft ${delta.amount > 0 ? 'bg-good' : 'bg-bad'}`}
          >
            {delta.amount > 0 ? `+${delta.amount}` : delta.amount}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileDialog({ progress, onClose }: { progress: ProgressView; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end bg-night/40 p-3 sm:place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="card max-h-[90dvh] w-full max-w-2xl overflow-y-auto p-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Hasta ahora</p>
            <h2 id="profile-title" className="text-2xl font-bold">Tu perfil de afinidad</h2>
            <p className="mt-1 text-sm text-muted">Sin bien ni mal: muestra cómo estás decidiendo.</p>
          </div>
          <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={onClose} autoFocus>
            <X className="size-4" aria-hidden /> <span className="sr-only">Cerrar</span>
          </button>
        </div>
        <div className="mt-4 grid items-center gap-6 sm:grid-cols-2">
          <AffinityRadar values={progress.affinity.normalized} unavailable={progress.affinity.unavailable} size={280} className="mx-auto" />
          <AffinityBars values={progress.affinity.normalized} unavailable={progress.affinity.unavailable} />
        </div>
      </motion.div>
    </motion.div>
  );
}
