import type { Metadata } from 'next';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { safeNextPath } from '@despega/auth';
import { AuthCard } from '@/components/auth/auth-card';
import { LocalModeNotice, SignInForm } from '@/components/auth/auth-forms';
import { AuthConfigError, authMode } from '../auth-mode';

export const metadata: Metadata = { title: 'Ingresar' };

export default async function SignInPage({ searchParams }: PageProps<'/ingresar'>) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next), '/inicio', ['/ingresar', '/registro', '/recuperar']);
  const email = first(params.email);
  const mode = authMode();
  const notice = first(params.cuenta) === 'confirmada'
    ? '¡Cuenta confirmada! Ya puedes entrar.'
    : first(params.clave) === 'actualizada'
      ? 'Contraseña actualizada. Entra con tu nueva clave.'
      : first(params.motivo) === 'sesion-vencida'
        ? 'Tu sesión venció. Vuelve a entrar para seguir donde ibas.'
        : undefined;

  return (
    <AuthCard
      icon={LogIn}
      badge="Hola de nuevo"
      title="Entra a tu simulador"
      description="Retoma tu semana en PixelForge justo donde la dejaste."
      footer={<>¿Todavía no tienes cuenta? <Link href="/registro" className="font-semibold text-accent hover:underline">Crear cuenta</Link></>}
    >
      {mode === 'error' ? <AuthConfigError /> : (
        <>
          {mode === 'local' && <LocalModeNotice />}
          {notice && <p role="status" className="rounded-xl border border-good/20 bg-good-soft px-4 py-3 text-sm font-medium text-good-strong">{notice}</p>}
          <SignInForm mode={mode} next={next} defaultEmail={email} />
        </>
      )}
    </AuthCard>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
