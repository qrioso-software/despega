import { Alert, Card } from '@heroui/react';
import type { Metadata } from 'next';
import { Brand } from '@/components/brand';
import { LoginForm } from '@/components/login-form';
import { adminAuthConfig } from '@/lib/auth';

export const metadata: Metadata = { title: 'Ingresar' };

const NOTICES: Record<string, string> = {
  'sesion-vencida': 'Tu sesión venció. Vuelve a ingresar.',
  'sin-acceso': 'Tu cuenta no tiene un rol del backoffice.',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const reason = Array.isArray(params.motivo) ? params.motivo[0] : params.motivo;
  let mode: 'cognito' | 'local' | 'error' = 'error';
  try {
    mode = adminAuthConfig().provider;
  } catch (error) {
    console.error('Configuración de identidad inválida.', error);
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,_var(--accent-soft)_0%,_var(--background)_60%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <Card>
          <Card.Header>
            <Card.Title className="font-display text-2xl">Ingresar</Card.Title>
            <Card.Description>Equipo de DESPEGA y orientadores de colegios.</Card.Description>
          </Card.Header>
          <Card.Content>
            {mode === 'error' ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Acceso no configurado</Alert.Title>
                  <Alert.Description>Revisa AUTH_PROVIDER y los datos de Cognito de este ambiente.</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {mode === 'local' && (
                  <Alert status="accent">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Modo local de desarrollo</Alert.Title>
                      <Alert.Description>
                        Entras solo con tu correo y eliges el rol. En AWS el acceso usa el pool de staff de Cognito.
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
                <LoginForm mode={mode} notice={reason ? NOTICES[reason] : undefined} />
              </div>
            )}
          </Card.Content>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-ink">Las sesiones usan cookies HTTP-only; las contraseñas nunca se guardan en el navegador.</p>
      </div>
    </main>
  );
}
