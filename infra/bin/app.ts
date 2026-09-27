#!/usr/bin/env node
import * as path from 'node:path';
import { App, type Environment } from 'aws-cdk-lib';
import { loadApplicationEnvironment } from '../lib/application-environment';
import { PlatformStack } from '../lib/platform-stack';

type EnvironmentConfig = {
  account?: string;
  profile?: string;
  region?: string;
  branch?: string;
  adminAmplifyAppId?: string;
  webAmplifyAppId?: string;
};

const app = new App();
const stage = String(app.node.tryGetContext('stage') ?? 'dev').trim().toLowerCase();
if (!['dev', 'prd'].includes(stage)) {
  throw new Error(`Unsupported stage "${stage}". Use dev or prd.`);
}

const environments = app.node.tryGetContext('environments') as Record<string, EnvironmentConfig>;
const config = environments?.[stage];
if (!config) throw new Error(`Missing environment configuration for ${stage}.`);

const configuredAccount = config.account?.trim();
const credentialAccount = process.env.CDK_DEFAULT_ACCOUNT?.trim();
if (configuredAccount && credentialAccount && configuredAccount !== credentialAccount) {
  const profileHint = config.profile?.trim() ? ` Use --profile ${config.profile.trim()}.` : '';
  throw new Error(
    `AWS account mismatch for ${stage}: configured ${configuredAccount}, credentials resolve to ${credentialAccount}.${profileHint}`,
  );
}

const env: Environment = {
  account: configuredAccount || credentialAccount,
  region: config.region?.trim() || process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const branchName = requiredString(app.node.tryGetContext('branch') ?? config.branch, `branch for ${stage}`);
const environmentName = stage === 'dev' ? 'develop' : 'production';
const repositoryRoot = path.resolve(__dirname, '../..');
const adminEnvironmentVariables = loadApplicationEnvironment({ repositoryRoot, appKind: 'admin', environmentName });
const webEnvironmentVariables = loadApplicationEnvironment({ repositoryRoot, appKind: 'web', environmentName });

// Un stage desplegado nunca usa el proveedor de identidad local ni DynamoDB Local.
const deployedStageRules = { STAGE: stage, AUTH_PROVIDER: 'cognito', DYNAMODB_ENDPOINT: '' };
validateApplicationEnvironment(
  adminEnvironmentVariables,
  { AMPLIFY_MONOREPO_APP_ROOT: 'apps/admin', ...deployedStageRules },
  `apps/admin/.env.${environmentName}`,
);
validateApplicationEnvironment(
  webEnvironmentVariables,
  { AMPLIFY_MONOREPO_APP_ROOT: 'apps/web', ...deployedStageRules },
  `apps/web/.env.${environmentName}`,
);

const publicWebAppUrl = requiredHttpsUrl(webEnvironmentVariables.SITE_URL, `SITE_URL in apps/web/.env.${environmentName}`);
const adminAppUrl = requiredHttpsUrl(
  adminEnvironmentVariables.NEXT_PUBLIC_APP_URL,
  `NEXT_PUBLIC_APP_URL in apps/admin/.env.${environmentName}`,
);
if (webEnvironmentVariables.NEXT_PUBLIC_APP_URL !== publicWebAppUrl) {
  throw new Error(`NEXT_PUBLIC_APP_URL must match SITE_URL in apps/web/.env.${environmentName}.`);
}
if (adminEnvironmentVariables.NEXT_PUBLIC_WEB_APP_URL !== publicWebAppUrl) {
  throw new Error(`NEXT_PUBLIC_WEB_APP_URL must match web SITE_URL in apps/admin/.env.${environmentName}.`);
}

new PlatformStack(app, `Despega-${stage}`, {
  stage,
  env,
  terminationProtection: stage === 'prd',
  branchName,
  adminAmplifyAppId: optionalAmplifyAppId(
    app.node.tryGetContext('adminAmplifyAppId') ?? process.env.ADMIN_AMPLIFY_APP_ID ?? config.adminAmplifyAppId,
    'admin',
    stage,
  ),
  webAmplifyAppId: optionalAmplifyAppId(
    app.node.tryGetContext('webAmplifyAppId') ?? process.env.WEB_AMPLIFY_APP_ID ?? config.webAmplifyAppId,
    'web',
    stage,
  ),
  publicWebAppUrl,
  adminAppUrl,
  adminEnvironmentVariables,
  webEnvironmentVariables,
});

function requiredString(value: unknown, label: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`Missing ${label}.`);
}

function requiredHttpsUrl(value: unknown, label: string): string {
  const raw = requiredString(value, label).replace(/\/$/, '');
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid ${label}: ${raw}.`);
  }
  if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${label} must be an HTTPS origin without path, query or fragment.`);
  }
  return raw;
}

function optionalAmplifyAppId(value: unknown, appKind: 'admin' | 'web', stageName: string): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const appId = value.trim().toLowerCase();
  if (!/^[a-z0-9]+$/.test(appId)) {
    throw new Error(`Invalid ${appKind} Amplify app ID for ${stageName}.`);
  }
  return appId;
}

function validateApplicationEnvironment(
  environment: Record<string, string>,
  expected: Record<string, string>,
  label: string,
): void {
  for (const [key, value] of Object.entries(expected)) {
    if (environment[key] !== value) {
      throw new Error(`${key} must be ${JSON.stringify(value)} in ${label}.`);
    }
  }
}
