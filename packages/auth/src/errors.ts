import { AuthConfigurationError } from './config.ts';

export type AuthErrorCode =
  | 'AUTH_NOT_CONFIGURED'
  | 'INVALID_CREDENTIALS'
  | 'ACCESS_DENIED'
  | 'USER_NOT_CONFIRMED'
  | 'USER_EXISTS'
  | 'PASSWORD_RESET_REQUIRED'
  | 'INVALID_PASSWORD'
  | 'INVALID_CODE'
  | 'EXPIRED_CODE'
  | 'RATE_LIMITED'
  | 'CODE_DELIVERY_FAILED'
  | 'CHALLENGE_UNSUPPORTED'
  | 'SESSION_EXPIRED'
  | 'LOCAL_ONLY'
  | 'PROVIDER_ERROR';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Traduce errores de Cognito a mensajes claros sin revelar si una cuenta existe. */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  if (error instanceof AuthConfigurationError) return new AuthError('AUTH_NOT_CONFIGURED', error.message);

  const name = error instanceof Error ? error.name : '';
  switch (name) {
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return new AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    case 'UserNotConfirmedException':
      return new AuthError('USER_NOT_CONFIRMED', 'Tu cuenta todavía no está confirmada. Revisa el código que te enviamos por correo.');
    case 'UsernameExistsException':
    case 'AliasExistsException':
      return new AuthError('USER_EXISTS', 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.');
    case 'PasswordResetRequiredException':
      return new AuthError('PASSWORD_RESET_REQUIRED', 'Tu cuenta necesita una contraseña nueva. Recupérala para continuar.');
    case 'InvalidPasswordException':
    case 'PasswordHistoryPolicyViolationException':
      return new AuthError('INVALID_PASSWORD', 'La contraseña no cumple los requisitos de seguridad.');
    case 'CodeMismatchException':
      return new AuthError('INVALID_CODE', 'El código no es válido.');
    case 'ExpiredCodeException':
      return new AuthError('EXPIRED_CODE', 'El código venció. Pide uno nuevo.');
    case 'TooManyRequestsException':
    case 'LimitExceededException':
    case 'TooManyFailedAttemptsException':
      return new AuthError('RATE_LIMITED', 'Demasiados intentos. Espera un momento antes de volver a intentar.');
    case 'CodeDeliveryFailureException':
      return new AuthError('CODE_DELIVERY_FAILED', 'No pudimos enviar el código. Intenta de nuevo en unos minutos.');
    case 'InvalidParameterException':
      return new AuthError('PROVIDER_ERROR', 'Revisa los datos ingresados e intenta otra vez.');
    default:
      return new AuthError('PROVIDER_ERROR', 'El servicio de autenticación no respondió. Intenta otra vez.');
  }
}
