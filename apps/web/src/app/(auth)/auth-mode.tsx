import { TriangleAlert } from 'lucide-react';
import { webAuthConfig } from '@/lib/auth';

/** Modo de identidad del ambiente, sin lanzar: la página muestra el error de configuración. */
export function authMode(): 'cognito' | 'local' | 'error' {
  try {
    return webAuthConfig().provider;
  } catch (error) {
    console.error('Configuración de identidad inválida.', error);
    return 'error';
  }
}

export function AuthConfigError() {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-bad-soft px-4 py-3 text-sm text-bad-strong">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      El acceso no está configurado en este ambiente (AUTH_PROVIDER y Cognito). Avísale al equipo de DESPEGA.
    </p>
  );
}
