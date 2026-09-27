'use client';

import { ArrowRight, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { CountdownRing, RiskMeter, useCountdown } from '../countdown';
import { OPTION_LETTERS, type InteractionProps } from './types';

/** Diálogo con 2–3 opciones; con reloj visible cuando es una decisión con tiempo límite. */
export function DialogueInteraction({ interaction, active, locked, outcome, onSubmit }: InteractionProps<'dialogue'>) {
  const [choice, setChoice] = useState<string | null>(null);
  const timed = Boolean(interaction.timeLimitSeconds);
  const { remaining, fraction } = useCountdown(interaction.timeLimitSeconds, active && !locked && timed, () => {
    if (!locked) onSubmit({ kind: 'timeout' });
  });
  const revealedChoice = outcome?.detail.kind === 'dialogue' ? outcome.detail.optionId : choice;

  function choose(optionId: string) {
    if (locked) return;
    setChoice(optionId);
    onSubmit({ kind: 'dialogue', optionId });
  }

  return (
    <div className="grid gap-3">
      {interaction.prompt && <p className="font-display text-lg font-bold text-ink">{interaction.prompt}</p>}
      {timed && (
        <div className="flex items-center gap-4 rounded-2xl bg-sun-soft p-3 pr-4">
          <CountdownRing remaining={remaining} fraction={fraction} size={64} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-sun-strong">
              {outcome?.timedOut ? 'Se acabó el tiempo.' : `Tienes ${interaction.timeLimitSeconds} segundos para decidir.`}
            </p>
            {interaction.riskMeter && (
              <div className="mt-2">
                <RiskMeter fraction={fraction} />
              </div>
            )}
          </div>
        </div>
      )}
      {interaction.hint && (
        <p className="flex items-start gap-2 rounded-2xl bg-good-soft px-4 py-2.5 text-sm font-semibold text-good-strong">
          <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden /> {interaction.hint}
        </p>
      )}
      <div className="grid gap-2.5" role="group" aria-label="Opciones de respuesta">
        {interaction.options.map((option, index) => {
          const chosen = revealedChoice === option.id;
          const dimmed = locked && !chosen;
          return (
            <motion.button
              key={option.id}
              type="button"
              disabled={locked}
              onClick={() => choose(option.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: dimmed ? 0.45 : 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`group flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-colors ${
                chosen ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line bg-white text-ink hover:border-accent/60 hover:bg-accent-soft/40'
              } disabled:cursor-default`}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold ${chosen ? 'bg-accent text-white' : 'bg-mist text-ink-soft'}`}>
                {OPTION_LETTERS[index]}
              </span>
              <span className="flex-1">{option.label}</span>
              {!locked && <ArrowRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
