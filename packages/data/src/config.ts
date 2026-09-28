import { physicalTableName } from './schema.ts';

export type DataConfig = {
  readonly region: string;
  readonly profile?: string;
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
    throw new DataConfigurationError('DYNAMODB_ENDPOINT debe estar vacío: se usa DynamoDB de AWS, también en local.');
  }
  if (env.STAGE === 'local') {
    if (region !== 'us-east-1' || core !== physicalTableName('dev', 'core') || simulation !== physicalTableName('dev', 'simulation')) {
      throw new DataConfigurationError('El entorno local solo puede usar las tablas de DESPEGA dev en us-east-1.');
    }
    return { region, profile: 'qrioso-dev', tables: { core, simulation } };
  }

  return { region, tables: { core, simulation } };
}
