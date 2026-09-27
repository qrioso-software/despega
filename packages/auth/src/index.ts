export { AuthConfigurationError, authConfigFromEnv, type AuthConfig } from './config.ts';
export { AuthError, toAuthError, type AuthErrorCode } from './errors.ts';
export {
  completeNewPassword,
  confirmPasswordReset,
  confirmSignUp,
  refreshTokens,
  resendConfirmationCode,
  revokeRefreshToken,
  signIn,
  signUp,
  startPasswordReset,
  verifyAccessToken,
  verifyIdToken,
  type SessionTokens,
  type SignInStep,
  type VerifiedIdentity,
} from './cognito.ts';
export {
  LOCAL_SESSION_SECONDS,
  isLoopbackHost,
  localSubject,
  signLocalSession,
  verifyLocalSession,
  type LocalAudience,
  type LocalSession,
} from './local.ts';
export {
  REFRESH_WINDOW_SECONDS,
  cookieOptions,
  decodeJwtPayload,
  safeNextPath,
  sessionCookieNames,
  tokenExpiresSoon,
  type CookieOptions,
  type SessionCookieNames,
} from './session.ts';
export { passwordProblem, type PasswordPolicy, STUDENT_PASSWORD_POLICY, STAFF_PASSWORD_POLICY } from './password.ts';
