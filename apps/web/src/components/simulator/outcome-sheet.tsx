'use client';

import { AFFINITY_SHORT_LABELS, type AffinityAxis, type AppliedOutcome } from '@despega/simulator';
import { ArrowRight, Sparkles, Timer } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { CharacterAvatar } from '@/components/characters/character-avatar';
import type { ModuleView } from '@/lib/simulation-types';
import { speakerName } from './conversation';

/**
 * Consecuencia visible de cada decisión: la reacción del personaje, lo que cambia en el
 * mundo y cómo se movieron el desempeño y el perfil. Nunca solo «correcto/incorrecto».
 */
export function OutcomeSheet({ outcome, module, onContinue }: { outcome: AppliedOutcome; module: ModuleView; onContinue: () => void }) {
  const [talking, setTalking] = useState(true);
  const continueRef = useRef<HTMLButtonElement>(null);
  const axes = (Object.entries(outcome.affinityDelta) as [AffinityAxis, number][]).filter(([, value]) => value !== 0);

  useEffect(() => {
    const timer = window.setTimeout(() => setTalking(false), 1_800);
    continueRef.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-5 sm:pb-5"
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      role="dialog"
      aria-modal="false"
      aria-labelledby="outcome-title"
    >
      <div className="card mx-auto max-w-3xl p-5 shadow-pop sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="outcome-title" className="text-xs font-bold uppercase tracking-wider text-muted">Consecuencia</h2>
          {outcome.timedOut && (
            <span className="chip bg-sun-soft text-[#6b4700]"><Timer className="size-3.5" aria-hidden /> Se acabó el tiempo</span>
          )}
        </div>
        <div className="mt-3 grid gap-3">
          {outcome.reactions.map((reaction, index) => (
            <motion.div
              key={`${reaction.speaker}-${index}`}
              className="flex items-end gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.5 }}
            >
              <CharacterAvatar characterId={reaction.speaker} mood={reaction.mood} talking={talking && index === 0} size={56} decorative />
              <div>
                <p className="text-xs font-bold text-muted">{speakerName(module, reaction.speaker)}</p>
                <p className="mt-0.5 rounded-2xl rounded-bl-md bg-mist px-4 py-2.5 text-ink">{reaction.text}</p>
              </div>
            </motion.div>
          ))}
          {outcome.narration && (
            <p className="flex items-start gap-2 rounded-2xl bg-sun-soft px-4 py-2.5 text-sm font-semibold text-[#6b4700]">
              <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden /> {outcome.narration}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap gap-1.5" aria-label="Cambios en tu puntaje">
            {outcome.performanceDelta !== 0 ? (
              <span className={`chip ${outcome.performanceDelta > 0 ? 'bg-good-soft text-[#0b6e51]' : 'bg-bad-soft text-[#a1262b]'}`}>
                {outcome.performanceDelta > 0 ? `▲ +${outcome.performanceDelta}` : `▼ ${outcome.performanceDelta}`} desempeño
              </span>
            ) : (
              <span className="chip bg-mist text-muted">Desempeño sin cambios</span>
            )}
            {axes.map(([axis, value]) => (
              <span key={axis} className="chip bg-violet-soft text-violet-strong">
                {value > 0 ? `+${value}` : value} {AFFINITY_SHORT_LABELS[axis].toLowerCase()}
              </span>
            ))}
          </div>
          <button ref={continueRef} type="button" className="btn btn-primary" onClick={onContinue}>
            Continuar <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
