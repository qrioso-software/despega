import {
  Annotations,
  ArnFormat,
  CfnOutput,
  RemovalPolicy,
  Stack,
  aws_iam as iam,
  aws_logs as logs,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ExistingAmplifyApp } from './existing-amplify-app';
import { logicalId, resourceName } from '../naming';

export interface AmplifyHostingProps {
  stage: string;
  appKind: 'admin' | 'web';
  appId?: string;
  branchName: string;
  environmentVariables: Record<string, string>;
  /**
   * Permisos del rol de cómputo SSR. Sin API Gateway, las Server Actions y los Server
   * Components de Next.js leen y escriben DynamoDB con este rol: mínimo privilegio y
   * nunca `dynamodb:Scan`.
   */
  computePolicyStatements: iam.PolicyStatement[];
}

export class AmplifyHosting extends Construct {
  readonly computeRole?: iam.Role;

  constructor(scope: Construct, id: string, props: AmplifyHostingProps) {
    super(scope, id);

    const appId = props.appId?.trim();
    if (!appId) {
      Annotations.of(this).addWarning(
        `Amplify ${props.appKind} is pending: set ${props.appKind}AmplifyAppId in infra/cdk.json before deploy.`,
      );
      return;
    }

    const stack = Stack.of(this);
    const appArn = stack.formatArn({
      service: 'amplify',
      resource: 'apps',
      resourceName: appId,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    const branchArn = `${appArn}/branches/${props.branchName.trim()}`;
    const serviceRole = new iam.Role(this, logicalId(props.stage, props.appKind, 'amplify-service-role'), {
      roleName: resourceName(props.stage, props.appKind, 'amplify-service-role'),
      description: `Amplify Hosting service role for the existing ${props.appKind} App`,
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com', {
        conditions: {
          // Amplify entrega el ARN completo de la rama al asumir el rol.
          ArnLike: { 'aws:SourceArn': branchArn },
          StringEquals: { 'aws:SourceAccount': stack.account },
        },
      }),
    });
    serviceRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));

    const computeRole = new iam.Role(this, logicalId(props.stage, props.appKind, 'amplify-compute-role'), {
      roleName: resourceName(props.stage, props.appKind, 'amplify-compute-role'),
      description: `Amplify SSR compute role for the existing ${props.appKind} App`,
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
    });
    for (const statement of props.computePolicyStatements) computeRole.addToPolicy(statement);
    this.computeRole = computeRole;

    if (props.stage === 'prd') {
      serviceRole.applyRemovalPolicy(RemovalPolicy.RETAIN);
      computeRole.applyRemovalPolicy(RemovalPolicy.RETAIN);
    }

    const runtimeLogRetention = new logs.LogRetention(this, logicalId(props.stage, props.appKind, 'amplify-runtime-logs'), {
      logGroupName: `/aws/amplify/${appId}`,
      retention: props.stage === 'prd' ? logs.RetentionDays.THREE_MONTHS : logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const existingApp = new ExistingAmplifyApp(this, logicalId(props.stage, props.appKind, 'existing-amplify-app'), {
      stage: props.stage,
      appKind: props.appKind,
      appId,
      branchName: props.branchName,
      serviceRole,
      computeRole,
      environmentVariables: props.environmentVariables,
    });
    existingApp.node.addDependency(runtimeLogRetention);

    new CfnOutput(this, logicalId(props.stage, props.appKind, 'amplify-service-role-name'), { value: serviceRole.roleName });
    new CfnOutput(this, logicalId(props.stage, props.appKind, 'amplify-compute-role-name'), { value: computeRole.roleName });
  }
}
