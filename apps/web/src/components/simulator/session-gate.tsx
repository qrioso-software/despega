'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, PartyPopper, Timer, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import type { ModuleView, ProgressView } from '@/lib/simulation-types';

/**
 * Entrada a una sesión. Aparece al volver otro día o justo después de terminar la
 * anterior: la siguiente se desbloquea al instante, sin depender del calendario.
 */
export function SessionGate({
  module,
  progress,
  justCompleted,
  busy,
  onStart,
}: {
  module: ModuleView;
  progress: ProgressView;
  justCompleted: number | null;
  busy: boolean;
  onStart: () => void;
}) {
  const session = progress.sessions.find((item) => item.number === progress.currentSessionNumber);
  if (!session) return null;
  const characters = Object.keys(module.characters);

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card mx-auto max-w-3xl overflow-hidden p-0">
      <div className="relative overflow-hidden bg-night px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand/30 blur-3xl" aria-hidden />
        {justCompleted ? (
          <p className="chip relative bg-good text-white"><CheckCircle2 className="size-4" aria-hidden /> Sesión {justCompleted} completada</p>
        ) : (
          <p className="eyebrow relative text-sun">{module.company} · {module.playerRole}</p>
        )}
        <h1 className="relative mt-4 text-4xl font-bold">Sesión {session.number}: {session.title}</h1>
        <p className="relative mt-3 max-w-xl text-white/75">{session.synopsis}</p>
        <div className="relative mt-6 flex -space-x-3">
          {characters.map((id) => (
            <CharacterAvatar key={id} characterId={id} mood="neutral" size={56} className="rounded-full ring-4 ring-night" decorative />
          ))}
        </div>
      </div>
      <div className="grid gap-6 p-6 sm:p-8">
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="flex items-center gap-2 text-sm text-ink-soft"><Clock3 className="size-4 text-accent" aria-hidden /> ~{session.estimatedMinutes} minutos</li>
          <li className="flex items-center gap-2 text-sm text-ink-soft"><Zap className="size-4 text-accent" aria-hidden /> Empieza con algo urgente</li>
          <li className="flex items-center gap-2 text-sm text-ink-soft"><Timer className="size-4 text-accent" aria-hidden /> Habrá reloj corriendo</li>
        </ul>
        {justCompleted && (
          <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-ink-soft">
            Puedes seguir ahora o volver otro día: tu progreso y tus decisiones ya están guardados.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/simulador/${module.careerId}`} className="btn btn-ghost">
            <ArrowLeft className="size-4" aria-hidden /> {justCompleted ? 'Volver más tarde' : 'Volver'}
          </Link>
          <button type="button" className="btn btn-primary min-h-12 px-6" onClick={onStart} disabled={busy}>
            {justCompleted ? `Seguir con la sesión ${session.number}` : `Comenzar la sesión ${session.number}`}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

export function ModuleComplete({ module }: { module: ModuleView }) {
  return (
    <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-2xl p-8 text-center sm:p-12">
      <PartyPopper className="mx-auto size-12 text-brand-strong" aria-hidden />
      <h1 className="mt-4 text-4xl font-bold">¡Terminaste {module.tagline.toLowerCase()}!</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        Tu desempeño y tu perfil de afinidad de {module.title} quedaron guardados. Míralos cuando quieras.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/simulador/${module.careerId}`} className="btn btn-primary min-h-12 px-6">
          Ver mis resultados <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/inicio" className="btn btn-ghost min-h-12 px-6">Ir a mi inicio</Link>
      </div>
    </motion.section>
  );
}
