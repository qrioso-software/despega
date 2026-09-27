import {
  authConfigFromEnv,
  cookieOptions,
  isLoopbackHost,
  refreshTokens,
  safeNextPath,
  sessionCookieNames,
  tokenExpiresSoon,
  verifyAccessToken,
  verifyLocalSession,
  type AuthConfig,
  type SessionTokens,
} from '@despega/auth';
import { NextResponse, type NextRequest } from 'next/server';

const production = process.env.NODE_ENV === 'production';
const COOKIES = sessionCookieNames('despega_web', production);
const PROTECTED_PATHS = ['/inicio', '/simulador'];
const GUEST_PATHS = ['/ingresar', '/registro', '/recuperar'];
const HOME = '/inicio';
const REFRESH_SECONDS = 30 * 24 * 60 * 60;

type Resolution = { authenticated: boolean; hadSession: boolean; refreshed?: SessionTokens };

/**
 * Protege las rutas del estudiante y renueva los tokens de Cognito antes de que el
 * SSR o una Server Action los necesite. La verificación final ocurre en `lib/auth.ts`.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = matches(path, PROTECTED_PATHS);
  const isGuestPage = matches(path, GUEST_PATHS);
  if (!isProtected && !isGuestPage) return NextResponse.next();
  // Los formularios de acceso son Server Actions: nunca se redirige un POST.
  if (isGuestPage && request.method !== 'GET') return NextResponse.next();

  let config: AuthConfig;
  try {
    config = authConfigFromEnv();
  } catch {
    // Sin configuración de identidad la página muestra el error de forma explícita.
    return NextResponse.next();
  }

  const session = await resolveSession(request, config);

  if (isGuestPage) {
    if (!session.authenticated) return NextResponse.next();
    const destination = safeNextPath(request.nextUrl.searchParams.get('next'), HOME, GUEST_PATHS);
    return withRefreshedCookies(NextResponse.redirect(new URL(destination, request.url)), session.refreshed);
  }

  if (!session.authenticated) {
    const login = new URL('/ingresar', request.url);
    login.searchParams.set('next', safeNextPath(`${path}${request.nextUrl.search}`, HOME, GUEST_PATHS));
    if (session.hadSession) login.searchParams.set('motivo', 'sesion-vencida');
    const response = NextResponse.redirect(login);
    if (session.hadSession) for (const name of Object.values(COOKIES)) response.cookies.set(name, '', cookieOptions(0, production));
    return response;
  }

  if (!session.refreshed) return NextResponse.next();

  // El SSR de esta misma petición debe ver los tokens nuevos, no los vencidos.
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
    const valid = isLoopbackHost(request.headers.get('host')) && verifyLocalSession(token, 'web') !== null;
    return { authenticated: valid, hadSession: Boolean(token) };
  }

  const accessToken = request.cookies.get(COOKIES.access)?.value;
  const refreshToken = request.cookies.get(COOKIES.refresh)?.value;
  const hadSession = Boolean(accessToken || refreshToken);
  if (accessToken && !tokenExpiresSoon(accessToken)) {
    try {
      await verifyAccessToken(config, accessToken);
      return { authenticated: true, hadSession };
    } catch {
      // Un access token inválido solo se recupera con el refresh token.
    }
  }
  if (!refreshToken) return { authenticated: false, hadSession };
  try {
    const refreshed = await refreshTokens(config, refreshToken);
    await verifyAccessToken(config, refreshed.accessToken);
    return { authenticated: true, hadSession, refreshed };
  } catch {
    return { authenticated: false, hadSession };
  }
}

function withRefreshedCookies(response: NextResponse, tokens: SessionTokens | undefined): NextResponse {
  if (!tokens) return response;
  const tokenAge = Math.max(60, tokens.expiresIn);
  response.cookies.set(COOKIES.access, tokens.accessToken, cookieOptions(tokenAge, production));
  if (tokens.idToken) response.cookies.set(COOKIES.id, tokens.idToken, cookieOptions(tokenAge, production));
  if (tokens.refreshToken) response.cookies.set(COOKIES.refresh, tokens.refreshToken, cookieOptions(REFRESH_SECONDS, production));
  return response;
}

function matches(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
