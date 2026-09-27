import { CfnOutput, RemovalPolicy, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TABLES, physicalTableName, type TableKey, type TableSpec } from '@despega/data/schema';
import { logicalId } from '../naming';

export interface DatabaseProps {
  stage: string;
  removalPolicy: RemovalPolicy;
  production: boolean;
}

/**
 * Tablas por contexto acotado, definidas desde `@despega/data/schema` para que CDK,
 * DynamoDB Local y los repositorios compartan el mismo contrato.
 */
export class Database extends Construct {
  readonly core: dynamodb.Table;
  readonly simulation: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);
    this.core = this.createTable(props, 'core', TABLES.core);
    this.simulation = this.createTable(props, 'simulation', TABLES.simulation);
  }

  get all(): dynamodb.Table[] {
    return [this.core, this.simulation];
  }

  private createTable(props: DatabaseProps, key: TableKey, spec: TableSpec): dynamodb.Table {
    const table = new dynamodb.Table(this, logicalId(props.stage, spec.suffix, 'table'), {
      tableName: physicalTableName(props.stage, key),
      partitionKey: { name: spec.partitionKey, type: dynamodb.AttributeType.STRING },
      sortKey: { name: spec.sortKey, type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.production,
        recoveryPeriodInDays: props.production ? 35 : undefined,
      },
      deletionProtection: props.production,
      removalPolicy: props.removalPolicy,
    });

    for (const index of spec.indexes) {
      table.addGlobalSecondaryIndex({
        indexName: index.name,
        partitionKey: { name: index.partitionKey, type: dynamodb.AttributeType.STRING },
        sortKey: { name: index.sortKey, type: dynamodb.AttributeType.STRING },
        projectionType: index.projection.type === 'ALL' ? dynamodb.ProjectionType.ALL : dynamodb.ProjectionType.INCLUDE,
        nonKeyAttributes: index.projection.type === 'INCLUDE' ? [...index.projection.attributes] : undefined,
      });
    }

    new CfnOutput(this, logicalId(props.stage, spec.suffix, 'table-name'), { value: table.tableName });
    return table;
  }
}
