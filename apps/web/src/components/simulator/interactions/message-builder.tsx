'use client';

import { MessageSquareOff, Plus, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { PlayerLine, speakerName } from '../conversation';
import type { InteractionProps } from './types';

/**
 * Construcción de mensaje (escenas 1.5 y 2.3): el jugador arma su respuesta combinando
 * frases del banco, en vez de elegir un mensaje ya escrito.
 */
export function MessageBuilderInteraction({ interaction, locked, outcome, onSubmit, module, playerName }: InteractionProps<'message-builder'>) {
  const [selected, setSelected] = useState<string[]>([]);
  const recipient = speakerName(module, interaction.recipient);
  const canSend = selected.length >= interaction.minBlocks && selected.length <= interaction.maxBlocks;
  const sent = outcome?.detail.kind === 'message-builder' ? outcome.detail.message : null;

  function toggle(blockId: string) {
    if (locked) return;
    setSelected((current) => {
      if (current.includes(blockId)) return current.filter((id) => id !== blockId);
      if (current.length >= interaction.maxBlocks) return current;
      return [...current, blockId];
    });
  }

  if (sent) {
    return sent.length === 0 ? (
      <p className="flex items-center justify-center gap-2 rounded-2xl bg-mist px-4 py-3 text-sm italic text-muted">
        <MessageSquareOff className="size-4" aria-hidden /> No le respondiste a {recipient}.
      </p>
    ) : (
      <PlayerLine text={sent.join(' ')} playerName={playerName} />
    );
  }

  const composed = selected.map((id) => interaction.blocks.find((block) => block.id === id)?.text).filter(Boolean);

  return (
    <div className="grid gap-4">
      <div className={`rounded-2xl border-2 ${interaction.channel === 'email' ? 'border-line bg-white' : 'border-accent/30 bg-accent-soft/30'} p-4`}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          {interaction.channel === 'email' ? `Responder a ${recipient}` : `Mensaje para ${recipient}`} · {selected.length}/{interaction.maxBlocks} frases
        </p>
        <div className="mt-2 min-h-16" aria-live="polite">
          {composed.length === 0 ? (
            <p className="text-sm text-muted">{interaction.prompt}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {selected.map((id) => {
                  const block = interaction.blocks.find((item) => item.id === id);
                  return block ? (
                    <motion.button
                      key={id}
                      type="button"
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      disabled={locked}
                      onClick={() => toggle(id)}
                      className="flex items-start gap-2 rounded-xl bg-accent px-3 py-2 text-left text-sm font-medium text-white"
                      aria-label={`Quitar: ${block.text}`}
                    >
                      <span>{block.text}</span>
                      <X className="mt-0.5 size-3.5 shrink-0 opacity-80" aria-hidden />
                    </motion.button>
                  ) : null;
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Banco de frases · toca para agregar</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2" role="group" aria-label="Banco de frases">
          {interaction.blocks.filter((block) => !selected.includes(block.id)).map((block) => (
            <button
              key={block.id}
              type="button"
              disabled={locked || selected.length >= interaction.maxBlocks}
              onClick={() => toggle(block.id)}
              className="flex items-start gap-2 rounded-xl border-2 border-line bg-white px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>{block.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {interaction.emptyOption && (
          <button type="button" className="btn btn-ghost" disabled={locked} onClick={() => onSubmit({ kind: 'message-builder', blockIds: [] })}>
            <MessageSquareOff className="size-4" aria-hidden /> {interaction.emptyOption.label}
          </button>
        )}
        <button
          type="button"
          className="btn btn-accent"
          disabled={!canSend || locked}
          onClick={() => onSubmit({ kind: 'message-builder', blockIds: selected })}
        >
          <Send className="size-4" aria-hidden /> Enviar
        </button>
      </div>
      {!canSend && selected.length > 0 && (
        <p className="text-right text-xs text-muted">Combina entre {interaction.minBlocks} y {interaction.maxBlocks} frases para enviar.</p>
      )}
    </div>
  );
}
