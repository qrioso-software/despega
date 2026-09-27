/** Utilidades puras de sesión: cookies, vencimiento de tokens y redirecciones seguras. */

export const REFRESH_WINDOW_SECONDS = 60;

export type CookieOptions = {
  readonly httpOnly: true;
  readonly secure: boolean;
  readonly sameSite: 'lax' | 'strict';
  readonly path: '/';
  readonly maxAge: number;
};

export type SessionCookieNames = {
  readonly access: string;
  readonly id: string;
  readonly refresh: string;
  readonly challenge: string;
  readonly local: string;
};

/**
 * En producción usa el prefijo `__Host-`: la cookie queda atada al host exacto, con
 * `Secure` y `Path=/`.
 */
export function sessionCookieNames(prefix: string, production: boolean): SessionCookieNames {
  const host = production ? '__Host-' : '';
  return {
    access: `${host}${prefix}_access`,
    id: `${host}${prefix}_id`,
    refresh: `${host}${prefix}_refresh`,
    challenge: `${host}${prefix}_challenge`,
    local: `${host}${prefix}_local`,
  };
}

/**
 * La web usa `lax` para llegar con sesión desde un enlace externo (p. ej. un correo del
 * colegio); las Server Actions de Next.js validan el origen de cada POST. El backoffice
 * usa `strict`.
 */
export function cookieOptions(maxAge: number, production: boolean, sameSite: 'lax' | 'strict' = 'lax'): CookieOptions {
  return { httpOnly: true, secure: production, sameSite, path: '/', maxAge };
}

export function tokenExpiresSoon(token: string, now = Date.now(), windowSeconds = REFRESH_WINDOW_SECONDS): boolean {
  try {
    const payload = decodeJwtPayload(token);
    return typeof payload.exp !== 'number' || payload.exp <= Math.floor(now / 1_000) + windowSeconds;
  } catch {
    return true;
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('JWT inválido.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
}

/**
 * Normaliza el destino posterior al login: solo rutas internas, sin esquemas, dobles
 * barras ni rutas de autenticación.
 */
export function safeNextPath(value: string | null | undefined, fallback: string, blockedPrefixes: readonly string[] = []): string {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 2_048 || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback;
  }
  try {
    const base = new URL('https://despega.invalid');
    const target = new URL(candidate, base);
    const path = decodeURIComponent(target.pathname);
    if (
      target.origin !== base.origin
      || path.includes('\\')
      || ['/api', '/_next', ...blockedPrefixes].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
    ) {
      return fallback;
    }
    return `${target.pathname}${target.search}`;
  } catch {
    return fallback;
  }
}
