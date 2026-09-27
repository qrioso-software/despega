import { CfnOutput, RemovalPolicy, Stack, Tags, aws_dynamodb as dynamodb, aws_iam as iam, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AmplifyHosting } from './constructs/amplify-hosting';
import { Auth } from './constructs/auth';
import { Database } from './constructs/database';
import { logicalId } from './naming';
import { addRuntimeIamValidation } from './runtime-iam-validation';

export interface PlatformStackProps extends StackProps {
  stage: string;
  branchName: string;
  adminAmplifyAppId?: string;
  webAmplifyAppId?: string;
  publicWebAppUrl: string;
  adminAppUrl: string;
  adminEnvironmentVariables: Record<string, string>;
  webEnvironmentVariables: Record<string, string>;
}

/**
 * Plataforma DESPEGA por stage: DynamoDB, Cognito y la configuración de los Apps
 * Amplify existentes. No hay API Gateway ni Lambdas de dominio: la lógica corre en el
 * SSR y las Server Actions de Next.js, con el rol de cómputo de cada App.
 */
export class PlatformStack extends Stack {
  readonly database: Database;
  readonly auth: Auth;
  readonly web: AmplifyHosting;
  readonly admin: AmplifyHosting;

  constructor(scope: Construct, id: string, props: PlatformStackProps) {
    super(scope, id, props);

    const production = props.stage === 'prd';
    const removalPolicy = production ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    Tags.of(this).add('Project', 'despega');
    Tags.of(this).add('Stage', props.stage);
    Tags.of(this).add('ManagedBy', 'aws-cdk');
    // Estudiantes de 15 a 18 años: datos personales de menores.
    Tags.of(this).add('DataClassification', 'student-personal-data');

    this.database = new Database(this, logicalId(props.stage, 'database'), { stage: props.stage, removalPolicy, production });
    this.auth = new Auth(this, logicalId(props.stage, 'auth'), { stage: props.stage, removalPolicy, production });

    const { core, simulation } = this.database;
    this.web = new AmplifyHosting(this, logicalId(props.stage, 'web-amplify-hosting'), {
      stage: props.stage,
      appKind: 'web',
      appId: props.webAmplifyAppId,
      branchName: props.branchName,
      environmentVariables: {
        ...props.webEnvironmentVariables,
        DATA_REGION: this.region,
        DYNAMODB_TABLE_CORE: core.tableName,
        DYNAMODB_TABLE_SIMULATION: simulation.tableName,
        COGNITO_USER_POOL_ID: this.auth.studentPool.userPoolId,
        COGNITO_CLIENT_ID: this.auth.webClient.userPoolClientId,
      },
      computePolicyStatements: [
        // Perfil del estudiante: lectura, alta en el primer ingreso y edición.
        tableStatement(core, ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem']),
        // Progreso y eventos: lectura consistente, escrituras transaccionales condicionadas.
        tableStatement(simulation, ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query']),
      ],
    });
    this.admin = new AmplifyHosting(this, logicalId(props.stage, 'admin-amplify-hosting'), {
      stage: props.stage,
      appKind: 'admin',
      appId: props.adminAmplifyAppId,
      branchName: props.branchName,
      environmentVariables: {
        ...props.adminEnvironmentVariables,
        DATA_REGION: this.region,
        DYNAMODB_TABLE_CORE: core.tableName,
        DYNAMODB_TABLE_SIMULATION: simulation.tableName,
        COGNITO_USER_POOL_ID: this.auth.staffPool.userPoolId,
        COGNITO_CLIENT_ID: this.auth.adminClient.userPoolClientId,
      },
      computePolicyStatements: [
        tableStatement(core, ['dynamodb:GetItem', 'dynamodb:BatchGetItem', 'dynamodb:Query'], { indexes: true }),
        tableStatement(simulation, ['dynamodb:GetItem', 'dynamodb:BatchGetItem', 'dynamodb:Query'], { indexes: true }),
        // Reinicio administrativo de un intento (nuevo runId; los eventos se conservan).
        tableStatement(simulation, ['dynamodb:PutItem']),
      ],
    });

    new CfnOutput(this, logicalId(props.stage, 'public-web-url'), {
      value: props.publicWebAppUrl,
      description: 'Desired public URL associated to the existing web Amplify App',
    });
    new CfnOutput(this, logicalId(props.stage, 'admin-url'), {
      value: props.adminAppUrl,
      description: 'Desired admin URL associated to the existing admin Amplify App',
    });

    addRuntimeIamValidation(this);
  }
}

function tableStatement(table: dynamodb.ITable, actions: string[], options: { indexes?: boolean } = {}): iam.PolicyStatement {
  return new iam.PolicyStatement({
    actions,
    resources: options.indexes ? [table.tableArn, `${table.tableArn}/index/*`] : [table.tableArn],
  });
}
