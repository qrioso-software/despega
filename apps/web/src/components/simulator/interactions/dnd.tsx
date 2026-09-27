'use client';

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDndMonitor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

/** Si el dedo o el mouse se movieron menos que esto, soltar cuenta como toque. */
const TAP_TOLERANCE_PX = 8;

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'Presiona Enter o Espacio para seleccionar la tarjeta y luego elige su destino. También puedes arrastrarla con el mouse o manteniéndola presionada con el dedo.',
};

const ANNOUNCEMENTS: Announcements = {
  onDragStart: () => 'Tomaste la tarjeta.',
  onDragOver: ({ over }) => (over ? 'La tarjeta está sobre un destino.' : 'La tarjeta está fuera de los destinos.'),
  onDragEnd: ({ over }) => (over ? 'Soltaste la tarjeta en un destino.' : 'Soltaste la tarjeta fuera de los destinos.'),
  onDragCancel: () => 'Se canceló el arrastre.',
};

function isTap(event: DragEndEvent): boolean {
  return Math.hypot(event.delta.x, event.delta.y) < TAP_TOLERANCE_PX;
}

/**
 * Tablero de los mini-juegos de arrastre: arrastrar con mouse, mantener presionado para
 * arrastrar en pantallas táctiles, o tocar para seleccionar y tocar el destino. Con
 * teclado, las tarjetas y los destinos son botones: Enter selecciona y Enter ubica.
 *
 * En pantallas táctiles el arrastre se activa tras 160 ms sin mover el dedo (así la
 * página se puede desplazar). Un toque más largo que eso no debe perderse: si al soltar
 * casi no hubo movimiento, el tablero lo trata como cancelación y la tarjeta lo resuelve
 * como toque (`DraggableCard`).
 */
export function DragBoard({
  id,
  onDragStart,
  onDragEnd,
  onDragCancel,
  children,
}: {
  id: string;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel?: () => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
  );
  return (
    <DndContext
      id={id}
      sensors={sensors}
      accessibility={{ announcements: ANNOUNCEMENTS, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
      onDragStart={onDragStart}
      onDragEnd={(event) => (isTap(event) ? onDragCancel?.() : onDragEnd(event))}
      onDragCancel={() => onDragCancel?.()}
    >
      {children}
    </DndContext>
  );
}

export function DraggableCard({
  id,
  disabled,
  selected,
  onSelect,
  className = '',
  label,
  children,
}: {
  id: string;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled });
  // Un toque sostenido activa el arrastre y dnd-kit bloquea el clic posterior: si al
  // soltar no hubo movimiento, se resuelve aquí como el toque que fue.
  useDndMonitor({
    onDragEnd(event) {
      if (event.active.id === id && isTap(event)) onSelect?.();
    },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      role="button"
      // Se anuncia como botón (lo que es); las instrucciones explican el arrastre.
      aria-roledescription={undefined}
      aria-pressed={selected}
      aria-label={label}
      disabled={disabled}
      onClick={onSelect}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`touch-manipulation text-left transition-shadow ${isDragging ? 'opacity-40' : ''} ${
        selected ? 'ring-4 ring-accent/40' : ''
      } disabled:cursor-default ${className}`}
    >
      {children}
    </button>
  );
}

export function DropZone({
  id,
  disabled,
  className = '',
  activeClassName = 'ring-4 ring-accent/40',
  children,
}: {
  id: string;
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? activeClassName : ''}`}>
      {children}
    </div>
  );
}
