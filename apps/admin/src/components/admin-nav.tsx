'use client';

import { BookOpenText, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/estudiantes', label: 'Estudiantes', icon: Users },
  { href: '/modulos', label: 'Módulos', icon: BookOpenText },
];

export function AdminNav({ orientation = 'vertical' }: { orientation?: 'vertical' | 'horizontal' }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones del backoffice" className={orientation === 'vertical' ? 'grid gap-1' : 'flex gap-1 overflow-x-auto'}>
      {ITEMS.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              active ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-ink hover:bg-surface-secondary hover:text-ink'
            }`}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
