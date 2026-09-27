'use client';

import { DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import { ArrowDown, CheckCircle2, Plus, Send, XCircle } from 'lucide-react';
import { Fragment, useState } from 'react';
import { DragBoard, DraggableCard, DropZone } from './dnd';
import type { InteractionProps } from './types';

/** Revisión de código sin código (escena 2.1): insertar el paso que falta en el flujo. */
export function SequenceInteraction({ interaction, locked, outcome, onSubmit }: InteractionProps<'sequence'>) {
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const reveal = outcome?.detail.kind === 'sequence' ? outcome.detail : null;
  const candidate = interaction.candidates.find((item) => item.id === candidateId);
  const expected = reveal ? interaction.candidates.find((item) => item.id === reveal.expected.candidateId) : undefined;

  function place(targetSlot: number, id = candidateId) {
    if (locked || !id) return;
    setCandidateId(id);
    setSlot(targetSlot);
  }

  function onDragEnd(event: DragEndEvent) {
    setDragging(null);
    if (event.over) place(Number(String(event.over.id).replace('slot-', '')), String(event.active.id));
  }

  const draggingCandidate = interaction.candidates.find((item) => item.id === dragging);

  return (
    <DragBoard id="sequence-review" onDragStart={(event) => setDragging(String(event.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl bg-mist p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Flujo de Camila · botón «Confirmar pedido»</p>
          <ol className="mt-3 grid gap-1">
            {interaction.steps.map((step, index) => (
              <Fragment key={step.id}>
                <Slot index={index} active={slot === index} candidateText={slot === index ? candidate?.text : undefined} locked={locked} canPlace={Boolean(candidateId)} onPlace={() => place(index)} onClear={() => setSlot(null)} verdict={slot === index && reveal ? (reveal.correct ? 'correct' : 'wrong') : undefined} expectedText={reveal && !reveal.correct && reveal.expected.slot === index ? expected?.text : undefined} />
                <li className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-night text-xs font-bold text-white">{index + 1}</span>
                  <span className="font-semibold text-ink">{step.text}</span>
                </li>
              </Fragment>
            ))}
            <Slot index={interaction.steps.length} active={slot === interaction.steps.length} candidateText={slot === interaction.steps.length ? candidate?.text : undefined} locked={locked} canPlace={Boolean(candidateId)} onPlace={() => place(interaction.steps.length)} onClear={() => setSlot(null)} verdict={slot === interaction.steps.length && reveal ? (reveal.correct ? 'correct' : 'wrong') : undefined} expectedText={reveal && !reveal.correct && reveal.expected.slot === interaction.steps.length ? expected?.text : undefined} />
          </ol>
        </div>
        <div className="grid content-start gap-3">
          <p className="text-sm font-semibold text-ink-soft">{interaction.prompt}</p>
          <p className="text-xs text-muted">Toca un paso y luego el «+» donde debería ir, o arrástralo al flujo.</p>
          {interaction.candidates.map((item) => (
            <DraggableCard
              key={item.id}
              id={item.id}
              disabled={locked}
              selected={candidateId === item.id}
              onSelect={() => {
                setCandidateId((current) => (current === item.id ? null : item.id));
                setSlot(null);
              }}
              label={`Paso candidato: ${item.text}`}
              className="block w-full rounded-2xl"
            >
              <span className={`block rounded-2xl border-2 px-4 py-3 font-semibold ${candidateId === item.id ? 'border-violet bg-violet-soft text-violet-strong' : 'border-line bg-white text-ink'}`}>
                {item.text}
              </span>
            </DraggableCard>
          ))}
          {!reveal && (
            <button
              type="button"
              className="btn btn-violet mt-2"
              disabled={locked || candidateId === null || slot === null}
              onClick={() => candidateId !== null && slot !== null && onSubmit({ kind: 'sequence', candidateId, slot })}
            >
              <Send className="size-4" aria-hidden /> Enviar revisión a Camila
            </button>
          )}
        </div>
      </div>
      <DragOverlay>
        {draggingCandidate ? <span className="block rotate-2 rounded-2xl border-2 border-violet bg-violet-soft px-4 py-3 font-semibold text-violet-strong shadow-pop">{draggingCandidate.text}</span> : null}
      </DragOverlay>
    </DragBoard>
  );
}

function Slot({
  index,
  active,
  candidateText,
  locked,
  canPlace,
  onPlace,
  onClear,
  verdict,
  expectedText,
}: {
  index: number;
  active: boolean;
  candidateText?: string;
  locked: boolean;
  canPlace: boolean;
  onPlace: () => void;
  onClear: () => void;
  verdict?: 'correct' | 'wrong';
  expectedText?: string;
}) {
  return (
    <li className="grid justify-items-center gap-1">
      <DropZone id={`slot-${index}`} disabled={locked} className="w-full rounded-2xl" activeClassName="bg-violet-soft">
        {active && candidateText ? (
          <button
            type="button"
            disabled={locked}
            onClick={onClear}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 text-left font-semibold ${
              verdict === 'correct' ? 'border-good bg-good-soft text-[#0b6e51]' : verdict === 'wrong' ? 'border-bad bg-bad-soft text-[#a1262b]' : 'border-violet bg-violet-soft text-violet-strong'
            }`}
            aria-label={`Paso insertado: ${candidateText}. Toca para quitarlo`}
          >
            {verdict === 'correct' ? <CheckCircle2 className="size-5 shrink-0" aria-hidden /> : verdict === 'wrong' ? <XCircle className="size-5 shrink-0" aria-hidden /> : <Plus className="size-5 shrink-0" aria-hidden />}
            {candidateText}
          </button>
        ) : (
          <button
            type="button"
            disabled={locked || !canPlace}
            onClick={onPlace}
            className={`mx-auto flex h-8 items-center justify-center gap-1 rounded-full px-3 text-xs font-bold transition-colors ${
              canPlace && !locked ? 'bg-violet text-white hover:bg-violet-strong' : 'text-muted'
            }`}
            aria-label={`Insertar el paso en la posición ${index + 1}`}
          >
            {canPlace && !locked ? <><Plus className="size-3.5" aria-hidden /> Insertar aquí</> : <ArrowDown className="size-4 opacity-50" aria-hidden />}
          </button>
        )}
      </DropZone>
      {expectedText && (
        <p className="w-full rounded-2xl border-2 border-dashed border-good bg-good-soft px-4 py-2 text-sm font-semibold text-[#0b6e51]">
          Aquí faltaba: {expectedText}
        </p>
      )}
    </li>
  );
}
