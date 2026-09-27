export type DataConfig = {
  readonly region: string;
  /** Solo en local: DynamoDB Local. En AWS queda vacío y se usa el endpoint regional. */
  readonly endpoint?: string;
  readonly tables: { readonly core: string; readonly simulation: string };
};

type Environment = Record<string, string | undefined>;

const TABLE_NAME = /^[A-Za-z0-9_.-]{3,255}$/;
const REGION = /^[a-z]{2}(?:-gov)?-[a-z]+-\d$/;

export class DataConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataConfigurationError';
  }
}

/**
 * Lee la configuración de datos del entorno de la aplicación. Las credenciales nunca
 * vienen de aquí: en Amplify las aporta el rol de cómputo SSR y en local DynamoDB
 * Local acepta cualquier credencial.
 */
export function dataConfigFromEnv(env: Environment = process.env): DataConfig {
  const region = env.DATA_REGION?.trim() ?? '';
  const endpoint = env.DYNAMODB_ENDPOINT?.trim() || undefined;
  const core = env.DYNAMODB_TABLE_CORE?.trim() ?? '';
  const simulation = env.DYNAMODB_TABLE_SIMULATION?.trim() ?? '';

  if (!REGION.test(region)) throw new DataConfigurationError('DATA_REGION no es una región AWS válida.');
  if (!TABLE_NAME.test(core) || !TABLE_NAME.test(simulation)) {
    throw new DataConfigurationError('Faltan los nombres de tablas DynamoDB (DYNAMODB_TABLE_CORE, DYNAMODB_TABLE_SIMULATION).');
  }
  if (endpoint) {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new DataConfigurationError('DYNAMODB_ENDPOINT no es una URL válida.');
    }
    if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
      throw new DataConfigurationError('DYNAMODB_ENDPOINT solo se permite hacia DynamoDB Local.');
    }
  }

  return { region, endpoint, tables: { core, simulation } };
}
