'use client';

import { Activity, ThumbsDown, ThumbsUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { InteractionProps } from './types';

const POSITIVE = [
  '¡Por fin puedo pagar sin que se trabe!',
  'Me encanta el nuevo mensaje de «procesando».',
  'Pedido confirmado en dos segundos 🙌',
  'Ahora sí confío en la app.',
  'Se siente mucho más rápida.',
];
const NEGATIVE = [
  'Me cobró el envío raro…',
  'Se me cerró al abrir mis pedidos.',
  'El correo de confirmación no llega.',
  'Toqué dos veces y tengo dos pedidos 😤',
  'Sigue fallando con mi señal.',
];

type Reaction = { id: number; positive: boolean; text: string };

/**
 * Dashboard de reacciones en vivo (escena 3.3). No hay reloj: la tensión viene de los
 * 👍/👎 que siguen llegando. El resultado depende del desempeño acumulado.
 */
export function LiveDecisionInteraction({ interaction, locked, outcome, onSubmit }: InteractionProps<'live-decision'>) {
  const result = outcome?.detail.kind === 'live-decision' ? outcome.detail : null;
  const target = result?.dashboard.positivePct ?? interaction.baseline.positivePct;
  const [counts, setCounts] = useState(() => ({
    up: Math.round(interaction.baseline.positivePct * 1.2),
    down: Math.round((100 - interaction.baseline.positivePct) * 1.2),
  }));
  const [feed, setFeed] = useState<Reaction[]>([]);
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    let sequence = 0;
    const timer = window.setInterval(() => {
      const batch = result ? 4 : 1 + Math.floor(Math.random() * 2);
      let up = 0;
      let down = 0;
      for (let index = 0; index < batch; index += 1) {
        if (Math.random() * 100 < target) up += 1;
        else down += 1;
      }
      setCounts((current) => ({ up: current.up + up, down: current.down + down }));
      const positive = up >= down;
      const pool = positive ? POSITIVE : NEGATIVE;
      sequence += 1;
      const reaction: Reaction = { id: Date.now() + sequence, positive, text: pool[Math.floor(Math.random() * pool.length)]! };
      setFeed((current) => [reaction, ...current].slice(0, 4));
    }, result ? 380 : 900);
    return () => window.clearInterval(timer);
  }, [result, target]);

  const total = counts.up + counts.down;
  const share = total > 0 ? Math.round((counts.up / total) * 100) : 0;
  const chosen = result?.optionId ?? choice;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
        <div className="rounded-2xl bg-good-soft p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-good-strong"><ThumbsUp className="size-4" aria-hidden /> Me gusta</p>
          <p className="mt-1 font-sans text-4xl font-bold text-ink">{counts.up}</p>
        </div>
        <div className="rounded-2xl bg-bad-soft p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-bad-strong"><ThumbsDown className="size-4" aria-hidden /> No me gusta</p>
          <p className="mt-1 font-sans text-4xl font-bold text-ink">{counts.down}</p>
        </div>
        <div className="rounded-2xl bg-mist p-4">
          <p className="flex items-center justify-between text-sm font-semibold text-ink-soft">
            <span className="flex items-center gap-1.5"><Activity className="size-4" aria-hidden /> Reacciones positivas</span>
            <span className="text-ink">{share}%</span>
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-good-soft" role="meter" aria-label="Reacciones positivas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={share}>
            <div className="h-full rounded-full bg-good transition-[width] duration-500" style={{ width: `${share}%` }} />
          </div>
          <p className="mt-2 text-sm font-semibold text-ink" aria-live="polite">{result ? result.dashboard.headline : interaction.baseline.note}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-3" aria-label="Reacciones recientes de usuarios">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted">En vivo</p>
        <ul className="mt-2 grid gap-1.5">
          <AnimatePresence initial={false}>
            {feed.map((reaction) => (
              <motion.li
                key={reaction.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm"
              >
                {reaction.positive ? <ThumbsUp className="size-4 shrink-0 text-good" aria-label="Positiva" /> : <ThumbsDown className="size-4 shrink-0 text-bad" aria-label="Negativa" />}
                <span className="text-ink-soft">{reaction.text}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div>
        <p className="font-display text-lg font-bold">{interaction.prompt}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3" role="group" aria-label="Decisión de lanzamiento">
          {interaction.options.map((option) => {
            const selected = chosen === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  setChoice(option.id);
                  onSubmit({ kind: 'live-decision', optionId: option.id });
                }}
                className={`rounded-2xl border-2 p-4 text-left transition-colors disabled:cursor-default ${
                  selected ? 'border-accent bg-accent-soft' : locked ? 'border-line bg-white opacity-50' : 'border-line bg-white hover:border-accent/60'
                }`}
              >
                <span className="block font-display text-lg font-bold text-ink">{option.label}</span>
                {option.description && <span className="mt-1 block text-sm text-ink-soft">{option.description}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
