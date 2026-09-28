'use client';

import type { PublicScene } from '@despega/simulator';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { SkipButton } from './conversation';

type InteractionKind = PublicScene['interaction']['kind'];

/** Mini-juegos que necesitan más ancho que una lista de opciones. */
const WIDE_KINDS: ReadonlySet<InteractionKind> = new Set(['classification', 'prioritization', 'matching', 'sequence', 'live-decision']);

const ACTION_LABELS: Partial<Record<InteractionKind, string>> = {
  dialogue: 'Tu respuesta',
  'message-builder': 'Tu mensaje',
  classification: 'Tu tarea',
  sequence: 'Tu tarea',
  prioritization: 'Tu tarea',
  matching: 'Tu tarea',
  'live-decision': 'Tu decisión',
  none: 'Siguiente paso',
};

/**
 * Espacio de trabajo a pantalla completa: a la izquierda la herramienta de PixelForge
 * (lo que pasa en el mundo) y a la derecha el panel del jugador (lo que decide). En
 * escritorio cada panel tiene su propio desplazamiento; en móvil se apilan y la
 * consecuencia queda pegada al borde inferior.
 */
export function SceneWorkspace({
  kind,
  world,
  interaction,
  ready,
  onSkip,
  outcome,
}: {
  kind: InteractionKind;
  world: ReactNode;
  interaction: ReactNode;
  /** La interacción aparece cuando termina de revelarse la conversación. */
  ready: boolean;
  onSkip?: () => void;
  outcome?: ReactNode;
}) {
  const wide = WIDE_KINDS.has(kind);
  const label = ACTION_LABELS[kind] ?? 'Tu turno';

  return (
    <div
      className={`flex flex-1 flex-col lg:grid lg:min-h-0 ${
        wide ? 'lg:grid-cols-[minmax(22rem,5fr)_minmax(0,7fr)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)]'
      }`}
    >
      <div className="flex flex-col lg:min-h-0">{world}</div>
      <section aria-label={label} className="@container flex flex-col border-t border-line bg-paper lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-accent">{label}</h2>
          {ready ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {interaction}
            </motion.div>
          ) : (
            <Waiting onSkip={onSkip} />
          )}
        </div>
        {outcome && <div className="sticky bottom-0 z-10 px-3 pb-3 sm:px-4 sm:pb-4">{outcome}</div>}
      </section>
    </div>
  );
}

function Waiting({ onSkip }: { onSkip?: () => void }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
      <span className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-2 rounded-full bg-placeholder"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }}
          />
        ))}
      </span>
      <p className="max-w-xs text-sm text-muted">Lee lo que está pasando: tu turno llega enseguida.</p>
      {onSkip && <SkipButton onSkip={onSkip} />}
    </div>
  );
}

/** Escenario para pantallas tipo página (entrada a sesión, resúmenes, proyección). */
export function ScrollStage({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return (
    <div className="flex flex-1 flex-col lg:min-h-0 lg:overflow-y-auto">
      <div className={`mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-5 sm:px-6 sm:py-8 ${center ? 'justify-center' : ''}`}>
        {children}
      </div>
    </div>
  );
}
