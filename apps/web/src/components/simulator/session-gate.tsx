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
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card mx-auto max-w-3xl overflow-hidden shadow-soft">
      <div className="relative overflow-hidden bg-night px-6 py-9 text-white sm:px-10 sm:py-10">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand/25 blur-3xl" aria-hidden />
        <div className="relative">
          {justCompleted ? (
            <p className="chip bg-good text-white"><CheckCircle2 className="size-4" aria-hidden /> Sesión {justCompleted} completada</p>
          ) : (
            <p className="text-sm font-semibold text-white/70">{module.company} · {module.playerRole}</p>
          )}
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-sun">Sesión {session.number}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{session.title}</h1>
          <p className="mt-3 max-w-xl text-white/75">{session.synopsis}</p>
          <div className="mt-6 flex -space-x-3">
            {characters.map((id) => (
              <CharacterAvatar key={id} characterId={id} mood="neutral" size={52} className="rounded-full ring-4 ring-night" decorative />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6 p-6 sm:p-8">
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Clock3, text: `~${session.estimatedMinutes} minutos` },
            { icon: Zap, text: 'Empieza con algo urgente' },
            { icon: Timer, text: 'Habrá reloj corriendo' },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-3.5 py-3 text-sm font-medium text-ink-soft">
              <item.icon className="size-4 shrink-0 text-accent" aria-hidden /> {item.text}
            </li>
          ))}
        </ul>
        {justCompleted && (
          <p className="text-sm text-muted">
            Puedes seguir ahora o volver otro día: tu progreso y tus decisiones ya están guardados.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <Link href={`/simulador/${module.careerId}`} className="btn btn-ghost btn-lg">
            <ArrowLeft className="size-4" aria-hidden /> {justCompleted ? 'Volver más tarde' : 'Volver'}
          </Link>
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart} disabled={busy}>
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
    <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-2xl p-8 text-center shadow-soft sm:p-12">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand-strong"><PartyPopper className="size-8" aria-hidden /></span>
      <h1 className="mt-5 text-3xl font-bold sm:text-4xl">¡Terminaste {module.tagline.toLowerCase()}!</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        Tu desempeño y tu perfil de afinidad de {module.title} quedaron guardados. Míralos cuando quieras.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/simulador/${module.careerId}`} className="btn btn-primary btn-lg">
          Ver mis resultados <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/inicio" className="btn btn-ghost btn-lg">Ir a mi inicio</Link>
      </div>
    </motion.section>
  );
}
