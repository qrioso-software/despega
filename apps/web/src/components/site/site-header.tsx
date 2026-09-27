import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOutAction } from '@/app/(auth)/actions';
import { BrandLink } from './brand';

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <button type="submit" className={compact ? 'btn btn-ghost min-h-10 px-3' : 'btn btn-ghost'}>
        <LogOut className="size-4" aria-hidden />
        <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>Salir</span>
      </button>
    </form>
  );
}

export function SiteHeader({ student }: { student?: { givenName: string } | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLink />
        <nav aria-label="Secciones" className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex">
          <Link href="/#como-funciona" className="hover:text-ink">Cómo funciona</Link>
          <Link href="/#carreras" className="hover:text-ink">Carreras</Link>
          <Link href="/#colegios" className="hover:text-ink">Para colegios</Link>
        </nav>
        <div className="flex items-center gap-2">
          {student ? (
            <>
              <Link href="/inicio" className="btn btn-violet min-h-10 px-4">
                Mi inicio
              </Link>
              <SignOutButton compact />
            </>
          ) : (
            <>
              <Link href="/ingresar" className="btn btn-ghost min-h-10 px-4">Ingresar</Link>
              <Link href="/registro" className="btn btn-primary min-h-10 px-4">Empieza gratis</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <BrandLink />
          <p className="mt-3 text-sm text-muted">
            Simulaciones de carrera para estudiantes de 15 a 18 años. Vive una profesión antes de elegirla.
          </p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
          <Link href="/#como-funciona" className="hover:text-ink">Cómo funciona</Link>
          <Link href="/#carreras" className="hover:text-ink">Carreras</Link>
          <Link href="/registro" className="hover:text-ink">Crear cuenta</Link>
          <Link href="/ingresar" className="hover:text-ink">Ingresar</Link>
        </nav>
        <p className="text-xs text-muted">© {new Date().getFullYear()} DESPEGA · PixelForge es una empresa ficticia.</p>
      </div>
    </footer>
  );
}
