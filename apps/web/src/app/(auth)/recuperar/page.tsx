import type { Metadata } from 'next';
import Link from 'next/link';
import { PasswordResetForm } from '@/components/auth/auth-forms';
import { AuthConfigError, authMode } from '../auth-mode';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default async function PasswordResetPage({ searchParams }: PageProps<'/recuperar'>) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const mode = authMode();

  return (
    <>
      <p className="eyebrow">Recuperar acceso</p>
      <h1 className="mt-2 text-3xl font-bold">¿Olvidaste tu contraseña?</h1>
      <p className="mt-2 text-muted">Te enviamos un código a tu correo para crear una nueva.</p>
      <div className="mt-8 grid gap-5">
        {mode === 'error' && <AuthConfigError />}
        {mode === 'local' && (
          <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-ink-soft">
            En el modo local de desarrollo las cuentas no tienen contraseña: entra solo con tu correo.
          </p>
        )}
        {mode === 'cognito' && <PasswordResetForm defaultEmail={email} />}
        <p className="text-center text-sm text-muted">
          <Link href="/ingresar" className="font-semibold text-accent hover:underline">Volver a ingresar</Link>
        </p>
      </div>
    </>
  );
}
