import { execFileSync } from 'node:child_process';
import { constants, copyFileSync, existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { parseEnv } from 'node:util';
import { dataConfigFromEnv } from '@despega/data';

const repositoryRoot = path.resolve(__dirname, '../..');
const account = '779926948601';
const profile = 'qrioso-dev';
const region = 'us-east-1';

function awsJson<Result>(args: string[]): Result {
  return JSON.parse(execFileSync('aws', [
    ...args, '--profile', profile, '--region', region, '--output', 'json', '--no-cli-pager',
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}

try {
  const tables = new Set<string>();
  for (const app of ['web', 'admin']) {
    const directory = path.join(repositoryRoot, 'apps', app);
    const localFile = path.join(directory, '.env.local');
    if (!existsSync(localFile)) copyFileSync(path.join(directory, '.env.example'), localFile, constants.COPYFILE_EXCL);
    const environment = parseEnv(readFileSync(localFile, 'utf8'));
    if (environment.STAGE !== 'local') throw new Error(`apps/${app}/.env.local debe usar STAGE=local.`);
    const config = dataConfigFromEnv(environment);
    tables.add(config.tables.core);
    tables.add(config.tables.simulation);
  }

  const identity = awsJson<{ Account: string }>(['sts', 'get-caller-identity']);
  if (identity.Account !== account) throw new Error(`El perfil ${profile} debe apuntar a la cuenta ${account}.`);
  for (const tableName of tables) {
    const { Table: table } = awsJson<{ Table?: { TableStatus: string; TableArn: string } }>(['dynamodb', 'describe-table', '--table-name', tableName]);
    if (table?.TableStatus !== 'ACTIVE' || table.TableArn !== `arn:aws:dynamodb:${region}:${account}:table/${tableName}`) {
      throw new Error(`La tabla ${tableName} no está disponible en la cuenta DEV esperada.`);
    }
  }
  console.log(`Local usa DynamoDB de ${profile} (${account}, ${region}). Las escrituras afectan datos compartidos de DEV.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudo verificar DynamoDB de DEV.');
  console.error('Comprueba las variables locales y renueva SSO con: aws sso login --profile qrioso-dev');
  process.exitCode = 1;
}
