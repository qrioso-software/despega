import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

const appRoot = process.argv[2];
if (!['apps/admin', 'apps/web'].includes(appRoot)) {
  throw new Error('Usage: node infra/scripts/write-amplify-env.mjs apps/<admin|web>');
}

const examplePath = resolve(appRoot, '.env.example');
const outputPath = resolve(appRoot, '.env.production');
const contract = parseEnv(readFileSync(examplePath, 'utf8'));
const keys = Object.keys(contract).sort();
const sensitiveKeyPattern =
  /(^|_)(PASSWORD|PASS|SECRET|TOKEN|API_KEY|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET|CERTIFICATE)(_|$)/i;

for (const key of keys) {
  if (key.startsWith('AWS') || sensitiveKeyPattern.test(key)) {
    throw new Error(`Variable ${key} is not allowed in an Amplify runtime environment.`);
  }
}

// Amplify solo construye stages desplegados: nunca con identidad local ni DynamoDB Local.
if (process.env.AUTH_PROVIDER !== 'cognito') {
  throw new Error('AUTH_PROVIDER must be "cognito" in an Amplify build.');
}
if (process.env.DYNAMODB_ENDPOINT) {
  throw new Error('DYNAMODB_ENDPOINT must be empty in an Amplify build.');
}

const contents = keys
  .map((key) => {
    const value = process.env[key] ?? '';
    if (value.includes('\0')) throw new Error(`Variable ${key} contains an invalid null byte.`);
    return `${key}=${JSON.stringify(value)}`;
  })
  .join('\n');

writeFileSync(outputPath, `${contents}\n`, { encoding: 'utf8', mode: 0o600 });
console.log(`Prepared ${keys.length} declared variables for ${appRoot}.`);
