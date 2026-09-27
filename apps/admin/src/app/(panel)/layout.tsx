import { Button, Chip } from '@heroui/react';
import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { staffSignOutAction } from '@/app/login/actions';
import { AdminNav } from '@/components/admin-nav';
import { Brand } from '@/components/brand';
import { requireStaff } from '@/lib/auth';
import { STAFF_ROLE_LABELS } from '@/lib/staff';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  const role = STAFF_ROLE_LABELS[staff.groups[0]!];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface px-4 py-6 lg:flex">
        <Brand />
        <AdminNav />
        <div className="mt-auto grid gap-3 rounded-2xl bg-surface-secondary p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{staff.name}</p>
            <p className="truncate text-xs text-muted-ink">{staff.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip size="sm" color="accent" variant="soft"><Chip.Label>{role}</Chip.Label></Chip>
            {staff.provider === 'local' && <Chip size="sm" color="warning" variant="soft"><Chip.Label>Modo local</Chip.Label></Chip>}
          </div>
          <form action={staffSignOutAction}>
            <Button type="submit" variant="secondary" size="sm" fullWidth>
              <LogOut className="size-4" aria-hidden /> Salir
            </Button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 grid gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Brand />
            <form action={staffSignOutAction}>
              <Button type="submit" variant="secondary" size="sm">
                <LogOut className="size-4" aria-hidden /> <span className="sr-only">Salir</span>
              </Button>
            </form>
          </div>
          <AdminNav orientation="horizontal" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
