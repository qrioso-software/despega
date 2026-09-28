import { CAREERS } from '@despega/simulator';
import { ArrowLeft, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOutAction } from '@/app/(auth)/actions';
import { BrandLink } from '@/components/site/brand';
import type { StudentSession } from '@/lib/auth';
import { AppNav } from './app-nav';

type Crumb = { readonly label: string; readonly href?: string };

/**
 * Marco de la app del estudiante a pantalla completa: barra lateral fija en escritorio,
 * barra superior con migas y acciones, y menú de cuenta en móvil. El reproductor del
 * simulador no lo usa: es una vista inmersiva propia.
 */
export function AppShell({
  student,
  crumbs,
  back,
  actions,
  children,
}: {
  student: Pick<StudentSession, 'givenName' | 'familyName' | 'email'>;
  /** Ruta de la página; el último elemento es la página actual. */
  crumbs: readonly Crumb[];
  /** Destino del botón «atrás» en móvil (en escritorio se usan las migas). */
  back?: { readonly href: string; readonly label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  const careers = CAREERS.filter((career) => career.status === 'available').map(({ id, name }) => ({ id, name }));
  const upcomingCount = CAREERS.length - careers.length;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center px-6">
          <BrandLink href="/inicio" height={26} />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <AppNav careers={careers} upcomingCount={upcomingCount} />
        </div>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <Initials student={student} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{fullName(student)}</p>
              <p className="truncate text-xs text-muted">{student.email}</p>
            </div>
            <SignOut />
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            {back ? (
              <Link href={back.href} className="btn btn-quiet btn-icon -ml-2 lg:hidden" aria-label={`Volver a ${back.label}`}>
                <ArrowLeft className="size-5" aria-hidden />
              </Link>
            ) : (
              <span className="lg:hidden">
                <BrandLink href="/inicio" height={22} />
              </span>
            )}
            <nav aria-label="Ruta" className="min-w-0 flex-1">
              <ol className="flex min-w-0 items-center gap-1.5 text-sm">
                {crumbs.map((crumb, index) => {
                  const last = index === crumbs.length - 1;
                  return (
                    <li key={`${crumb.label}-${index}`} className={`min-w-0 items-center gap-1.5 ${last ? 'flex' : 'hidden lg:flex'} ${back || !last ? '' : 'max-lg:sr-only'}`}>
                      {last || !crumb.href ? (
                        <span className={`truncate ${last ? 'font-semibold text-ink' : 'text-muted'}`} aria-current={last ? 'page' : undefined}>{crumb.label}</span>
                      ) : (
                        <Link href={crumb.href} className="truncate font-medium text-muted hover:text-ink">{crumb.label}</Link>
                      )}
                      {!last && <ChevronRight className="size-4 shrink-0 text-placeholder" aria-hidden />}
                    </li>
                  );
                })}
              </ol>
            </nav>
            {actions && <div className="hidden items-center gap-2 sm:flex">{actions}</div>}
            <button type="button" popoverTarget="account-menu" className="rounded-full lg:hidden" aria-label={`Tu cuenta: ${fullName(student)}`}>
              <Initials student={student} />
            </button>
          </div>
        </header>

        <div id="account-menu" popover="auto" className="popover-menu card p-2 shadow-pop">
          <div className="flex items-center gap-3 p-2">
            <Initials student={student} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{fullName(student)}</p>
              <p className="truncate text-xs text-muted">{student.email}</p>
            </div>
          </div>
          <form action={signOutAction} className="mt-1 border-t border-line pt-1">
            <button type="submit" className="nav-item w-full">
              <LogOut className="size-4.5" aria-hidden /> Cerrar sesión
            </button>
          </form>
        </div>

        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SignOut() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="btn btn-quiet btn-icon size-9 min-h-9" aria-label="Cerrar sesión" title="Cerrar sesión">
        <LogOut className="size-4" aria-hidden />
      </button>
    </form>
  );
}

function Initials({ student }: { student: Pick<StudentSession, 'givenName' | 'familyName'> }) {
  const initials = `${student.givenName.charAt(0)}${student.familyName?.charAt(0) ?? ''}`.toUpperCase();
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-white" aria-hidden>
      {initials}
    </span>
  );
}

function fullName(student: Pick<StudentSession, 'givenName' | 'familyName'>): string {
  return [student.givenName, student.familyName].filter(Boolean).join(' ');
}
