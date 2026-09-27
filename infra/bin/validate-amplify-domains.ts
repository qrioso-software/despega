#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { parseEnv } from 'node:util';

type StageName = 'dev' | 'prd';

type EnvironmentConfig = {
  account?: string;
  profile?: string;
  region?: string;
  branch?: string;
  adminAmplifyAppId?: string;
  webAmplifyAppId?: string;
};

type DomainAssociation = {
  domainName?: string;
  domainStatus?: string;
  subDomains?: Array<{
    subDomainSetting?: {
      branchName?: string;
      prefix?: string;
    };
  }>;
};

const stage = process.argv[2] as StageName | undefined;
if (stage !== 'dev' && stage !== 'prd') {
  throw new Error('Usage: validate-amplify-domains.ts <dev|prd>');
}

const infraRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(infraRoot, '..');
const cdkConfig = JSON.parse(readFileSync(path.join(infraRoot, 'cdk.json'), 'utf8')) as {
  context?: { environments?: Record<string, EnvironmentConfig> };
};
const config = cdkConfig.context?.environments?.[stage];
if (!config) throw new Error(`Missing environment configuration for ${stage}.`);

const profile = required(config.profile, `AWS profile for ${stage}`);
const region = required(config.region, `AWS region for ${stage}`);
const account = required(config.account, `AWS account for ${stage}`);
const branch = required(config.branch, `Amplify branch for ${stage}`);
const environmentName = stage === 'dev' ? 'develop' : 'production';

const identity = awsJson<{ Account?: string }>([
  'sts', 'get-caller-identity',
  '--profile', profile,
  '--region', region,
  '--output', 'json',
]);
if (identity.Account !== account) {
  throw new Error(
    `AWS account mismatch for ${stage}: expected ${account}, received ${identity.Account ?? 'unknown'}.`,
  );
}

const applications = [
  {
    kind: 'admin',
    appId: required(config.adminAmplifyAppId, `admin Amplify App ID for ${stage}`),
    envFile: path.join(repositoryRoot, 'apps/admin', `.env.${environmentName}`),
    envKey: 'NEXT_PUBLIC_APP_URL',
  },
  {
    kind: 'web',
    appId: required(config.webAmplifyAppId, `web Amplify App ID for ${stage}`),
    envFile: path.join(repositoryRoot, 'apps/web', `.env.${environmentName}`),
    envKey: 'SITE_URL',
  },
] as const;

for (const application of applications) {
  const environment = parseEnv(readFileSync(application.envFile, 'utf8'));
  const expectedOrigin = httpsOrigin(
    environment[application.envKey],
    `${application.envKey} in ${path.relative(repositoryRoot, application.envFile)}`,
  );
  const response = awsJson<{ domainAssociations?: DomainAssociation[] }>([
    'amplify', 'list-domain-associations',
    '--app-id', application.appId,
    '--profile', profile,
    '--region', region,
    '--output', 'json',
  ]);
  const availableOrigins = associatedOrigins(response.domainAssociations ?? [], branch);
  if (!availableOrigins.includes(expectedOrigin)) {
    const observed = availableOrigins.length > 0 ? availableOrigins.join(', ') : 'none';
    throw new Error(
      `${application.kind} ${expectedOrigin} is not an AVAILABLE Amplify domain for branch ${branch}; observed: ${observed}.`,
    );
  }
  console.log(`Verified ${application.kind} domain ${expectedOrigin} on ${branch}.`);
}

function associatedOrigins(associations: DomainAssociation[], branchName: string): string[] {
  const origins = new Set<string>();
  for (const association of associations) {
    const domainName = association.domainName?.trim().toLowerCase();
    if (!domainName || association.domainStatus !== 'AVAILABLE') continue;
    for (const subDomain of association.subDomains ?? []) {
      const setting = subDomain.subDomainSetting;
      if (setting?.branchName !== branchName) continue;
      const prefix = setting.prefix?.trim().toLowerCase();
      origins.add(`https://${prefix ? `${prefix}.` : ''}${domainName}`);
    }
  }
  return [...origins].sort();
}

function httpsOrigin(value: string | undefined, label: string): string {
  const raw = required(value, label);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid ${label}: ${raw}.`);
  }
  if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${label} must be an HTTPS origin without path, query or fragment.`);
  }
  return parsed.origin;
}

function required(value: string | undefined, label: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing ${label}.`);
  return normalized;
}

function awsJson<T>(args: string[]): T {
  const awsCommand = existsSync('/opt/homebrew/bin/aws') ? '/opt/homebrew/bin/aws' : 'aws';
  const result = spawnSync(awsCommand, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || 'AWS CLI failed.';
    throw new Error(detail);
  }
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    throw new Error('AWS CLI returned invalid JSON.');
  }
}
