import { Button, Chip } from '@heroui/react';
import { MODULES } from '@despega/simulator';
import { FlaskConical, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { staffSignOutAction } from '@/app/login/actions';
import { Brand } from '@/components/brand';
import { Initials } from '@/components/initials';
import type { StaffSession } from '@/lib/auth';
import { STAFF_ROLE_LABELS } from '@/lib/staff';
import { AccountMenu } from './account-menu';
import { SideNav, TabBar, TopbarCrumbs } from './nav';

/**
 * Marco del backoffice a pantalla completa: barra lateral fija con la cuenta al pie en
 * escritorio; barra superior con migas; en móvil, «atrás», menú de cuenta y pestañas
 * inferiores.
 */
export function AdminShell({ staff, children }: { staff: StaffSession; children: ReactNode }) {
  const modules = Object.values(MODULES).map((item) => ({ id: item.careerId, title: item.title }));
  const moduleTitles = Object.fromEntries(modules.map((item) => [item.id, item.title]));
  const role = STAFF_ROLE_LABELS[staff.groups[0]!];
  const local = staff.provider === 'local';

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center px-6">
          <Link href="/" aria-label="Ir al panel">
            <Brand />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SideNav modules={modules} />
        </div>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl p-2" title={staff.email}>
            <Initials name={staff.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{staff.name}</p>
              <p className="truncate text-xs text-muted-ink">{role}</p>
            </div>
            <form action={staffSignOutAction}>
              <Button type="submit" isIconOnly variant="ghost" size="sm" aria-label="Cerrar sesión">
                <LogOut className="size-4" aria-hidden />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <TopbarCrumbs moduleTitles={moduleTitles} />
            {local && (
              <Chip size="sm" color="warning" variant="soft" className="max-sm:hidden">
                <FlaskConical className="size-3.5" aria-hidden />
                <Chip.Label>Modo local · datos de DEV</Chip.Label>
              </Chip>
            )}
            <AccountMenu name={staff.name} email={staff.email} role={role} local={local} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      <TabBar />
    </div>
  );
}
