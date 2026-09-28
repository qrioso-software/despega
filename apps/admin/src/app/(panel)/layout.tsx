import type { ReactNode } from 'react';
import { AdminShell } from '@/components/shell/admin-shell';
import { requireStaff } from '@/lib/auth';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  return <AdminShell staff={staff}>{children}</AdminShell>;
}
