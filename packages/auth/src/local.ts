import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Proveedor de identidad local para desarrollo sin cuenta AWS. No guarda contraseñas:
 * identifica por correo y firma una cookie. Nunca se habilita fuera de STAGE=local y
 * solo acepta peticiones cuyo host sea loopback; CDK y el build de Amplify rechazan
 * AUTH_PROVIDER=local. Por eso la clave de firma puede ser fija y pública.
 */
const LOCAL_SIGNING_KEY = 'despega-local-development-only';
const LOCAL_ISSUER = 'despega-local';

export type LocalAudience = 'web' | 'admin';

export type LocalSession = {
  readonly subject: string;
  readonly email: string;
  readonly givenName: string;
  readonly familyName?: string;
  readonly groups: readonly string[];
  readonly audience: LocalAudience;
  readonly expiresAt: number;
};

export const LOCAL_SESSION_SECONDS = 30 * 24 * 60 * 60;

export function localSubject(email: string): string {
  return `local-${createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 24)}`;
}

export function signLocalSession(session: Omit<LocalSession, 'expiresAt'>, now = Date.now()): string {
  const payload: LocalSession & { iss: string } = {
    ...session,
    expiresAt: Math.floor(now / 1_000) + LOCAL_SESSION_SECONDS,
    iss: LOCAL_ISSUER,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${signature(body)}`;
}

export function verifyLocalSession(token: string | undefined, audience: LocalAudience, now = Date.now()): LocalSession | null {
  if (!token) return null;
  const [body, provided, extra] = token.split('.');
  if (!body || !provided || extra !== undefined) return null;
  const expected = signature(body);
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<LocalSession> & { iss?: string };
    if (
      payload.iss !== LOCAL_ISSUER
      || payload.audience !== audience
      || typeof payload.subject !== 'string'
      || typeof payload.email !== 'string'
      || typeof payload.givenName !== 'string'
      || !Array.isArray(payload.groups)
      || typeof payload.expiresAt !== 'number'
      || payload.expiresAt <= Math.floor(now / 1_000)
    ) {
      return null;
    }
    return {
      subject: payload.subject,
      email: payload.email,
      givenName: payload.givenName,
      familyName: typeof payload.familyName === 'string' ? payload.familyName : undefined,
      groups: payload.groups.filter((group): group is string => typeof group === 'string'),
      audience,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

/** El modo local solo atiende peticiones hechas a la propia máquina. */
export function isLoopbackHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.split(':')[0];
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function signature(body: string): string {
  return createHmac('sha256', LOCAL_SIGNING_KEY).update(body).digest('base64url');
}
