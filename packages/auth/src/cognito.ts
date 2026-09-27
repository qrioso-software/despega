import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  RevokeTokenCommand,
  SignUpCommand,
  type AuthenticationResultType,
  type ChallengeNameType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { AuthConfig } from './config.ts';
import { AuthError, toAuthError } from './errors.ts';

type CognitoConfig = Extract<AuthConfig, { provider: 'cognito' }>;

export type SessionTokens = {
  readonly accessToken: string;
  readonly idToken?: string;
  readonly refreshToken?: string;
  readonly expiresIn: number;
};

export type SignInStep =
  | { readonly kind: 'authenticated'; readonly tokens: SessionTokens }
  | { readonly kind: 'new-password'; readonly session: string; readonly username: string };

export type VerifiedIdentity = {
  readonly subject: string;
  readonly email: string;
  readonly givenName: string;
  readonly familyName?: string;
  readonly groups: readonly string[];
};

const clients = new Map<string, CognitoIdentityProviderClient>();
const verifiers = new Map<string, { access: AccessVerifier; id: IdVerifier }>();

type AccessVerifier = ReturnType<typeof createAccessVerifier>;
type IdVerifier = ReturnType<typeof createIdVerifier>;

function createAccessVerifier(config: CognitoConfig) {
  return CognitoJwtVerifier.create({ userPoolId: config.userPoolId, tokenUse: 'access', clientId: config.clientId });
}

function createIdVerifier(config: CognitoConfig) {
  return CognitoJwtVerifier.create({ userPoolId: config.userPoolId, tokenUse: 'id', clientId: config.clientId });
}

function client(config: CognitoConfig): CognitoIdentityProviderClient {
  let instance = clients.get(config.region);
  if (!instance) {
    instance = new CognitoIdentityProviderClient({ region: config.region });
    clients.set(config.region, instance);
  }
  return instance;
}

function verifierFor(config: CognitoConfig) {
  const key = `${config.userPoolId}|${config.clientId}`;
  let pair = verifiers.get(key);
  if (!pair) {
    pair = { access: createAccessVerifier(config), id: createIdVerifier(config) };
    verifiers.set(key, pair);
  }
  return pair;
}

async function call<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toAuthError(error);
  }
}

function tokens(result: AuthenticationResultType | undefined, requireRefresh: boolean): SessionTokens {
  if (!result?.AccessToken || (requireRefresh && !result.RefreshToken)) {
    throw new AuthError('PROVIDER_ERROR', 'El servicio de autenticación no devolvió una sesión completa.');
  }
  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    expiresIn: result.ExpiresIn ?? 3_600,
  };
}

function nextStep(
  result: { AuthenticationResult?: AuthenticationResultType; ChallengeName?: ChallengeNameType; Session?: string; ChallengeParameters?: Record<string, string> },
  username: string,
): SignInStep {
  if (result.AuthenticationResult) return { kind: 'authenticated', tokens: tokens(result.AuthenticationResult, true) };
  if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED' && result.Session) {
    return { kind: 'new-password', session: result.Session, username: result.ChallengeParameters?.USER_ID_FOR_SRP ?? username };
  }
  throw new AuthError('CHALLENGE_UNSUPPORTED', 'La cuenta requiere un paso de seguridad que este acceso no admite. Contacta a un administrador.');
}

export async function signIn(config: CognitoConfig, username: string, password: string): Promise<SignInStep> {
  const result = await call(() => client(config).send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.clientId,
    AuthParameters: { USERNAME: username, PASSWORD: password },
  })));
  return nextStep(result, username);
}

export async function completeNewPassword(
  config: CognitoConfig,
  input: { session: string; username: string; newPassword: string },
): Promise<SignInStep> {
  const result = await call(() => client(config).send(new RespondToAuthChallengeCommand({
    ClientId: config.clientId,
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    Session: input.session,
    ChallengeResponses: { USERNAME: input.username, NEW_PASSWORD: input.newPassword },
  })));
  return nextStep(result, input.username);
}

export async function refreshTokens(config: CognitoConfig, refreshToken: string): Promise<SessionTokens> {
  const result = await call(() => client(config).send(new InitiateAuthCommand({
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: config.clientId,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  })));
  return tokens(result.AuthenticationResult, false);
}

export async function revokeRefreshToken(config: CognitoConfig, refreshToken: string): Promise<void> {
  await call(() => client(config).send(new RevokeTokenCommand({ ClientId: config.clientId, Token: refreshToken })));
}

export async function signUp(
  config: CognitoConfig,
  input: { email: string; password: string; givenName: string; familyName?: string },
): Promise<{ userSub: string; confirmed: boolean; delivery?: string }> {
  const result = await call(() => client(config).send(new SignUpCommand({
    ClientId: config.clientId,
    Username: input.email,
    Password: input.password,
    UserAttributes: [
      { Name: 'email', Value: input.email },
      { Name: 'given_name', Value: input.givenName },
      ...(input.familyName ? [{ Name: 'family_name', Value: input.familyName }] : []),
    ],
  })));
  if (!result.UserSub) throw new AuthError('PROVIDER_ERROR', 'No pudimos crear la cuenta.');
  return {
    userSub: result.UserSub,
    confirmed: Boolean(result.UserConfirmed),
    delivery: result.CodeDeliveryDetails?.Destination,
  };
}

export async function confirmSignUp(config: CognitoConfig, input: { email: string; code: string }): Promise<void> {
  await call(() => client(config).send(new ConfirmSignUpCommand({
    ClientId: config.clientId,
    Username: input.email,
    ConfirmationCode: input.code,
  })));
}

export async function resendConfirmationCode(config: CognitoConfig, email: string): Promise<void> {
  await call(() => client(config).send(new ResendConfirmationCodeCommand({ ClientId: config.clientId, Username: email })));
}

export async function startPasswordReset(config: CognitoConfig, email: string): Promise<void> {
  await call(() => client(config).send(new ForgotPasswordCommand({ ClientId: config.clientId, Username: email })));
}

export async function confirmPasswordReset(
  config: CognitoConfig,
  input: { email: string; code: string; password: string },
): Promise<void> {
  await call(() => client(config).send(new ConfirmForgotPasswordCommand({
    ClientId: config.clientId,
    Username: input.email,
    ConfirmationCode: input.code,
    Password: input.password,
  })));
}

/** Verifica firma, emisor, audiencia y vencimiento del access token. */
export async function verifyAccessToken(config: CognitoConfig, accessToken: string): Promise<{ subject: string; groups: string[] }> {
  const payload = await verifierFor(config).access.verify(accessToken);
  return { subject: payload.sub, groups: groupsOf(payload as Record<string, unknown>) };
}

export async function verifyIdToken(config: CognitoConfig, idToken: string): Promise<VerifiedIdentity> {
  const payload = (await verifierFor(config).id.verify(idToken)) as Record<string, unknown> & { sub: string };
  const email = typeof payload.email === 'string' ? payload.email : '';
  const givenName = typeof payload.given_name === 'string' && payload.given_name ? payload.given_name : email.split('@')[0] ?? '';
  return {
    subject: payload.sub,
    email,
    givenName,
    familyName: typeof payload.family_name === 'string' && payload.family_name ? payload.family_name : undefined,
    groups: groupsOf(payload),
  };
}

function groupsOf(payload: Record<string, unknown>): string[] {
  const groups = payload['cognito:groups'];
  return Array.isArray(groups) ? groups.filter((group): group is string => typeof group === 'string') : [];
}
