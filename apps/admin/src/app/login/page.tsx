import { Alert, Card } from '@heroui/react';
import { BookOpenText, LayoutDashboard, ListChecks, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { Brand } from '@/components/brand';
import { LoginForm } from '@/components/login-form';
import { adminAuthConfig } from '@/lib/auth';

export const metadata: Metadata = { title: 'Ingresar' };

const NOTICES: Record<string, string> = {
  'sesion-vencida': 'Tu sesión venció. Vuelve a ingresar.',
  'sin-acceso': 'Tu cuenta no tiene un rol del backoffice.',
};

const HIGHLIGHTS = [
  { icon: LayoutDashboard, title: 'Panel del piloto', text: 'Avance por sesión, desempeño y perfil de afinidad del grupo.' },
  { icon: ListChecks, title: 'Decisiones escena por escena', text: 'Qué eligió cada estudiante, cuánto tardó y qué cambió.' },
  { icon: BookOpenText, title: 'Guion y puntajes', text: 'El mismo guion que ejecuta el motor, con cada consecuencia.' },
] as const;

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
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-night text-white lg:block">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/35 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />

        <div className="relative flex h-full min-h-dvh flex-col px-10 py-10 xl:px-16">
          <Brand light height={26} />

          <div className="my-auto max-w-lg py-12">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sun">Equipo DESPEGA y orientación</p>
            <h2 className="mt-3 text-4xl font-bold leading-[1.1] xl:text-[2.75rem]">Acompaña cada decisión de tus estudiantes.</h2>
            <p className="mt-4 max-w-md text-white/65">
              Revisa cómo avanza el piloto, abre la ficha de cada estudiante y consulta el guion con sus puntajes.
            </p>

            <ul className="mt-10 grid max-w-md gap-5">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sun">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-sm text-white/55">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/45">Acceso solo para el equipo de DESPEGA y orientadores autorizados.</p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:py-10">
        <div className="flex justify-center lg:hidden">
          <Brand height={24} />
        </div>
        <div className="m-auto w-full max-w-[27rem] py-8">
          <Card className="gap-0 overflow-hidden p-0 shadow-pop">
            <Card.Header className="border-b border-line px-6 py-6 sm:px-8">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/15 bg-accent-soft px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-accent-soft-foreground">
                <ShieldCheck className="size-3.5" aria-hidden /> Acceso del equipo
              </span>
              <Card.Title className="mt-4 text-2xl">Ingresar</Card.Title>
              <Card.Description className="mt-1">Equipo de DESPEGA y orientadores de colegios.</Card.Description>
            </Card.Header>
            <Card.Content className="px-6 py-6 sm:px-8">
              {mode === 'error' ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Acceso no configurado</Alert.Title>
                    <Alert.Description>Revisa AUTH_PROVIDER y los datos de Cognito de este ambiente.</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : (
                <div className="grid gap-5">
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
        </div>
        <p className="text-center text-xs text-muted-ink">Las sesiones usan cookies HTTP-only; las contraseñas nunca se guardan en el navegador.</p>
      </main>
    </div>
  );
}
