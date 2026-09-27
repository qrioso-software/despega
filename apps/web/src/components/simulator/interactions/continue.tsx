'use client';

import { ArrowRight } from 'lucide-react';
import type { InteractionProps } from './types';

export function ContinueInteraction({
  interaction,
  locked,
  onSubmit,
  variant = 'primary',
}: InteractionProps<'none'> & { variant?: 'primary' | 'light' }) {
  return (
    <button
      type="button"
      className={`btn ${variant === 'light' ? 'btn-light' : 'btn-primary'} min-h-12 px-6`}
      disabled={locked}
      onClick={() => onSubmit({ kind: 'continue' })}
    >
      {interaction.continueLabel} <ArrowRight className="size-4" aria-hidden />
    </button>
  );
}
