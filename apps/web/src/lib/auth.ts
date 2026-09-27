import 'server-only';

import {
  AuthError,
  LOCAL_SESSION_SECONDS,
  authConfigFromEnv,
  cookieOptions,
  isLoopbackHost,
  sessionCookieNames,
  signLocalSession,
  verifyAccessToken,
  verifyIdToken,
  verifyLocalSession,
  type AuthConfig,
  type SessionTokens,
} from '@despega/auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

const production = process.env.NODE_ENV === 'production';
const REFRESH_SECONDS = 30 * 24 * 60 * 60;

export const WEB_COOKIES = sessionCookieNames('despega_web', production);

export type StudentSession = {
  readonly studentId: string;
  readonly email: string;
  readonly givenName: string;
  readonly familyName?: string;
  readonly provider: 'cognito' | 'local';
};

export function webAuthConfig(): AuthConfig {
  return authConfigFromEnv();
}

/**
 * Estudiante autenticado de la petición actual. El proxy ya renovó los tokens si
 * estaban por vencer; aquí se verifican firma, emisor y audiencia.
 */
export async function currentStudent(): Promise<StudentSession | null> {
  const config = webAuthConfig();
  const store = await cookies();

  if (config.provider === 'local') {
    if (!isLoopbackHost((await headers()).get('host'))) return null;
    const session = verifyLocalSession(store.get(WEB_COOKIES.local)?.value, 'web');
    return session
      ? { studentId: session.subject, email: session.email, givenName: session.givenName, familyName: session.familyName, provider: 'local' }
      : null;
  }

  const accessToken = store.get(WEB_COOKIES.access)?.value;
  const idToken = store.get(WEB_COOKIES.id)?.value;
  if (!accessToken || !idToken) return null;
  try {
    const access = await verifyAccessToken(config, accessToken);
    const identity = await verifyIdToken(config, idToken);
    if (access.subject !== identity.subject) return null;
    return {
      studentId: identity.subject,
      email: identity.email,
      givenName: identity.givenName,
      familyName: identity.familyName,
      provider: 'cognito',
    };
  } catch {
    return null;
  }
}

export async function requireStudent(returnTo: string): Promise<StudentSession> {
  const student = await currentStudent();
  if (!student) redirect(`/ingresar?next=${encodeURIComponent(returnTo)}`);
  return student;
}

export async function storeCognitoSession(tokens: SessionTokens): Promise<void> {
  const store = await cookies();
  const tokenAge = Math.max(60, tokens.expiresIn);
  store.set(WEB_COOKIES.access, tokens.accessToken, cookieOptions(tokenAge, production));
  if (tokens.idToken) store.set(WEB_COOKIES.id, tokens.idToken, cookieOptions(tokenAge, production));
  if (tokens.refreshToken) store.set(WEB_COOKIES.refresh, tokens.refreshToken, cookieOptions(REFRESH_SECONDS, production));
}

export async function storeLocalSession(identity: { subject: string; email: string; givenName: string; familyName?: string }): Promise<void> {
  await assertLocalRequest();
  const store = await cookies();
  store.set(
    WEB_COOKIES.local,
    signLocalSession({ ...identity, groups: [], audience: 'web' }),
    cookieOptions(LOCAL_SESSION_SECONDS, production),
  );
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(WEB_COOKIES.refresh)?.value;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  for (const name of Object.values(WEB_COOKIES)) store.set(name, '', cookieOptions(0, production));
}

/** El proveedor local solo atiende peticiones a la propia máquina. */
export async function assertLocalRequest(): Promise<void> {
  if (!isLoopbackHost((await headers()).get('host'))) {
    throw new AuthError('LOCAL_ONLY', 'El acceso local solo funciona desde localhost.');
  }
}
