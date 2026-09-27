'use client';

import { DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { CheckCircle2, Inbox, Send, XCircle } from 'lucide-react';
import { useState } from 'react';
import { CountdownRing, useCountdown } from '../countdown';
import { DragBoard, DraggableCard, DropZone } from './dnd';
import type { InteractionProps } from './types';

const POOL = 'pool';

/** Clasificación con reloj (escena 1.3): tarjetas de reporte hacia dos categorías. */
export function ClassificationInteraction({ interaction, active, locked, outcome, onSubmit }: InteractionProps<'classification'>) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const complete = Object.keys(assignments).length === interaction.items.length;
  const { remaining, fraction } = useCountdown(interaction.timeLimitSeconds, active && !locked, () => {
    if (!locked) onSubmit({ kind: 'classification', assignments, timedOut: true });
  });
  const reveal = outcome?.detail.kind === 'classification' ? outcome.detail : null;

  function place(itemId: string, target: string) {
    if (locked) return;
    setAssignments((current) => {
      const next = { ...current };
      if (target === POOL) delete next[itemId];
      else next[itemId] = target;
      return next;
    });
    setSelected(null);
  }

  function onDragStart(event: DragStartEvent) {
    setDragging(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setDragging(null);
    if (event.over) place(String(event.active.id), String(event.over.id));
  }

  const pool = interaction.items.filter((item) => !assignments[item.id]);
  const draggingItem = interaction.items.find((item) => item.id === dragging);

  return (
    <DragBoard id={`classification-${interaction.items.map((item) => item.id).join('-')}`} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="grid gap-4">
        <div className="flex items-center gap-4 rounded-2xl bg-sun-soft p-3 pr-4">
          <CountdownRing remaining={remaining} fraction={fraction} size={64} />
          <div>
            <p className="text-sm font-bold text-sun-strong">{interaction.prompt}</p>
            <p className="mt-0.5 text-xs text-sun-strong/80">
              {Object.keys(assignments).length} de {interaction.items.length} reportes clasificados · Toca una tarjeta y luego su categoría, o arrástrala.
            </p>
          </div>
        </div>

        <DropZone id={POOL} disabled={locked} className="rounded-2xl border-2 border-dashed border-line bg-paper p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Inbox className="size-4" aria-hidden /> Bandeja de entrada ({pool.length})
          </p>
          {pool.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted">Todos los reportes están clasificados.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {pool.map((item) => (
                <DraggableCard
                  key={item.id}
                  id={item.id}
                  disabled={locked}
                  selected={selected === item.id}
                  onSelect={() => setSelected((current) => (current === item.id ? null : item.id))}
                  label={`Reporte de ${item.from}: ${item.title}. ${selected === item.id ? 'Seleccionado' : 'Toca para seleccionar'}`}
                  className="block w-full rounded-2xl"
                >
                  <ReportCard item={item} />
                </DraggableCard>
              ))}
            </div>
          )}
        </DropZone>

        <div className="grid gap-3 sm:grid-cols-2">
          {interaction.categories.map((category) => {
            const items = interaction.items.filter((item) => assignments[item.id] === category.id);
            return (
              <DropZone key={category.id} id={category.id} disabled={locked} className="rounded-2xl border-2 border-accent/30 bg-accent-soft/40 p-3">
                <button
                  type="button"
                  disabled={locked || !selected}
                  onClick={() => selected && place(selected, category.id)}
                  aria-label={`Ubicar en ${category.label} (${items.length} reportes)`}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-display text-lg font-bold transition-colors ${
                    selected && !locked ? 'bg-accent text-white hover:bg-accent-strong' : 'bg-white text-ink'
                  } disabled:cursor-default`}
                >
                  <span>{category.emoji} {category.label}</span>
                  <span className="text-sm font-semibold opacity-80">{items.length}</span>
                </button>
                <div className="mt-2 grid gap-2">
                  {items.map((item) => {
                    const correct = reveal?.correctItemIds.includes(item.id);
                    return (
                      <DraggableCard
                        key={item.id}
                        id={item.id}
                        disabled={locked}
                        onSelect={() => place(item.id, POOL)}
                        label={`${item.title} está en ${category.label}. Toca para devolverlo a la bandeja`}
                        className="block w-full rounded-2xl"
                      >
                        <ReportCard item={item} compact verdict={reveal ? (correct ? 'correct' : 'wrong') : undefined} />
                      </DraggableCard>
                    );
                  })}
                  {items.length === 0 && <p className="px-1 py-3 text-center text-sm text-muted">Suelta aquí los reportes</p>}
                </div>
              </DropZone>
            );
          })}
        </div>

        {reveal ? (
          <p className="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold text-ink">
            Clasificaste bien {reveal.correctCount} de {reveal.total} reportes.
            {pool.length > 0 && ' Los que quedaron en la bandeja no alcanzaste a clasificarlos.'}
          </p>
        ) : (
          <button
            type="button"
            className="btn btn-accent justify-self-end"
            disabled={!complete || locked}
            onClick={() => onSubmit({ kind: 'classification', assignments, timedOut: false })}
          >
            <Send className="size-4" aria-hidden /> Enviar clasificación a Marisol
          </button>
        )}
      </div>
      <DragOverlay>{draggingItem ? <ReportCard item={draggingItem} floating /> : null}</DragOverlay>
    </DragBoard>
  );
}

function ReportCard({
  item,
  compact = false,
  floating = false,
  verdict,
}: {
  item: { id: string; title: string; from?: string; body: string };
  compact?: boolean;
  floating?: boolean;
  verdict?: 'correct' | 'wrong';
}) {
  return (
    <div className={`rounded-2xl border bg-white p-3 ${floating ? 'rotate-2 shadow-pop' : 'shadow-sm'} ${verdict === 'wrong' ? 'border-bad/50' : verdict === 'correct' ? 'border-good/50' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Soporte · {item.from}</p>
        {verdict === 'correct' && <CheckCircle2 className="size-4 shrink-0 text-good" aria-label="Bien clasificado" />}
        {verdict === 'wrong' && <XCircle className="size-4 shrink-0 text-bad" aria-label="Mal clasificado" />}
      </div>
      <p className="mt-0.5 font-semibold text-ink">{item.title}</p>
      {!compact && <p className="mt-1 text-sm text-ink-soft">{item.body}</p>}
    </div>
  );
}
