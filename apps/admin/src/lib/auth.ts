import 'server-only';

import {
  AuthError,
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
import { staffGroups, type StaffGroup } from './staff';

const production = process.env.NODE_ENV === 'production';
const REFRESH_SECONDS = 7 * 24 * 60 * 60;
const CHALLENGE_SECONDS = 3 * 60;
const LOCAL_SECONDS = 12 * 60 * 60;

export const ADMIN_COOKIES = sessionCookieNames('despega_admin', production);

export type StaffSession = {
  readonly subject: string;
  readonly email: string;
  readonly name: string;
  readonly groups: readonly StaffGroup[];
  readonly provider: 'cognito' | 'local';
};

export function adminAuthConfig(): AuthConfig {
  return authConfigFromEnv();
}

export async function currentStaff(): Promise<StaffSession | null> {
  const config = adminAuthConfig();
  const store = await cookies();

  if (config.provider === 'local') {
    if (!isLoopbackHost((await headers()).get('host'))) return null;
    const session = verifyLocalSession(store.get(ADMIN_COOKIES.local)?.value, 'admin');
    const groups = session ? staffGroups(session.groups) : [];
    return session && groups.length > 0
      ? { subject: session.subject, email: session.email, name: session.givenName, groups, provider: 'local' }
      : null;
  }

  const accessToken = store.get(ADMIN_COOKIES.access)?.value;
  const idToken = store.get(ADMIN_COOKIES.id)?.value;
  if (!accessToken || !idToken) return null;
  try {
    const access = await verifyAccessToken(config, accessToken);
    const groups = staffGroups(access.groups);
    if (groups.length === 0) return null;
    const identity = await verifyIdToken(config, idToken);
    if (identity.subject !== access.subject) return null;
    const name = [identity.givenName, identity.familyName].filter(Boolean).join(' ') || identity.email;
    return { subject: identity.subject, email: identity.email, name, groups, provider: 'cognito' };
  } catch {
    return null;
  }
}

export async function requireStaff(): Promise<StaffSession> {
  const staff = await currentStaff();
  if (!staff) redirect('/login');
  return staff;
}

export async function storeCognitoSession(tokens: SessionTokens): Promise<void> {
  const store = await cookies();
  const tokenAge = Math.max(60, tokens.expiresIn);
  store.set(ADMIN_COOKIES.access, tokens.accessToken, cookieOptions(tokenAge, production, 'strict'));
  if (tokens.idToken) store.set(ADMIN_COOKIES.id, tokens.idToken, cookieOptions(tokenAge, production, 'strict'));
  if (tokens.refreshToken) store.set(ADMIN_COOKIES.refresh, tokens.refreshToken, cookieOptions(REFRESH_SECONDS, production, 'strict'));
  store.set(ADMIN_COOKIES.challenge, '', cookieOptions(0, production, 'strict'));
}

export async function storeLocalSession(identity: { subject: string; email: string; name: string; group: StaffGroup }): Promise<void> {
  await assertLocalRequest();
  const store = await cookies();
  store.set(
    ADMIN_COOKIES.local,
    signLocalSession({ subject: identity.subject, email: identity.email, givenName: identity.name, groups: [identity.group], audience: 'admin' }),
    cookieOptions(LOCAL_SECONDS, production, 'strict'),
  );
}

/** Desafío de contraseña nueva (cuentas creadas por un administrador). */
export async function storeChallenge(challenge: { session: string; username: string }): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIES.challenge, JSON.stringify(challenge), cookieOptions(CHALLENGE_SECONDS, production, 'strict'));
}

export async function readChallenge(): Promise<{ session: string; username: string } | null> {
  const raw = (await cookies()).get(ADMIN_COOKIES.challenge)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { session?: unknown; username?: unknown };
    return typeof value.session === 'string' && typeof value.username === 'string'
      ? { session: value.session, username: value.username }
      : null;
  } catch {
    return null;
  }
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_COOKIES.refresh)?.value;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  for (const name of Object.values(ADMIN_COOKIES)) store.set(name, '', cookieOptions(0, production, 'strict'));
}

export async function assertLocalRequest(): Promise<void> {
  if (!isLoopbackHost((await headers()).get('host'))) {
    throw new AuthError('LOCAL_ONLY', 'El acceso local solo funciona desde localhost.');
  }
}
