import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { validateEnvironmentContract } from '../lib/application-environment';
import { PlatformStack } from '../lib/platform-stack';

// Mismas feature flags que el synth real (cdk.json), para que las pruebas vean la misma plantilla.
const cdkContext = (JSON.parse(readFileSync(path.join(__dirname, '..', 'cdk.json'), 'utf8')) as { context: Record<string, unknown> }).context;

function synth(stage: 'dev' | 'prd', withApps = true): Template {
  const app = new App({ context: cdkContext });
  const stack = new PlatformStack(app, `Despega-${stage}`, {
    stage,
    env: { account: '111111111111', region: 'us-east-1' },
    branchName: stage === 'dev' ? 'develop' : 'main',
    adminAmplifyAppId: withApps ? 'dadmin123' : undefined,
    webAmplifyAppId: withApps ? 'dweb123' : undefined,
    publicWebAppUrl: 'https://despega.example',
    adminAppUrl: 'https://admin.despega.example',
    adminEnvironmentVariables: { STAGE: stage, AUTH_PROVIDER: 'cognito' },
    webEnvironmentVariables: { STAGE: stage, AUTH_PROVIDER: 'cognito' },
  });
  return Template.fromStack(stack);
}

describe('PlatformStack', () => {
  it('crea las tablas por contexto con sus índices documentados', () => {
    const template = synth('dev');
    template.resourceCountIs('AWS::DynamoDB::Table', 2);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'despega_dev_core',
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [Match.objectLike({ IndexName: 'students-by-created-at-index' })],
    });
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'despega_dev_simulation',
      GlobalSecondaryIndexes: [Match.objectLike({ IndexName: 'progress-by-career-index' })],
    });
  });

  it('protege los datos en producción', () => {
    const template = synth('prd');
    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Retain',
      Properties: Match.objectLike({
        DeletionProtectionEnabled: true,
        PointInTimeRecoverySpecification: Match.objectLike({ PointInTimeRecoveryEnabled: true }),
      }),
    });
  });

  it('separa el pool de estudiantes (registro propio) del pool del staff', () => {
    const template = synth('dev');
    template.resourceCountIs('AWS::Cognito::UserPool', 2);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'despega_dev_students',
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: false },
    });
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'despega_dev_staff',
      AdminCreateUserConfig: Match.objectLike({ AllowAdminCreateUserOnly: true }),
    });
    template.resourceCountIs('AWS::Cognito::UserPoolGroup', 2);
  });

  it('da acceso mínimo a DynamoDB a los roles SSR y nunca Scan', () => {
    const template = synth('dev');
    const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'));
    assert.equal(policies.includes('dynamodb:Scan'), false);
    assert.equal(policies.includes('dynamodb:DeleteItem'), false);
    template.hasResourceProperties('AWS::IAM::Role', { RoleName: 'despega_dev_web_amplify_compute_role' });
    template.hasResourceProperties('AWS::IAM::Role', { RoleName: 'despega_dev_admin_amplify_compute_role' });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({ Action: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'] }),
        ]),
      },
    });
  });

  it('permite synth sin Apps Amplify creados todavía', () => {
    const template = synth('dev', false);
    template.resourceCountIs('AWS::IAM::Role', 0);
    template.resourceCountIs('AWS::DynamoDB::Table', 2);
  });
});

describe('contrato de variables', () => {
  it('exige las mismas keys que .env.example y rechaza secretos', () => {
    assert.deepEqual(validateEnvironmentContract({ A: '' }, { A: '1' }, 'x'), { A: '1' });
    assert.throws(() => validateEnvironmentContract({ A: '' }, {}, 'x'), /missing: A/);
    assert.throws(() => validateEnvironmentContract({}, { B: '1' }, 'x'), /not declared/);
    assert.throws(() => validateEnvironmentContract({ SESSION_SECRET: '' }, { SESSION_SECRET: '1' }, 'x'), /Sensitive/);
    assert.throws(() => validateEnvironmentContract({ AWS_X: '' }, { AWS_X: '1' }, 'x'), /AWS prefix/);
  });
});
