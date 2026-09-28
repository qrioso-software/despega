import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { DataConfig } from './config.ts';

const clients = new Map<string, DynamoDBDocumentClient>();

export function documentClient(config: DataConfig): DynamoDBDocumentClient {
  const key = `${config.region}|${config.profile ?? ''}`;
  const cached = clients.get(key);
  if (cached) return cached;

  const client = new DynamoDBClient({
    region: config.region,
    profile: config.profile,
    maxAttempts: 3,
  });
  const document = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: false },
    unmarshallOptions: { wrapNumbers: false },
  });
  clients.set(key, document);
  return document;
}
