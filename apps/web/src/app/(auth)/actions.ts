'use server';

import {
  STUDENT_PASSWORD_POLICY,
  confirmPasswordReset,
  confirmSignUp,
  localSubject,
  passwordProblem,
  resendConfirmationCode,
  revokeRefreshToken,
  safeNextPath,
  signIn,
  signUp,
  startPasswordReset,
  toAuthError,
  verifyIdToken,
  type AuthConfig,
} from '@despega/auth';
import { ensureStudent, getStudent } from '@despega/data';
import { redirect } from 'next/navigation';
import {
  assertLocalRequest,
  clearSession,
  readRefreshToken,
  storeCognitoSession,
  storeLocalSession,
  webAuthConfig,
} from '@/lib/auth';
import { dataConfig } from '@/lib/data';

export type AuthFormState = {
  readonly status: 'idle' | 'error' | 'success';
  readonly message?: string;
  readonly email?: string;
  /** Recuperación de contraseña: `code` cuando ya se envió el código. */
  readonly step?: 'request' | 'code';
};

const GUEST_PATHS = ['/ingresar', '/registro', '/recuperar'];
const DATA_UNAVAILABLE = 'No pudimos guardar tu perfil. Revisa tu conexión e intenta de nuevo.';

export async function signInAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get('email'));
  const password = String(formData.get('password') ?? '');
  const next = safeNextPath(String(formData.get('next') ?? ''), '/inicio', GUEST_PATHS);
  if (!email) return failure('Escribe un correo válido.', email);

  const config = resolveConfig();
  if ('status' in config) return config;

  if (config.provider === 'local') {
    try {
      await assertLocalRequest();
      const profile = await getStudent(dataConfig(), localSubject(email));
      if (!profile) return failure('No hay una cuenta de acceso local con ese correo en DEV. Créala en «Crear cuenta».', email);
      await storeLocalSession({ subject: profile.studentId, email: profile.email, givenName: profile.givenName, familyName: profile.familyName });
    } catch (error) {
      return failure(describe(error), email);
    }
    redirect(next);
  }

  if (!password) return failure('Escribe tu contraseña.', email);
  let tokens;
  let identity;
  try {
    const step = await signIn(config, email, password);
    if (step.kind !== 'authenticated') {
      return failure('Tu cuenta necesita una contraseña nueva. Usa «¿Olvidaste tu contraseña?» para continuar.', email);
    }
    tokens = step.tokens;
    if (!tokens.idToken) return failure('El servicio de autenticación no devolvió tu identidad.', email);
    identity = await verifyIdToken(config, tokens.idToken);
  } catch (error) {
    const authError = toAuthError(error);
    if (authError.code === 'USER_NOT_CONFIRMED') redirect(`/registro/confirmar?email=${encodeURIComponent(email)}`);
    return failure(authError.message, email);
  }

  try {
    await ensureStudent(
      dataConfig(),
      { studentId: identity.subject, email: identity.email, givenName: identity.givenName, familyName: identity.familyName, authProvider: 'cognito' },
      { now: new Date().toISOString() },
    );
  } catch (error) {
    console.error('No se pudo asegurar el perfil del estudiante.', error);
    return failure(DATA_UNAVAILABLE, email);
  }
  await storeCognitoSession(tokens);
  redirect(next);
}

export async function signUpAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get('email'));
  const givenName = text(formData.get('givenName'), 40);
  const familyName = text(formData.get('familyName'), 60);
  const grade = text(formData.get('grade'), 40);
  const school = text(formData.get('school'), 80);
  const password = String(formData.get('password') ?? '');
  const consent = formData.get('consent') === 'on';

  if (!givenName) return failure('Escribe tu nombre: serás el protagonista de la historia.', email);
  if (!email) return failure('Escribe un correo válido.', email);
  if (!consent) return failure('Necesitamos tu autorización para guardar tus decisiones y mostrarte tus resultados.', email);

  const config = resolveConfig();
  if ('status' in config) return config;
  const now = new Date().toISOString();

  if (config.provider === 'local') {
    try {
      await assertLocalRequest();
      const studentId = localSubject(email);
      if (await getStudent(dataConfig(), studentId)) {
        return failure('Ya existe una cuenta de acceso local con ese correo en DEV. Ingresa con ella.', email);
      }
      await ensureStudent(
        dataConfig(),
        { studentId, email, givenName, familyName: familyName || undefined, authProvider: 'local' },
        { grade, school, now },
      );
      await storeLocalSession({ subject: studentId, email, givenName, familyName: familyName || undefined });
    } catch (error) {
      return failure(describe(error), email);
    }
    redirect('/inicio');
  }

  const problem = passwordProblem(password, STUDENT_PASSWORD_POLICY);
  if (problem) return failure(problem, email);

  let result;
  try {
    result = await signUp(config, { email, password, givenName, familyName: familyName || undefined });
  } catch (error) {
    return failure(toAuthError(error).message, email);
  }
  try {
    await ensureStudent(
      dataConfig(),
      { studentId: result.userSub, email, givenName, familyName: familyName || undefined, authProvider: 'cognito' },
      { grade, school, now },
    );
  } catch (error) {
    // El perfil se vuelve a asegurar en el primer ingreso; la cuenta ya existe en Cognito.
    console.error('No se pudo crear el perfil durante el registro.', error);
  }
  if (result.confirmed) redirect(`/ingresar?email=${encodeURIComponent(email)}&cuenta=confirmada`);
  redirect(`/registro/confirmar?email=${encodeURIComponent(email)}`);
}

