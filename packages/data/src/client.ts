import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { DataConfig } from './config.ts';

const clients = new Map<string, DynamoDBDocumentClient>();

/** Un cliente por región/endpoint, reutilizado entre peticiones del mismo proceso. */
export function documentClient(config: DataConfig): DynamoDBDocumentClient {
  const key = `${config.region}|${config.endpoint ?? ''}`;
  const cached = clients.get(key);
  if (cached) return cached;

  const client = new DynamoDBClient({
    region: config.region,
    endpoint: config.endpoint,
    maxAttempts: 3,
    // DynamoDB Local no valida firmas; en AWS se usa la cadena de credenciales por defecto.
    credentials: config.endpoint ? { accessKeyId: 'local', secretAccessKey: 'local' } : undefined,
  });
  const document = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: false },
    unmarshallOptions: { wrapNumbers: false },
  });
  clients.set(key, document);
  return document;
}
