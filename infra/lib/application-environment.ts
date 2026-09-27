import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { parseEnv } from 'node:util';

export type ApplicationKind = 'admin' | 'web';
export type EnvironmentName = 'develop' | 'production';

export interface LoadApplicationEnvironmentProps {
  repositoryRoot: string;
  appKind: ApplicationKind;
  environmentName: EnvironmentName;
}

export const SENSITIVE_KEY_PATTERN =
  /(^|_)(PASSWORD|PASS|SECRET|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET|CERTIFICATE)(_|$)/i;

/**
 * Carga las variables no secretas de Amplify desde el archivo del stage. El
 * `.env.example` es el contrato: el archivo del stage debe tener exactamente las mismas
 * keys.
 */
export function loadApplicationEnvironment(props: LoadApplicationEnvironmentProps): Record<string, string> {
  const appRoot = path.join(props.repositoryRoot, 'apps', props.appKind);
  const example = parseEnvironmentFile(path.join(appRoot, '.env.example'));
  const environment = parseEnvironmentFile(path.join(appRoot, `.env.${props.environmentName}`));
  return validateEnvironmentContract(example, environment, `apps/${props.appKind}/.env.${props.environmentName}`);
}

export function validateEnvironmentContract(
  example: Record<string, string>,
  environment: Record<string, string>,
  label: string,
): Record<string, string> {
  const expectedKeys = Object.keys(example).sort();
  const actualKeys = Object.keys(environment).sort();
  const missingKeys = expectedKeys.filter((key) => !(key in environment));
  const undocumentedKeys = actualKeys.filter((key) => !(key in example));

  if (missingKeys.length > 0 || undocumentedKeys.length > 0) {
    const details = [
      missingKeys.length > 0 ? `missing: ${missingKeys.join(', ')}` : '',
      undocumentedKeys.length > 0 ? `not declared in .env.example: ${undocumentedKeys.join(', ')}` : '',
    ].filter(Boolean).join('; ');
    throw new Error(`Environment contract mismatch for ${label} (${details}).`);
  }

  for (const key of actualKeys) {
    if (key.startsWith('AWS')) {
      throw new Error(`Amplify reserves the AWS prefix; remove ${key} from ${label}.`);
    }
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      throw new Error(`Sensitive variable ${key} cannot be sent to Amplify/CloudFormation; use Secrets Manager or SSM.`);
    }
  }

  return Object.fromEntries(expectedKeys.map((key) => [key, environment[key] ?? '']));
}

function parseEnvironmentFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required environment file: ${filePath}.`);
  }
  try {
    const parsed = parseEnv(readFileSync(filePath, 'utf8'));
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, value ?? '']));
  } catch {
    throw new Error(`Invalid environment file: ${filePath}.`);
  }
}
