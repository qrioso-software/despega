import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { PasswordResetForm } from '@/components/auth/auth-forms';
import { AuthConfigError, authMode } from '../auth-mode';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default async function PasswordResetPage({ searchParams }: PageProps<'/recuperar'>) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const mode = authMode();

  return (
    <AuthCard
      icon={KeyRound}
      badge="Recuperar acceso"
      title="¿Olvidaste tu contraseña?"
      description="Te enviamos un código a tu correo para crear una nueva."
      footer={<Link href="/ingresar" className="font-semibold text-accent hover:underline">Volver a ingresar</Link>}
    >
      {mode === 'error' && <AuthConfigError />}
      {mode === 'local' && (
        <p className="rounded-xl bg-mist px-4 py-3 text-sm text-ink-soft">
          En el modo local de desarrollo las cuentas no tienen contraseña: entra solo con tu correo.
        </p>
      )}
      {mode === 'cognito' && <PasswordResetForm defaultEmail={email} />}
    </AuthCard>
  );
}