export async function confirmSignUpAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get('email'));
  const code = String(formData.get('code') ?? '').replace(/\s+/g, '');
  if (!email || !/^\d{4,10}$/.test(code)) return failure('Escribe el código de 6 dígitos que llegó a tu correo.', email);

  const config = resolveConfig();
  if ('status' in config) return config;
  if (config.provider !== 'cognito') redirect('/ingresar');

  try {
    await confirmSignUp(config, { email, code });
  } catch (error) {
    return failure(toAuthError(error).message, email);
  }
  redirect(`/ingresar?email=${encodeURIComponent(email)}&cuenta=confirmada`);
}

export async function resendCodeAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get('email'));
  if (!email) return failure('Escribe un correo válido.', email);
  const config = resolveConfig();
  if ('status' in config) return config;
  if (config.provider !== 'cognito') return failure('En el modo local no se envían códigos.', email);
  try {
    await resendConfirmationCode(config, email);
    return { status: 'success', email, message: 'Te enviamos un código nuevo. Revisa también la carpeta de spam.' };
  } catch (error) {
    return failure(toAuthError(error).message, email);
  }
}

export async function passwordResetAction(previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get('email'));
  if (!email) return failure('Escribe un correo válido.', email, previous.step);
  const config = resolveConfig();
  if ('status' in config) return config;
  if (config.provider !== 'cognito') return failure('En el modo local las cuentas no usan contraseña.', email);

  if (formData.get('intent') === 'request') {
    try {
      await startPasswordReset(config, email);
    } catch (error) {
      return failure(toAuthError(error).message, email, 'request');
    }
    return { status: 'success', step: 'code', email, message: 'Si el correo tiene una cuenta, te llegará un código en unos segundos.' };
  }

  const code = String(formData.get('code') ?? '').replace(/\s+/g, '');
  const password = String(formData.get('password') ?? '');
  const problem = passwordProblem(password, STUDENT_PASSWORD_POLICY);
  if (!/^\d{4,10}$/.test(code)) return failure('Escribe el código que llegó a tu correo.', email, 'code');
  if (problem) return failure(problem, email, 'code');
  try {
    await confirmPasswordReset(config, { email, code, password });
  } catch (error) {
    return failure(toAuthError(error).message, email, 'code');
  }
  redirect(`/ingresar?email=${encodeURIComponent(email)}&clave=actualizada`);
}

export async function signOutAction(): Promise<void> {
  try {
    const config = webAuthConfig();
    const refreshToken = await readRefreshToken();
    if (config.provider === 'cognito' && refreshToken) await revokeRefreshToken(config, refreshToken);
  } catch {
    // Las cookies se limpian aunque Cognito ya haya revocado o vencido el token.
  }
  await clearSession();
  redirect('/');
}

function resolveConfig(): AuthConfig | AuthFormState {
  try {
    return webAuthConfig();
  } catch (error) {
    return failure(toAuthError(error).message);
  }
}

function failure(message: string, email?: string, step?: AuthFormState['step']): AuthFormState {
  return { status: 'error', message, email, step };
}

function describe(error: unknown): string {
  const authError = toAuthError(error);
  if (authError.code !== 'PROVIDER_ERROR') return authError.message;
  console.error('Fallo en el acceso local.', error);
  return 'No pudimos conectar con DynamoDB de DEV. Renueva la sesión con `aws sso login --profile qrioso-dev` y verifica `pnpm local:setup`.';
}

function normalizeEmail(value: FormDataEntryValue | null): string {
  const email = String(value ?? '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function text(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}
