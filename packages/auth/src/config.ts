export type AuthConfig =
  | {
      readonly provider: 'cognito';
      readonly stage: string;
      readonly region: string;
      readonly userPoolId: string;
      readonly clientId: string;
    }
  | {
      /** Proveedor de identidad local: solo con STAGE=local y peticiones desde loopback. */
      readonly provider: 'local';
      readonly stage: 'local';
    };

type Environment = Record<string, string | undefined>;

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

export function authConfigFromEnv(env: Environment = process.env): AuthConfig {
  const provider = env.AUTH_PROVIDER?.trim();
  const stage = env.STAGE?.trim() ?? '';

  if (provider === 'local') {
    if (stage !== 'local') {
      throw new AuthConfigurationError('El proveedor de identidad local solo existe con STAGE=local.');
    }
    return { provider: 'local', stage: 'local' };
  }

  if (provider !== 'cognito') {
    throw new AuthConfigurationError('AUTH_PROVIDER debe ser "cognito" o "local".');
  }
  const userPoolId = env.COGNITO_USER_POOL_ID?.trim() ?? '';
  const clientId = env.COGNITO_CLIENT_ID?.trim() ?? '';
  const region = userPoolId.split('_', 1)[0] ?? '';
  if (!userPoolId || !clientId || !/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(region)) {
    throw new AuthConfigurationError('La autenticación Cognito no está configurada para este ambiente.');
  }
  return { provider: 'cognito', stage, region, userPoolId, clientId };
}
