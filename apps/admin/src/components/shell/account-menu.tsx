'use client';

import { Button, Chip, Popover } from '@heroui/react';
import { LogOut } from 'lucide-react';
import { staffSignOutAction } from '@/app/login/actions';
import { Initials } from '@/components/initials';

/** Menú de cuenta de la barra superior en móvil: identidad, rol y cierre de sesión. */
export function AccountMenu({ name, email, role, local }: { name: string; email: string; role: string; local: boolean }) {
  return (
    <Popover>
      <Button isIconOnly variant="ghost" className="-mr-1 rounded-full lg:hidden" aria-label={`Tu cuenta: ${name}`}>
        <Initials name={name} size="sm" />
      </Button>
      <Popover.Content placement="bottom end" className="w-[min(18rem,calc(100vw-2rem))]">
        <Popover.Dialog className="grid gap-3 p-1">
          <div className="flex items-center gap-3">
            <Initials name={name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="truncate text-xs text-muted-ink">{email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip size="sm" color="accent" variant="soft"><Chip.Label>{role}</Chip.Label></Chip>
            {local && <Chip size="sm" color="warning" variant="soft"><Chip.Label>Modo local</Chip.Label></Chip>}
          </div>
          <form action={staffSignOutAction} className="border-t border-line pt-2">
            <Button type="submit" variant="ghost" fullWidth className="justify-start">
              <LogOut className="size-4" aria-hidden /> Cerrar sesión
            </Button>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
