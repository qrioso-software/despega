'use server';

import {
  STAFF_PASSWORD_POLICY,
  completeNewPassword,
  localSubject,
  passwordProblem,
  revokeRefreshToken,
  signIn,
  toAuthError,
  verifyAccessToken,
  type AuthConfig,
  type SignInStep,
} from '@despega/auth';
import { redirect } from 'next/navigation';
import {
  adminAuthConfig,
  assertLocalRequest,
  clearSession,
  readChallenge,
  readRefreshToken,
  storeChallenge,
  storeCognitoSession,
  storeLocalSession,
} from '@/lib/auth';
import { STAFF_GROUPS, staffGroups, type StaffGroup } from '@/lib/staff';

export type LoginState = {
  readonly status: 'idle' | 'error';
  readonly step: 'credentials' | 'new-password';
  readonly message?: string;
  readonly email?: string;
};

const NO_ACCESS = 'Tu cuenta no tiene un rol del backoffice. Pide acceso a un administrador de DESPEGA.';

export async function staffSignInAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { status: 'error', step: 'credentials', message: 'Escribe un correo válido.', email };
  }

  let config: AuthConfig;
  try {
    config = adminAuthConfig();
  } catch (error) {
    return { status: 'error', step: 'credentials', message: toAuthError(error).message, email };
  }

  if (config.provider === 'local') {
    const role = String(formData.get('role') ?? 'despega/admin');
    const group: StaffGroup = (STAFF_GROUPS as readonly string[]).includes(role) ? (role as StaffGroup) : 'despega/admin';
    try {
      await assertLocalRequest();
      await storeLocalSession({ subject: localSubject(email), email, name: email.split('@')[0] ?? email, group });
    } catch (error) {
      return { status: 'error', step: 'credentials', message: toAuthError(error).message, email };
    }
    redirect('/');
  }

  if (!password) return { status: 'error', step: 'credentials', message: 'Escribe tu contraseña.', email };
  let step: SignInStep;
  try {
    step = await signIn(config, email, password);
  } catch (error) {
    return { status: 'error', step: 'credentials', message: toAuthError(error).message, email };
  }
  if (step.kind === 'new-password') {
    await storeChallenge({ session: step.session, username: step.username });
    return { status: 'idle', step: 'new-password', email };
  }
  return finish(config, step, email);
}

export async function staffNewPasswordAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');
  const problem = passwordProblem(password, STAFF_PASSWORD_POLICY);
  if (problem) return { status: 'error', step: 'new-password', message: problem };
  if (password !== confirmation) return { status: 'error', step: 'new-password', message: 'Las contraseñas no coinciden.' };

  const challenge = await readChallenge();
  if (!challenge) return { status: 'error', step: 'credentials', message: 'El paso de seguridad venció. Vuelve a ingresar con tu contraseña temporal.' };

  let config: AuthConfig;
  let step: SignInStep;
  try {
    config = adminAuthConfig();
    if (config.provider !== 'cognito') return { status: 'error', step: 'credentials', message: 'El modo local no usa contraseñas.' };
    step = await completeNewPassword(config, { ...challenge, newPassword: password });
  } catch (error) {
    return { status: 'error', step: 'new-password', message: toAuthError(error).message };
  }
  if (step.kind !== 'authenticated') return { status: 'error', step: 'new-password', message: 'Cognito pidió otro paso de seguridad no soportado.' };
  return finish(config, step, challenge.username);
}

export async function staffSignOutAction(): Promise<void> {
  try {
    const config = adminAuthConfig();
    const refreshToken = await readRefreshToken();
    if (config.provider === 'cognito' && refreshToken) await revokeRefreshToken(config, refreshToken);
  } catch {
    // Las cookies se limpian aunque el token ya no sea válido.
  }
  await clearSession();
  redirect('/login');
}

async function finish(config: AuthConfig, step: Extract<SignInStep, { kind: 'authenticated' }>, email: string): Promise<LoginState> {
  if (config.provider !== 'cognito') return { status: 'error', step: 'credentials', message: 'Configuración inválida.' };
  try {
    const access = await verifyAccessToken(config, step.tokens.accessToken);
    if (staffGroups(access.groups).length === 0) return { status: 'error', step: 'credentials', message: NO_ACCESS, email };
  } catch (error) {
    return { status: 'error', step: 'credentials', message: toAuthError(error).message, email };
  }
  await storeCognitoSession(step.tokens);
  redirect('/');
}
