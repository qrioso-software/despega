import { KanbanSquare, Mail, MessagesSquare, MonitorPlay, Video } from 'lucide-react';
import type { ReactNode } from 'react';

const APPS = {
  chat: { name: 'PixelChat', icon: MessagesSquare, color: '#5b3df5' },
  call: { name: 'PixelChat · Videollamada', icon: Video, color: '#5b3df5' },
  mail: { name: 'PixelMail', icon: Mail, color: '#ff5b2e' },
  board: { name: 'PixelBoard', icon: KanbanSquare, color: '#12966f' },
  pulse: { name: 'PixelPulse', icon: MonitorPlay, color: '#e5484d' },
} as const;

export type OfficeApp = keyof typeof APPS;

/**
 * Ventana de herramienta de oficina dentro del mundo del juego. Son recreaciones de
 * PixelForge, no ventanas de sistema ni capturas de otras aplicaciones.
 */
export function OfficeWindow({
  app,
  subtitle,
  clock,
  children,
  className = '',
}: {
  app: OfficeApp;
  subtitle?: string;
  clock?: string;
  children: ReactNode;
  className?: string;
}) {
  const meta = APPS[app];
  const Icon = meta.icon;
  return (
    <section className={`card overflow-hidden p-0 ${className}`} aria-label={meta.name}>
      <header className="flex items-center justify-between gap-3 border-b border-line bg-mist/70 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ backgroundColor: meta.color }}>
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="truncate text-sm font-bold text-ink">{meta.name}</span>
          {subtitle && <span className="hidden truncate text-sm text-muted sm:inline">· {subtitle}</span>}
        </div>
        {clock && <span className="shrink-0 text-xs font-semibold text-muted">{clock}</span>}
      </header>
      {children}
    </section>
  );
}
