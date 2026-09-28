import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Tarjeta de las pantallas de acceso: insignia, título y descripción arriba; el formulario abajo. */
export function AuthCard({
  icon: Icon,
  badge,
  title,
  description,
  footer,
  children,
}: {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <section className="card overflow-hidden shadow-soft">
        <header className="border-b border-line px-6 pb-6 pt-6 sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/15 bg-accent-soft px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-accent-strong">
            <Icon className="size-3.5" aria-hidden /> {badge}
          </span>
          <h1 className="mt-4 text-2xl font-bold">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
        </header>
        <div className="grid gap-5 px-6 py-6 sm:px-8">{children}</div>
      </section>
      {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
    </>
  );
}
