'use client';

import type { ResolvedLine } from '@despega/simulator';
import { useCallback, useEffect, useState } from 'react';

/**
 * Revela los diálogos de una escena uno a uno, como si se escribieran en vivo. El
 * jugador puede saltar la animación; la interacción (y su reloj) empieza al terminar.
 */
export function useLineReveal(lines: readonly ResolvedLine[], resetKey: string | number) {
  const [state, setState] = useState({ key: resetKey, visible: 0 });
  const visible = state.key === resetKey ? state.visible : 0;
  const done = visible >= lines.length;

  useEffect(() => {
    if (done) return;
    const previous = lines[visible - 1];
    const delay = visible === 0 ? 450 : readingTime(previous);
    const timer = window.setTimeout(() => {
      setState((current) => ({ key: resetKey, visible: (current.key === resetKey ? current.visible : 0) + 1 }));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [done, lines, resetKey, visible]);

  const skip = useCallback(() => setState({ key: resetKey, visible: lines.length }), [lines.length, resetKey]);

  return { visibleLines: lines.slice(0, visible), nextLine: done ? undefined : lines[visible], done, skip };
}

function readingTime(line: ResolvedLine | undefined): number {
  if (!line) return 450;
  const base = line.speaker === 'narrator' ? 900 : 700;
  return Math.min(3_200, base + line.text.length * 24);
}
