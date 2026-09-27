import type { Metadata } from 'next';
import Link from 'next/link';
import { LocalModeNotice, SignUpForm } from '@/components/auth/auth-forms';
import { AuthConfigError, authMode } from '../auth-mode';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function SignUpPage() {
  const mode = authMode();
  return (
    <>
      <p className="eyebrow">Empieza gratis</p>
      <h1 className="mt-2 text-3xl font-bold">Crea tu cuenta y despega</h1>
      <p className="mt-2 text-muted">Tu nombre será el del protagonista. Tus decisiones construyen tu perfil.</p>
      <div className="mt-8 grid gap-5">
        {mode === 'error' ? <AuthConfigError /> : (
          <>
            {mode === 'local' && <LocalModeNotice />}
            <SignUpForm mode={mode} />
          </>
        )}
        <p className="text-center text-sm text-muted">
          ¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-accent hover:underline">Ingresar</Link>
        </p>
      </div>
    </>
  );
}
