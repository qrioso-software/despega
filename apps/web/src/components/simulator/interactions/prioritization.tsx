'use client';

import { DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import type { PrioritizationTask } from '@despega/simulator';
import { CalendarCheck, CircleSlash, ListTodo, Send } from 'lucide-react';
import { useState } from 'react';
import { DragBoard, DraggableCard, DropZone } from './dnd';
import type { InteractionProps } from './types';

const POOL = 'pending';

/** Priorización (escena 2.4): 4 tareas y solo 3 espacios. La descartada vuelve en la sesión 3. */
export function PrioritizationInteraction({ interaction, locked, outcome, onSubmit }: InteractionProps<'prioritization'>) {
  const [slots, setSlots] = useState<(string | null)[]>(() => Array.from({ length: interaction.slots }, () => null));
  const [dragging, setDragging] = useState<string | null>(null);
  const reveal = outcome?.detail.kind === 'prioritization' ? outcome.detail : null;
  const pending = interaction.tasks.filter((task) => !slots.includes(task.id));
  const full = slots.every(Boolean);

  function addToBoard(taskId: string, slotIndex?: number) {
    if (locked) return;
    setSlots((current) => {
      const next = current.map((id) => (id === taskId ? null : id));
      const target = slotIndex ?? next.findIndex((id) => id === null);
      if (target < 0) return current;
      next[target] = taskId;
      return next;
    });
  }

  function removeFromBoard(taskId: string) {
    if (locked) return;
    setSlots((current) => current.map((id) => (id === taskId ? null : id)));
  }

  function onDragEnd(event: DragEndEvent) {
    setDragging(null);
    if (!event.over) return;
    const taskId = String(event.active.id);
    const target = String(event.over.id);
    if (target === POOL) removeFromBoard(taskId);
    else addToBoard(taskId, Number(target.replace('slot-', '')));
  }

  const draggingTask = interaction.tasks.find((task) => task.id === dragging);

  return (
    <DragBoard id="prioritization-board" onDragStart={(event) => setDragging(String(event.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="grid gap-4">
        <p className="text-sm font-semibold text-ink-soft">{interaction.prompt} Toca una tarea para moverla o arrástrala.</p>
        <div className="grid gap-4 @2xl:grid-cols-2">
          <DropZone id={POOL} disabled={locked} className="rounded-xl bg-mist p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
              {reveal ? <CircleSlash className="size-4" aria-hidden /> : <ListTodo className="size-4" aria-hidden />}
              {reveal ? 'Queda fuera esta semana' : `Pendientes (${pending.length})`}
            </p>
            <div className="grid gap-2">
              {pending.map((task) => (
                <DraggableCard
                  key={task.id}
                  id={task.id}
                  disabled={locked}
                  onSelect={() => addToBoard(task.id)}
                  label={`${task.title}. Toca para agregarla al tablero`}
                  className="block w-full rounded-xl"
                >
                  <TaskCard task={task} discarded={Boolean(reveal)} />
                </DraggableCard>
              ))}
            </div>
          </DropZone>
          <div className="rounded-xl border-2 border-good/30 bg-good-soft/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-good-strong">
              <CalendarCheck className="size-4" aria-hidden /> Tablero de esta semana ({slots.filter(Boolean).length}/{interaction.slots})
            </p>
            <div className="grid gap-2">
              {slots.map((taskId, index) => {
                const task = interaction.tasks.find((item) => item.id === taskId);
                return (
                  <DropZone key={index} id={`slot-${index}`} disabled={locked} className="min-h-20 rounded-xl border-2 border-dashed border-good/30 bg-white/70">
                    {task ? (
                      <DraggableCard
                        id={task.id}
                        disabled={locked}
                        onSelect={() => removeFromBoard(task.id)}
                        label={`${task.title} está en el tablero. Toca para devolverla a pendientes`}
                        className="block w-full rounded-xl"
                      >
                        <TaskCard task={task} />
                      </DraggableCard>
                    ) : (
                      <p className="grid h-20 place-items-center text-sm text-muted">Espacio {index + 1}</p>
                    )}
                  </DropZone>
                );
              })}
            </div>
          </div>
        </div>
        {!reveal && (
          <button
            type="button"
            className="btn btn-accent justify-self-end"
            disabled={!full || locked}
            onClick={() => onSubmit({ kind: 'prioritization', selectedTaskIds: slots.filter((id): id is string => Boolean(id)) })}
          >
            <Send className="size-4" aria-hidden /> Confirmar el tablero
          </button>
        )}
      </div>
      <DragOverlay>{draggingTask ? <TaskCard task={draggingTask} floating /> : null}</DragOverlay>
    </DragBoard>
  );
}

function TaskCard({ task, floating = false, discarded = false }: { task: PrioritizationTask; floating?: boolean; discarded?: boolean }) {
  return (
    <div className={`rounded-xl border border-line bg-white p-3 ${floating ? 'rotate-2 shadow-pop' : 'shadow-sm'} ${discarded ? 'opacity-70' : ''}`}>
      {task.label && <span className="chip bg-accent-soft text-accent-strong">{task.label}</span>}
      <p className={`mt-1.5 font-semibold text-ink ${discarded ? 'line-through decoration-bad/60' : ''}`}>{task.title}</p>
      <p className="mt-0.5 text-sm text-ink-soft">{task.description}</p>
    </div>
  );
}
