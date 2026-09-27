#!/usr/bin/env node
/**
 * Crea en DynamoDB Local las mismas tablas e índices que CDK despliega en AWS, a partir
 * del esquema compartido `@despega/data/schema`. Es idempotente: una tabla existente se
 * conserva con sus datos.
 */
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  type AttributeDefinition,
  type GlobalSecondaryIndex,
} from '@aws-sdk/client-dynamodb';
import { TABLES, physicalTableName, type TableKey } from '@despega/data/schema';

const endpoint = process.env.DYNAMODB_ENDPOINT?.trim() || 'http://localhost:8000';
const hostname = new URL(endpoint).hostname;
if (!['localhost', '127.0.0.1'].includes(hostname)) {
  throw new Error(`Este script solo crea tablas en DynamoDB Local; recibió ${endpoint}.`);
}

const client = new DynamoDBClient({
  endpoint,
  region: process.env.DATA_REGION?.trim() || 'us-east-1',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

async function main(): Promise<void> {
  for (const key of Object.keys(TABLES) as TableKey[]) {
    const spec = TABLES[key];
    const tableName = physicalTableName('local', key);
    if (await exists(tableName)) {
      console.log(`✔ ${tableName} ya existe`);
      continue;
    }

    const attributes = new Map<string, AttributeDefinition>([
      [spec.partitionKey, { AttributeName: spec.partitionKey, AttributeType: 'S' }],
      [spec.sortKey, { AttributeName: spec.sortKey, AttributeType: 'S' }],
    ]);
    const indexes: GlobalSecondaryIndex[] = spec.indexes.map((index) => {
      attributes.set(index.partitionKey, { AttributeName: index.partitionKey, AttributeType: 'S' });
      attributes.set(index.sortKey, { AttributeName: index.sortKey, AttributeType: 'S' });
      return {
        IndexName: index.name,
        KeySchema: [
          { AttributeName: index.partitionKey, KeyType: 'HASH' },
          { AttributeName: index.sortKey, KeyType: 'RANGE' },
        ],
        Projection: index.projection.type === 'ALL'
          ? { ProjectionType: 'ALL' }
          : { ProjectionType: 'INCLUDE', NonKeyAttributes: [...index.projection.attributes] },
      };
    });

    await client.send(new CreateTableCommand({
      TableName: tableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [...attributes.values()],
      KeySchema: [
        { AttributeName: spec.partitionKey, KeyType: 'HASH' },
        { AttributeName: spec.sortKey, KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: indexes.length > 0 ? indexes : undefined,
    }));
    console.log(`✚ ${tableName} creada con ${indexes.length} índice(s)`);
  }
}

async function exists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) return false;
    throw error;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`No se pudieron preparar las tablas locales en ${endpoint}: ${message}`);
  console.error('¿Está corriendo DynamoDB Local? Ejecuta `pnpm local:up`.');
  process.exitCode = 1;
});
