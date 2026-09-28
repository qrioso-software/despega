'use client';

import { House } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CareerIcon } from '@/components/careers/career-icon';

export type NavCareer = { readonly id: string; readonly name: string };

/** Navegación lateral: inicio y las carreras jugables. Marca la sección activa. */
export function AppNav({ careers, upcomingCount }: { careers: readonly NavCareer[]; upcomingCount: number }) {
  const pathname = usePathname();
  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined);

  return (
    <nav aria-label="Principal" className="grid gap-6 px-3">
      <ul className="grid gap-1">
        <li>
          <Link href="/inicio" className="nav-item" aria-current={current('/inicio')}>
            <House className="size-4.5" aria-hidden /> Inicio
          </Link>
        </li>
      </ul>
      <div>
        <p className="px-3 pb-2 text-xs font-semibold text-muted">Tus carreras</p>
        <ul className="grid gap-1">
          {careers.map((career) => (
            <li key={career.id}>
              <Link href={`/simulador/${career.id}`} className="nav-item" aria-current={current(`/simulador/${career.id}`)}>
                <CareerIcon careerId={career.id} size="xs" className="-ml-1" />
                <span className="truncate">{career.name}</span>
              </Link>
            </li>
          ))}
          {upcomingCount > 0 && (
            <li className="flex min-h-10 items-center gap-3 px-3 text-sm text-muted">
              <span className="-ml-1 grid size-7 place-items-center rounded-md border border-dashed border-line-strong text-xs font-bold" aria-hidden>
                +{upcomingCount}
              </span>
              Próximamente
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
