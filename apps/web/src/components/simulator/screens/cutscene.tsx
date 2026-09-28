'use client';

import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import { SkipButton, speakerName } from '../conversation';
import type { ScreenProps } from './types';

/** Cinemática: narración sobre fondo oscuro (cliffhanger 2.5, apertura 3.1). */
export function CutsceneScreen({ scene, module, reveal, interaction }: ScreenProps) {
  return (
    <section className="relative flex flex-1 flex-col overflow-hidden bg-night text-white lg:min-h-0">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/35 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />
      {scene.visual === 'complaints-chart' && <ComplaintsChart />}
      <div className="relative flex flex-1 flex-col lg:min-h-0 lg:overflow-y-auto">
        <div className="m-auto grid w-full max-w-2xl gap-5 px-6 py-12 sm:px-10 sm:py-16" aria-live="polite">
          <p className="eyebrow text-sun">{scene.clock ?? `Sesión ${scene.session.number}`}</p>
          {reveal.visibleLines.map((line, index) =>
            line.speaker === 'narrator' ? (
              <motion.p key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="font-display text-xl font-semibold leading-snug sm:text-3xl">
                {line.text}
              </motion.p>
            ) : (
              <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-3">
                <CharacterAvatar characterId={line.speaker} mood={line.mood} talking={!reveal.done && index === reveal.visibleLines.length - 1} size={56} decorative />
                <p className="rounded-xl rounded-bl-md bg-white/10 px-4 py-3 text-lg">
                  <strong className="block text-sm text-sun">{speakerName(module, line.speaker)}</strong>
                  {line.text}
                </p>
              </motion.div>
            ),
          )}
          {!reveal.done && (
            <div>
              <SkipButton onSkip={reveal.skip} dark />
            </div>
          )}
          {reveal.done && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="pt-2">
              {interaction}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Gráfico de quejas en la esquina, subiendo levemente (serie única, línea de 2 px). */
function ComplaintsChart() {
  const points = [30, 31, 29, 30, 32, 31, 33, 35, 36, 39, 41, 44];
  const width = 220;
  const height = 90;
  const max = 50;
  const path = points
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${(index / (points.length - 1)) * width},${height - (value / max) * height}`)
    .join(' ');
  return (
    <figure className="absolute bottom-6 right-6 hidden rounded-xl border border-white/10 bg-white/5 p-3 xl:block" aria-label="Gráfico de quejas de usuarios subiendo levemente">
      <figcaption className="mb-1 text-xs font-semibold text-white/70">Quejas de usuarios · últimas horas</figcaption>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke="rgb(255 255 255 / 0.15)" strokeWidth="1" />
        <motion.path d={`${path} L${width},${height} L0,${height} Z`} className="fill-sun" fillOpacity={0.12} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} />
        <motion.path d={path} fill="none" className="stroke-sun" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
      </svg>
    </figure>
  );
}
