import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConfirmSignUpForm } from '@/components/auth/auth-forms';
import { AuthConfigError, authMode } from '../../auth-mode';

export const metadata: Metadata = { title: 'Confirma tu correo' };

export default async function ConfirmSignUpPage({ searchParams }: PageProps<'/registro/confirmar'>) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const mode = authMode();
  if (mode === 'local') redirect('/inicio');

  return (
    <>
      <p className="eyebrow">Un paso más</p>
      <h1 className="mt-2 text-3xl font-bold">Revisa tu correo</h1>
      <p className="mt-2 text-muted">
        Te enviamos un código de verificación{email ? <> a <strong className="text-ink">{email}</strong></> : null}. Escríbelo aquí para
        activar tu cuenta.
      </p>
      <div className="mt-8 grid gap-5">
        {mode === 'error' ? <AuthConfigError /> : <ConfirmSignUpForm email={email ?? ''} />}
        <p className="text-center text-sm text-muted">
          <Link href="/ingresar" className="font-semibold text-violet hover:underline">Volver a ingresar</Link>
        </p>
      </div>
    </>
  );
}
