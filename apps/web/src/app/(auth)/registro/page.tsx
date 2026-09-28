import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { LocalModeNotice, SignUpForm } from '@/components/auth/auth-forms';
import { AuthConfigError, authMode } from '../auth-mode';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function SignUpPage() {
  const mode = authMode();
  return (
    <AuthCard
      icon={Rocket}
      badge="Empieza gratis"
      title="Crea tu cuenta y despega"
      description="Tu nombre será el del protagonista. Tus decisiones construyen tu perfil."
      footer={<>¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-accent hover:underline">Ingresar</Link></>}
    >
      {mode === 'error' ? <AuthConfigError /> : (
        <>
          {mode === 'local' && <LocalModeNotice />}
          <SignUpForm mode={mode} />
        </>
      )}
    </AuthCard>
  );
}
