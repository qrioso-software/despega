import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuthConfigurationError, authConfigFromEnv } from './config.ts';
import { toAuthError } from './errors.ts';
import { isLoopbackHost, localSubject, signLocalSession, verifyLocalSession } from './local.ts';
import { STAFF_PASSWORD_POLICY, STUDENT_PASSWORD_POLICY, passwordProblem } from './password.ts';
import { safeNextPath, sessionCookieNames, tokenExpiresSoon } from './session.ts';

describe('configuración', () => {
  it('solo permite el proveedor local con STAGE=local', () => {
    assert.deepEqual(authConfigFromEnv({ AUTH_PROVIDER: 'local', STAGE: 'local' }), { provider: 'local', stage: 'local' });
    assert.throws(() => authConfigFromEnv({ AUTH_PROVIDER: 'local', STAGE: 'dev' }), AuthConfigurationError);
    assert.throws(() => authConfigFromEnv({ AUTH_PROVIDER: 'otro', STAGE: 'dev' }), AuthConfigurationError);
  });

  it('deriva la región del user pool de Cognito', () => {
    const config = authConfigFromEnv({
      AUTH_PROVIDER: 'cognito',
      STAGE: 'dev',
      COGNITO_USER_POOL_ID: 'us-east-1_abc123',
      COGNITO_CLIENT_ID: 'client',
    });
    assert.equal(config.provider === 'cognito' && config.region, 'us-east-1');
    assert.throws(() => authConfigFromEnv({ AUTH_PROVIDER: 'cognito', STAGE: 'dev' }), AuthConfigurationError);
  });
});

describe('sesión local', () => {
  const session = { subject: localSubject('Ana@Colegio.edu'), email: 'ana@colegio.edu', givenName: 'Ana', groups: [], audience: 'web' as const };

  it('firma y verifica la cookie para su audiencia', () => {
    const token = signLocalSession(session);
    assert.equal(verifyLocalSession(token, 'web')?.givenName, 'Ana');
    assert.equal(verifyLocalSession(token, 'admin'), null, 'una sesión de estudiante no abre el backoffice');
  });

  it('rechaza cookies alteradas o vencidas', () => {
    const token = signLocalSession(session);
    const [body, signature] = token.split('.');
    const tampered = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body!, 'base64url').toString()), groups: ['despega/admin'] })).toString('base64url');
    assert.equal(verifyLocalSession(`${tampered}.${signature}`, 'web'), null);
    assert.equal(verifyLocalSession(token, 'web', Date.now() + 31 * 24 * 60 * 60 * 1_000), null);
    assert.equal(verifyLocalSession('basura', 'web'), null);
  });

  it('identifica al mismo estudiante por correo sin importar mayúsculas', () => {
    assert.equal(localSubject(' ANA@colegio.edu '), localSubject('ana@colegio.edu'));
    assert.match(localSubject('ana@colegio.edu'), /^local-[0-9a-f]{24}$/);
  });

  it('solo reconoce hosts loopback', () => {
    assert.equal(isLoopbackHost('localhost:3000'), true);
    assert.equal(isLoopbackHost('127.0.0.1:3001'), true);
    assert.equal(isLoopbackHost('[::1]:3000'), true);
    assert.equal(isLoopbackHost('despega.example'), false);
    assert.equal(isLoopbackHost('localhost.evil.example'), false);
    assert.equal(isLoopbackHost(null), false);
  });
});

describe('utilidades de sesión', () => {
  it('usa cookies __Host- en producción', () => {
    assert.equal(sessionCookieNames('despega_web', true).access, '__Host-despega_web_access');
    assert.equal(sessionCookieNames('despega_web', false).refresh, 'despega_web_refresh');
  });

  it('solo redirige a rutas internas', () => {
    assert.equal(safeNextPath('/simulador/ingenieria-software', '/inicio'), '/simulador/ingenieria-software');
    assert.equal(safeNextPath('https://evil.example', '/inicio'), '/inicio');
    assert.equal(safeNextPath('//evil.example', '/inicio'), '/inicio');
    assert.equal(safeNextPath('/api/secret', '/inicio'), '/inicio');
    assert.equal(safeNextPath('/ingresar', '/inicio', ['/ingresar']), '/inicio');
  });

  it('detecta tokens por vencer', () => {
    const payload = (exp: number) => `x.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.y`;
    const now = Date.now();
    assert.equal(tokenExpiresSoon(payload(Math.floor(now / 1_000) + 3_600), now), false);
    assert.equal(tokenExpiresSoon(payload(Math.floor(now / 1_000) + 30), now), true);
    assert.equal(tokenExpiresSoon('roto', now), true);
  });
});

describe('contraseñas y errores', () => {
  it('aplica la política de cada pool', () => {
    assert.equal(passwordProblem('clave1234', STUDENT_PASSWORD_POLICY), null);
    assert.match(passwordProblem('clave', STUDENT_PASSWORD_POLICY)!, /8 caracteres/);
    assert.match(passwordProblem('clavelarga1234', STAFF_PASSWORD_POLICY)!, /mayúscula/);
  });

  it('no revela si la cuenta existe', () => {
    const notFound = toAuthError(Object.assign(new Error('x'), { name: 'UserNotFoundException' }));
    const wrong = toAuthError(Object.assign(new Error('x'), { name: 'NotAuthorizedException' }));
    assert.equal(notFound.message, wrong.message);
  });
});
