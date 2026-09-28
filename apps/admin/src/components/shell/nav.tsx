'use client';

import { ArrowLeft, BookOpenText, ChevronRight, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from '@/components/brand';
import { CareerIcon } from '@/components/career-icon';

export type NavModule = { readonly id: string; readonly title: string };
type Crumb = { readonly label: string; readonly href?: string };

const SECTIONS = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/estudiantes', label: 'Estudiantes', icon: Users },
  { href: '/modulos', label: 'Módulos', icon: BookOpenText },
] as const;

function inSection(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegación lateral (escritorio): secciones y acceso directo al guion de cada módulo. */
export function SideNav({ modules }: { modules: readonly NavModule[] }) {
  const pathname = usePathname();
  const moduleOpen = modules.some((item) => pathname === `/modulos/${item.id}`);

  return (
    <nav aria-label="Secciones del backoffice" className="grid gap-6">
      <ul className="grid gap-1">
        {SECTIONS.map((item) => {
          const active = item.href === '/modulos' ? inSection(pathname, item.href) && !moduleOpen : inSection(pathname, item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} className="nav-item" aria-current={active ? 'page' : undefined}>
                <item.icon className="size-[1.125rem]" aria-hidden /> {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {modules.length > 0 && (
        <div>
          <p className="px-3 pb-2 text-xs font-semibold text-muted-ink">Guiones</p>
          <ul className="grid gap-1">
            {modules.map((item) => (
              <li key={item.id}>
                <Link href={`/modulos/${item.id}`} className="nav-item" aria-current={pathname === `/modulos/${item.id}` ? 'page' : undefined}>
                  <CareerIcon careerId={item.id} size="xs" className="-ml-1" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

/** Pestañas inferiores (móvil): las tres secciones siempre a un toque. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones del backoffice"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {SECTIONS.map((item) => (
          <li key={item.href} className="flex flex-1">
            <Link href={item.href} className="tab-item" aria-current={inSection(pathname, item.href) ? 'page' : undefined}>
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function crumbsFor(pathname: string, moduleTitles: Readonly<Record<string, string>>): Crumb[] {
  const [section, detail] = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (section === 'estudiantes') {
    return detail ? [{ label: 'Estudiantes', href: '/estudiantes' }, { label: 'Ficha del estudiante' }] : [{ label: 'Estudiantes' }];
  }
  if (section === 'modulos') {
    return detail ? [{ label: 'Módulos', href: '/modulos' }, { label: moduleTitles[detail] ?? 'Módulo' }] : [{ label: 'Módulos' }];
  }
  return [{ label: 'Panel' }];
}

/**
 * Inicio de la barra superior: migas en escritorio; en móvil, «atrás» hacia la sección
 * padre o el logo en las secciones principales.
 */
export function TopbarCrumbs({ moduleTitles }: { moduleTitles: Readonly<Record<string, string>> }) {
  const crumbs = crumbsFor(usePathname(), moduleTitles);
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : undefined;

  return (
    <>
      {parent?.href ? (
        <Link
          href={parent.href}
          className="-ml-2 grid size-10 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface-secondary hover:text-ink lg:hidden"
          aria-label={`Volver a ${parent.label}`}
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      ) : (
        <Link href="/" className="shrink-0 lg:hidden" aria-label="Ir al panel">
          <Brand height={20} />
        </Link>
      )}
      <nav aria-label="Ruta" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li
                key={crumb.label}
                className={`min-w-0 items-center gap-1.5 ${last ? 'flex' : 'hidden lg:flex'} ${!parent && last ? 'max-lg:sr-only' : ''}`}
              >
                {last || !crumb.href ? (
                  <span className={`truncate ${last ? 'font-semibold text-ink' : 'text-muted-ink'}`} aria-current={last ? 'page' : undefined}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="truncate font-medium text-muted-ink hover:text-ink">{crumb.label}</Link>
                )}
                {!last && <ChevronRight className="size-4 shrink-0 text-placeholder" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
