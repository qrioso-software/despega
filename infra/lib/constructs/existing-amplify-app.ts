import { ArnFormat, CfnOutput, Names, Stack, aws_iam as iam } from 'aws-cdk-lib';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { logicalId } from '../naming';

export interface ExistingAmplifyAppProps {
  stage: string;
  appKind: 'admin' | 'web';
  appId: string;
  branchName: string;
  serviceRole: iam.IRole;
  computeRole: iam.IRole;
  environmentVariables: Record<string, string>;
}

/**
 * Configura un App y una rama de Amplify creados fuera de CloudFormation. Nunca envía
 * campos de repositorio u OAuth y no tiene acción de borrado: el App y su conexión con
 * GitHub pertenecen a quien los creó.
 */
export class ExistingAmplifyApp extends Construct {
  constructor(scope: Construct, id: string, props: ExistingAmplifyAppProps) {
    super(scope, id);

    const appId = props.appId.trim();
    const branchName = props.branchName.trim();
    if (!appId) throw new Error(`Missing Amplify app ID for ${props.appKind}.`);
    if (!branchName) throw new Error(`Missing Amplify branch for ${props.appKind}.`);

    const stack = Stack.of(this);
    const appArn = stack.formatArn({
      service: 'amplify',
      resource: 'apps',
      resourceName: appId,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    const branchArn = `${appArn}/branches/${branchName}`;
    const passRoleCondition = {
      StringEquals: { 'iam:PassedToService': 'amplify.amazonaws.com' },
    };
    const appPolicy = AwsCustomResourcePolicy.fromStatements([
      new iam.PolicyStatement({
        actions: ['amplify:UpdateApp'],
        resources: [appArn],
      }),
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [props.serviceRole.roleArn, props.computeRole.roleArn],
        conditions: passRoleCondition,
      }),
    ]);
    const branchPolicy = AwsCustomResourcePolicy.fromStatements([
      new iam.PolicyStatement({
        actions: ['amplify:UpdateBranch'],
        resources: [branchArn],
      }),
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [props.computeRole.roleArn],
        conditions: passRoleCondition,
      }),
    ]);

    const physicalResourceSuffix = Names.uniqueId(this);
    const resourceType = `Custom::${logicalId(
      props.stage,
      props.appKind,
      'amplify-configurator',
    )}`;
    const appParameters = {
      appId,
      platform: 'WEB_COMPUTE',
      enableBranchAutoBuild: true,
      computeRoleArn: props.computeRole.roleArn,
      iamServiceRoleArn: props.serviceRole.roleArn,
    };
    const appConfigurator = new AwsCustomResource(
      this,
      logicalId(props.stage, props.appKind, 'amplify-app-configurator'),
      {
        onCreate: {
          service: 'Amplify',
          action: 'updateApp',
          parameters: appParameters,
          outputPaths: ['app.appId'],
          physicalResourceId: PhysicalResourceId.of(
            `${appId}-${props.appKind}-app-${physicalResourceSuffix}`,
          ),
        },
        onUpdate: {
          service: 'Amplify',
          action: 'updateApp',
          parameters: appParameters,
          outputPaths: ['app.appId'],
          physicalResourceId: PhysicalResourceId.of(
            `${appId}-${props.appKind}-app-${physicalResourceSuffix}`,
          ),
        },
        policy: appPolicy,
        installLatestAwsSdk: false,
        resourceType,
      },
    );

    const branchParameters = {
      appId,
      branchName,
      // Cada stage usa un App dedicado; su rama es la de producción de ese App
      // (`develop` en dev, `main` en prd).
      stage: 'PRODUCTION',
      enableAutoBuild: true,
      computeRoleArn: props.computeRole.roleArn,
      environmentVariables: omitReservedAmplifyEnvironmentVariables(
        props.environmentVariables,
      ),
    };
    const branchConfigurator = new AwsCustomResource(
      this,
      logicalId(props.stage, props.appKind, 'amplify-branch-configurator'),
      {
        onCreate: {
          service: 'Amplify',
          action: 'updateBranch',
          parameters: branchParameters,
          outputPaths: ['branch.branchName'],
          physicalResourceId: PhysicalResourceId.of(
            `${appId}-${branchName}-${props.appKind}-branch-${physicalResourceSuffix}`,
          ),
        },
        onUpdate: {
          service: 'Amplify',
          action: 'updateBranch',
          parameters: branchParameters,
          outputPaths: ['branch.branchName'],
          physicalResourceId: PhysicalResourceId.of(
            `${appId}-${branchName}-${props.appKind}-branch-${physicalResourceSuffix}`,
          ),
        },
        policy: branchPolicy,
        installLatestAwsSdk: false,
        resourceType,
      },
    );

    appConfigurator.node.addDependency(props.serviceRole);
    appConfigurator.node.addDependency(props.computeRole);
    branchConfigurator.node.findChild('Resource').node.addDependency(appConfigurator);

    new CfnOutput(this, logicalId(props.stage, props.appKind, 'amplify-app-id'), {
      value: appId,
      description: `Existing Amplify App ID for ${props.appKind}`,
    });
    new CfnOutput(this, logicalId(props.stage, props.appKind, 'amplify-branch-name'), {
      value: branchName,
      description: `Existing Amplify branch for ${props.appKind}`,
    });
  }
}

function omitReservedAmplifyEnvironmentVariables(
  environmentVariables: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(environmentVariables).filter(([key]) => !key.startsWith('AWS')),
  );
}
