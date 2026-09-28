'use client';

import { KanbanSquare, Mail, MessagesSquare, MonitorPlay, Video } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

const APPS = {
  chat: { name: 'PixelChat', icon: MessagesSquare, tile: 'bg-accent text-white' },
  call: { name: 'PixelChat · Videollamada', icon: Video, tile: 'bg-accent text-white' },
  mail: { name: 'PixelMail', icon: Mail, tile: 'bg-sun text-ink' },
  board: { name: 'PixelBoard', icon: KanbanSquare, tile: 'bg-good text-white' },
  pulse: { name: 'PixelPulse', icon: MonitorPlay, tile: 'bg-bad text-white' },
} as const;

export type OfficeApp = keyof typeof APPS;

/**
 * Herramienta de oficina dentro del mundo del juego, como panel de altura completa:
 * barra de la app, barra de contexto opcional, cuerpo desplazable y pie opcional.
 * Son recreaciones de PixelForge, no ventanas de sistema ni capturas de otras apps.
 */
export function OfficeWindow({
  app,
  subtitle,
  toolbar,
  footer,
  scrollKey,
  children,
}: {
  app: OfficeApp;
  subtitle?: string;
  /** Contexto fijo bajo la barra de la app (participantes, equipo, video). */
  toolbar?: ReactNode;
  footer?: ReactNode;
  /** Cuando cambia (p. ej. llega una línea nueva), el cuerpo baja hasta el final. */
  scrollKey?: number;
  children: ReactNode;
}) {
  const meta = APPS[app];
  const Icon = meta.icon;
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body || scrollKey === undefined || body.scrollHeight <= body.clientHeight) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    body.scrollTo({ top: body.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [scrollKey]);

  return (
    <section className="flex flex-1 flex-col bg-surface lg:min-h-0" aria-label={meta.name}>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${meta.tile}`}>
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="truncate text-sm font-bold text-ink">{meta.name}</span>
          {subtitle && <span className="hidden truncate text-sm text-muted sm:inline">· {subtitle}</span>}
        </div>
      </header>
      {toolbar && <div className="shrink-0 border-b border-line">{toolbar}</div>}
      <div ref={bodyRef} className="@container flex-1 lg:min-h-0 lg:overflow-y-auto">
        {children}
      </div>
      {footer && <div className="shrink-0 border-t border-line">{footer}</div>}
    </section>
  );
}
