'use client';

import type { PublicScene } from '@despega/simulator';
import { ArrowRight, ChevronRight, Compass, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import type { ModuleView } from '@/lib/simulation-types';
import { speakerName } from '../conversation';
import type { LineReveal } from './types';

/**
 * Proyección de carrera (escena 3.6): línea de tiempo narrada en primera persona que
 * se recorre tocando o deslizando, y una bifurcación donde se resalta el camino que más
 * se parece al perfil del estudiante.
 */
export function TimelineScreen({
  scene,
  module,
  reveal,
  locked,
  onContinue,
}: {
  scene: PublicScene;
  module: ModuleView;
  reveal: LineReveal;
  locked: boolean;
  onContinue: () => void;
}) {
  const interaction = scene.interaction;
  const [step, setStep] = useState(0);
  if (interaction.kind !== 'timeline') return null;
  const atFork = step >= interaction.stages.length;

  function next() {
    setStep((current) => Math.min(interaction.kind === 'timeline' ? interaction.stages.length : 0, current + 1));
  }

  return (
    <section className="card overflow-hidden p-0">
      <div className="bg-night px-6 py-6 text-white sm:px-10">
        {reveal.visibleLines.map((line, index) => (
          <div key={index} className="flex items-end gap-3">
            <CharacterAvatar characterId={line.speaker} mood={line.mood} talking={!reveal.done} size={64} decorative />
            <div>
              <p className="text-xs font-bold text-sun">{speakerName(module, line.speaker)}</p>
              <p className="mt-1 max-w-2xl rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-lg">{line.text}</p>
            </div>
          </div>
        ))}
      </div>

      <motion.div
        className="p-6 sm:p-10"
        onPanEnd={(_, info) => {
          if (info.offset.x < -60) next();
        }}
      >
        <ol className="relative grid gap-4 border-l-2 border-violet/30 pl-6">
          {interaction.stages.map((stage, index) => (
            <AnimatePresence key={stage.id}>
              {index <= step && (
                <motion.li
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                  className="relative"
                >
                  <span className="absolute -left-[33px] top-4 grid size-4 place-items-center rounded-full bg-violet ring-4 ring-violet-soft" aria-hidden />
                  <div className="rounded-2xl border border-line bg-paper p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet">{stage.period}</p>
                    <p className="font-display text-xl font-bold">{stage.title}</p>
                    <p className="mt-1 text-ink-soft">«{stage.narration}»</p>
                  </div>
                </motion.li>
              )}
            </AnimatePresence>
          ))}
        </ol>

        {atFork ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <p className="flex items-center gap-2 font-display text-2xl font-bold"><Compass className="size-6 text-brand" aria-hidden /> {interaction.fork.title}</p>
            <p className="mt-1 text-ink-soft">{interaction.fork.narration}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {interaction.branches.map((branch, index) => (
                <motion.article
                  key={branch.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.15 }}
                  className={`rounded-2xl border-2 p-5 ${branch.aligned ? 'border-violet bg-violet-soft shadow-soft' : 'border-line bg-white'}`}
                >
                  {branch.aligned && (
                    <span className="chip mb-3 bg-violet text-white"><Sparkles className="size-3.5" aria-hidden /> Se parece a ti</span>
                  )}
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{branch.path}</p>
                  <p className="mt-1 font-display text-xl font-bold">{branch.title}</p>
                  <p className="mt-2 text-sm text-ink-soft">«{branch.narration}»</p>
                  {branch.aligned && <p className="mt-3 text-sm font-semibold text-violet-strong">{interaction.alignmentNote}</p>}
                </motion.article>
              ))}
            </div>
          </motion.div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{atFork ? 'Así se ve el camino desde acá.' : `Etapa ${step + 1} de ${interaction.stages.length} · toca o desliza para avanzar`}</p>
          {atFork ? (
            <button type="button" className="btn btn-primary min-h-12 px-6" disabled={locked} onClick={onContinue}>
              {interaction.continueLabel} <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn btn-violet min-h-12 px-6" onClick={next}>
              {step === interaction.stages.length - 1 ? 'Ver la bifurcación' : 'Siguiente etapa'} <ChevronRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
