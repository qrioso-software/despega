import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { ConfirmSignUpForm } from '@/components/auth/auth-forms';
import { AuthConfigError, authMode } from '../../auth-mode';

export const metadata: Metadata = { title: 'Confirma tu correo' };

export default async function ConfirmSignUpPage({ searchParams }: PageProps<'/registro/confirmar'>) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const mode = authMode();
  if (mode === 'local') redirect('/inicio');

  return (
    <AuthCard
      icon={MailCheck}
      badge="Un paso más"
      title="Revisa tu correo"
      description={
        <>
          Te enviamos un código de verificación{email ? <> a <strong className="text-ink">{email}</strong></> : null}. Escríbelo aquí
          para activar tu cuenta.
        </>
      }
      footer={<Link href="/ingresar" className="font-semibold text-accent hover:underline">Volver a ingresar</Link>}
    >
      {mode === 'error' ? <AuthConfigError /> : <ConfirmSignUpForm email={email ?? ''} />}
    </AuthCard>
  );
}
