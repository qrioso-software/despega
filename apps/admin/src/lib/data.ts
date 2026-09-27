import 'server-only';

import { dataConfigFromEnv, type DataConfig } from '@despega/data';

let cached: DataConfig | undefined;

export function dataConfig(): DataConfig {
  cached ??= dataConfigFromEnv();
  return cached;
}
