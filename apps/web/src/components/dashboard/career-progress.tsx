import type { SessionStatus } from '@despega/simulator';
import { Check, Lock, Play } from 'lucide-react';

/** Tres sesiones en línea: completadas, en curso/disponible y bloqueadas. */
export function SessionTrack({
  sessions,
  tone = 'light',
}: {
  sessions: readonly { number: number; title: string; status: SessionStatus }[];
  tone?: 'light' | 'dark';
}) {
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {sessions.map((session) => {
        const done = session.status === 'completed';
        const open = session.status === 'available' || session.status === 'in_progress';
        return (
          <li
            key={session.number}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
              done
                ? tone === 'dark' ? 'border-good/50 bg-good/20' : 'border-good/30 bg-good-soft'
                : open
                  ? tone === 'dark' ? 'border-sun/50 bg-white/10' : 'border-brand/40 bg-brand-soft/70'
                  : tone === 'dark' ? 'border-white/10 bg-white/5' : 'border-line bg-paper'
            }`}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full ${
                done ? 'bg-good text-white' : open ? 'bg-brand text-ink' : tone === 'dark' ? 'bg-white/10 text-white/50' : 'bg-mist text-muted'
              }`}
            >
              {done ? <Check className="size-4" aria-hidden /> : open ? <Play className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className={`block text-xs font-bold uppercase tracking-wider ${tone === 'dark' ? 'text-white/60' : 'text-muted'}`}>
                Sesión {session.number} · {statusLabel(session.status)}
              </span>
              <span className={`block truncate text-sm font-semibold ${tone === 'dark' ? 'text-white' : 'text-ink'}`}>{session.title}</span>
            </span>
          </li>
        );
      })}
    </ol>
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
export function PerformanceMeter({ value, label = 'Desempeño', dark = false }: { value: number; label?: string; dark?: boolean }) {
  return (
    <div>
      <div className={`flex items-baseline justify-between text-sm ${dark ? 'text-white/70' : 'text-muted'}`}>
        <span className="font-semibold">{label}</span>
        <span className={`font-display text-lg font-bold ${dark ? 'text-white' : 'text-ink'}`}>{value}<span className="text-sm font-medium opacity-60"> / 100</span></span>
      </div>
      <div
        className={`mt-1.5 h-2.5 overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-accent-soft'}`}
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
