import type { SessionStatus } from '@despega/simulator';
import { Check, Lock, Play } from 'lucide-react';

type SessionItem = { readonly number: number; readonly title: string; readonly status: SessionStatus };

/** Sesiones de una carrera en columnas iguales; la sesión jugable queda resaltada. */
export function SessionTrack({ sessions }: { sessions: readonly SessionItem[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {sessions.map((session) => {
        const open = session.status === 'available' || session.status === 'in_progress';
        const locked = session.status === 'locked';
        return (
          <li
            key={session.number}
            className={`flex flex-col gap-1.5 rounded-xl border p-4 ${
              open ? 'border-brand bg-brand-soft/60' : locked ? 'border-line bg-paper' : 'border-line bg-surface'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">Sesión {session.number}</span>
              <SessionStatusBadge status={session.status} />
            </div>
            <p className={`font-semibold leading-snug ${locked ? 'text-ink-soft' : 'text-ink'}`}>{session.title}</p>
          </li>
        );
      })}
    </ol>
  );
}

const STATUS_STYLES: Record<SessionStatus, { icon: typeof Check; className: string }> = {
  completed: { icon: Check, className: 'text-good-strong' },
  in_progress: { icon: Play, className: 'text-accent-strong' },
  available: { icon: Play, className: 'text-brand-strong' },
  locked: { icon: Lock, className: 'text-muted' },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { icon: Icon, className } = STATUS_STYLES[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${className}`}>
      <Icon className="size-3.5" aria-hidden /> {statusLabel(status)}
    </span>
  );
}

export function statusLabel(status: SessionStatus): string {
  switch (status) {
    case 'completed':
      return 'Completada';
    case 'in_progress':
      return 'En curso';
    case 'available':
      return 'Disponible';
    default:
      return 'Bloqueada';
  }
}

/** Medidor de desempeño 0–100: el relleno usa el acento y la pista un tono claro del mismo color. */
export function PerformanceMeter({ value, label = 'Desempeño' }: { value: number; label?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm text-muted">
        <span className="font-semibold">{label}</span>
        <span className="font-display text-2xl font-bold text-ink">
          {value}
          <span className="text-sm font-medium text-muted"> / 100</span>
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-accent-soft"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
