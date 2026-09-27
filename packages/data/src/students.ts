import { BatchGetCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand, type BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { documentClient } from './client.ts';
import type { DataConfig } from './config.ts';
import { isConditionalFailure } from './errors.ts';
import { assertIdentifier, decodeCursor, encodeCursor, keys } from './keys.ts';
import { INDEXES } from './schema.ts';

export type AuthProvider = 'cognito' | 'local';

export type StudentProfile = {
  readonly studentId: string;
  readonly email: string;
  readonly givenName: string;
  readonly familyName?: string;
  /** Curso o grado declarado por el estudiante. */
  readonly grade?: string;
  readonly school?: string;
  readonly authProvider: AuthProvider;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type StudentIdentity = {
  readonly studentId: string;
  readonly email: string;
  readonly givenName: string;
  readonly familyName?: string;
  readonly authProvider: AuthProvider;
};

const PROFILE_FIELDS = ['studentId', 'email', 'givenName', 'familyName', 'grade', 'school', 'authProvider', 'createdAt', 'updatedAt'] as const;

export async function getStudent(config: DataConfig, studentId: string): Promise<StudentProfile | null> {
  assertIdentifier(studentId, 'Estudiante');
  const result = await documentClient(config).send(new GetCommand({
    TableName: config.tables.core,
    Key: keys.student(studentId),
  }));
  return result.Item ? toProfile(result.Item) : null;
}

/**
 * Crea el perfil si no existe (primer ingreso o registro). Si ya existe, lo conserva:
 * el perfil del backoffice no se sobrescribe con datos del token en cada login.
 */
export async function ensureStudent(
  config: DataConfig,
  identity: StudentIdentity,
  extra: { grade?: string; school?: string; now: string },
): Promise<StudentProfile> {
  const existing = await getStudent(config, identity.studentId);
  if (existing) return existing;

  const profile: StudentProfile = {
    studentId: identity.studentId,
    email: identity.email.trim().toLowerCase(),
    givenName: identity.givenName.trim(),
    familyName: identity.familyName?.trim() || undefined,
    grade: extra.grade?.trim() || undefined,
    school: extra.school?.trim() || undefined,
    authProvider: identity.authProvider,
    createdAt: extra.now,
    updatedAt: extra.now,
  };
  try {
    await documentClient(config).send(new PutCommand({
      TableName: config.tables.core,
      Item: {
        ...keys.student(profile.studentId),
        ...keys.studentsByCreated(profile.createdAt, profile.studentId),
        entity: 'StudentProfile',
        ...profile,
      },
      ConditionExpression: 'attribute_not_exists(pk)',
    }));
    return profile;
  } catch (error) {
    if (!isConditionalFailure(error)) throw error;
    return (await getStudent(config, identity.studentId))!;
  }
}

export async function updateStudentProfile(
  config: DataConfig,
  studentId: string,
  fields: { givenName: string; familyName?: string; grade?: string; school?: string; now: string },
): Promise<void> {
  assertIdentifier(studentId, 'Estudiante');
  await documentClient(config).send(new UpdateCommand({
    TableName: config.tables.core,
    Key: keys.student(studentId),
    ConditionExpression: 'attribute_exists(pk)',
    UpdateExpression: 'SET givenName = :givenName, familyName = :familyName, grade = :grade, school = :school, updatedAt = :now',
    ExpressionAttributeValues: {
      ':givenName': fields.givenName.trim(),
      ':familyName': fields.familyName?.trim() ?? '',
      ':grade': fields.grade?.trim() ?? '',
      ':school': fields.school?.trim() ?? '',
      ':now': fields.now,
    },
  }));
}

export async function listStudents(
  config: DataConfig,
  options: { limit?: number; cursor?: string } = {},
): Promise<{ items: StudentProfile[]; nextCursor?: string }> {
  const result = await documentClient(config).send(new QueryCommand({
    TableName: config.tables.core,
    IndexName: INDEXES.studentsByCreatedAt,
    KeyConditionExpression: 'studentsByCreatedPk = :pk',
    ExpressionAttributeValues: { ':pk': 'STUDENTS' },
    ScanIndexForward: false,
    Limit: Math.min(Math.max(options.limit ?? 50, 1), 200),
    ExclusiveStartKey: decodeCursor(options.cursor),
  }));
  return { items: (result.Items ?? []).map(toProfile), nextCursor: encodeCursor(result.LastEvaluatedKey) };
}

/** Cuenta estudiantes paginando el índice; suficiente para la escala del piloto. */
export async function countStudents(config: DataConfig, ceiling = 10_000): Promise<number> {
  let total = 0;
  let cursor: Record<string, unknown> | undefined;
  do {
    const result = await documentClient(config).send(new QueryCommand({
      TableName: config.tables.core,
      IndexName: INDEXES.studentsByCreatedAt,
      KeyConditionExpression: 'studentsByCreatedPk = :pk',
      ExpressionAttributeValues: { ':pk': 'STUDENTS' },
      Select: 'COUNT',
      ExclusiveStartKey: cursor,
    }));
    total += result.Count ?? 0;
    cursor = result.LastEvaluatedKey;
  } while (cursor && total < ceiling);
  return total;
}

export async function getStudents(config: DataConfig, studentIds: readonly string[]): Promise<Map<string, StudentProfile>> {
  const unique = [...new Set(studentIds)];
  unique.forEach((id) => assertIdentifier(id, 'Estudiante'));
  const profiles = new Map<string, StudentProfile>();
  for (let index = 0; index < unique.length; index += 100) {
    let request: Record<string, { Keys: Record<string, string>[] }> | undefined = {
      [config.tables.core]: { Keys: unique.slice(index, index + 100).map((id) => keys.student(id)) },
    };
    for (let attempt = 0; request && attempt < 5; attempt += 1) {
      const result: BatchGetCommandOutput = await documentClient(config).send(new BatchGetCommand({ RequestItems: request }));
      for (const item of result.Responses?.[config.tables.core] ?? []) {
        const profile = toProfile(item);
        profiles.set(profile.studentId, profile);
      }
      const pending: Record<string, unknown>[] | undefined = result.UnprocessedKeys?.[config.tables.core]?.Keys;
      request = pending && pending.length > 0
        ? { [config.tables.core]: { Keys: pending as Record<string, string>[] } }
        : undefined;
    }
  }
  return profiles;
}

function toProfile(item: Record<string, unknown>): StudentProfile {
  const profile = Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, item[field] === '' ? undefined : item[field]]),
  ) as StudentProfile;
  return { ...profile, authProvider: profile.authProvider === 'local' ? 'local' : 'cognito' };
}
