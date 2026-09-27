import 'server-only';

import { dataConfigFromEnv, type DataConfig } from '@despega/data';

let cached: DataConfig | undefined;

/** Configuración DynamoDB del proceso. Falla explícitamente si el entorno está incompleto. */
export function dataConfig(): DataConfig {
  cached ??= dataConfigFromEnv();
  return cached;
}
