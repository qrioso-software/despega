import {
  authConfigFromEnv,
  cookieOptions,
  isLoopbackHost,
  refreshTokens,
  sessionCookieNames,
  tokenExpiresSoon,
  verifyAccessToken,
  verifyLocalSession,
  type AuthConfig,
  type SessionTokens,
} from '@despega/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { staffGroups } from './lib/staff';

const production = process.env.NODE_ENV === 'production';
const COOKIES = sessionCookieNames('despega_admin', production);
const REFRESH_SECONDS = 7 * 24 * 60 * 60;

type Resolution = { authenticated: boolean; hadSession: boolean; forbidden?: boolean; refreshed?: SessionTokens };

/** Todo el backoffice exige sesión de staff; solo `/login` es público. */
export async function proxy(request: NextRequest) {
  const onLogin = request.nextUrl.pathname === '/login';
  let config: AuthConfig;
  try {
    config = authConfigFromEnv();
  } catch {
    return NextResponse.next();
  }

  const session = await resolveSession(request, config);
  if (onLogin) {
    if (session.authenticated && request.method === 'GET') {
      return withRefreshedCookies(NextResponse.redirect(new URL('/', request.url)), session.refreshed);
    }
    return NextResponse.next();
  }

  if (!session.authenticated) {
    const login = new URL('/login', request.url);
    if (session.forbidden) login.searchParams.set('motivo', 'sin-acceso');
    else if (session.hadSession) login.searchParams.set('motivo', 'sesion-vencida');
    const response = NextResponse.redirect(login);
    if (session.hadSession) for (const name of Object.values(COOKIES)) response.cookies.set(name, '', cookieOptions(0, production, 'strict'));
    return response;
  }

  if (!session.refreshed) return NextResponse.next();
  const requestCookies = new Map(request.cookies.getAll().map(({ name, value }) => [name, value]));
  requestCookies.set(COOKIES.access, session.refreshed.accessToken);
  if (session.refreshed.idToken) requestCookies.set(COOKIES.id, session.refreshed.idToken);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('cookie', [...requestCookies].map(([name, value]) => `${name}=${value}`).join('; '));
  return withRefreshedCookies(NextResponse.next({ request: { headers: requestHeaders } }), session.refreshed);
}

async function resolveSession(request: NextRequest, config: AuthConfig): Promise<Resolution> {
  if (config.provider === 'local') {
    const token = request.cookies.get(COOKIES.local)?.value;
    const session = isLoopbackHost(request.headers.get('host')) ? verifyLocalSession(token, 'admin') : null;
    const allowed = session !== null && staffGroups(session.groups).length > 0;
    return { authenticated: allowed, hadSession: Boolean(token), forbidden: session !== null && !allowed };
  }

  const accessToken = request.cookies.get(COOKIES.access)?.value;
  const refreshToken = request.cookies.get(COOKIES.refresh)?.value;
  const hadSession = Boolean(accessToken || refreshToken);
  if (accessToken && !tokenExpiresSoon(accessToken)) {
    try {
      const access = await verifyAccessToken(config, accessToken);
      if (staffGroups(access.groups).length === 0) return { authenticated: false, hadSession, forbidden: true };
      return { authenticated: true, hadSession };
    } catch {
      // Solo el refresh token puede recuperar un access token inválido.
    }
  }
  if (!refreshToken) return { authenticated: false, hadSession };
  try {
    const refreshed = await refreshTokens(config, refreshToken);
    const access = await verifyAccessToken(config, refreshed.accessToken);
    if (staffGroups(access.groups).length === 0) return { authenticated: false, hadSession, forbidden: true };
    return { authenticated: true, hadSession, refreshed };
  } catch {
    return { authenticated: false, hadSession };
  }
}

function withRefreshedCookies(response: NextResponse, tokens: SessionTokens | undefined): NextResponse {
  if (!tokens) return response;
  const tokenAge = Math.max(60, tokens.expiresIn);
  response.cookies.set(COOKIES.access, tokens.accessToken, cookieOptions(tokenAge, production, 'strict'));
  if (tokens.idToken) response.cookies.set(COOKIES.id, tokens.idToken, cookieOptions(tokenAge, production, 'strict'));
  if (tokens.refreshToken) response.cookies.set(COOKIES.refresh, tokens.refreshToken, cookieOptions(REFRESH_SECONDS, production, 'strict'));
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)'],
};
