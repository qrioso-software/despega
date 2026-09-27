import { BatchGetCommand, GetCommand, PutCommand, QueryCommand, TransactWriteCommand, type BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import type { AffinityDelta, AffinityVector, SceneResponse, SimulationState } from '@despega/simulator';
import { documentClient } from './client.ts';
import type { DataConfig } from './config.ts';
import { DataError, isConditionalFailure } from './errors.ts';
import { assertIdentifier, decodeCursor, encodeCursor, keys } from './keys.ts';
import { INDEXES } from './schema.ts';

/**
 * Progreso de un estudiante en una carrera. Desempeño y perfil de afinidad se guardan
 * por carrera desde el inicio (requisito del documento funcional), así un futuro
 * comparador entre carreras no requiere rediseñar datos.
 */
export type CareerProgressRecord = {
  readonly studentId: string;
  readonly careerId: string;
  readonly moduleId: string;
  readonly moduleVersion: number;
  /** Intento actual. Un reinicio desde el backoffice abre un intento nuevo. */
  readonly runId: string;
  readonly attempt: number;
  /** Intentos anteriores; sus eventos siguen guardados bajo `RUN#<runId>`. */
  readonly previousRunIds?: readonly string[];
  /** Concurrencia optimista: cada escritura exige la versión leída. */
  readonly version: number;
  readonly status: SimulationState['status'];
  readonly performance: number;
  readonly affinity: AffinityVector;
  readonly completedSessions: number;
  readonly currentSessionNumber: number | null;
  readonly state: SimulationState;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
};

/** Resumen proyectado en el índice por carrera (sin el estado completo). */
export type CareerProgressSummary = Omit<CareerProgressRecord, 'state' | 'version' | 'previousRunIds'>;

/** Registro inmutable de cada decisión, para el backoffice y análisis futuros. */
export type DecisionEvent = {
  readonly runId: string;
  readonly sequence: number;
  readonly studentId: string;
  readonly careerId: string;
  readonly sessionId: string;
  readonly sceneId: string;
  readonly response: SceneResponse;
  readonly outcomeId: string;
  readonly label: string;
  readonly timedOut: boolean;
  readonly elapsedMs: number;
  readonly performanceBefore: number;
  readonly performanceAfter: number;
  readonly affinityDelta: AffinityDelta;
  readonly createdAt: string;
};

export function recordFromState(input: {
  studentId: string;
  runId: string;
  attempt: number;
  previousRunIds?: readonly string[];
  version: number;
  state: SimulationState;
}): CareerProgressRecord {
  const { state } = input;
  return {
    studentId: input.studentId,
    careerId: state.careerId,
    moduleId: state.moduleId,
    moduleVersion: state.moduleVersion,
    runId: input.runId,
    attempt: input.attempt,
    previousRunIds: input.previousRunIds && input.previousRunIds.length > 0 ? [...input.previousRunIds] : undefined,
    version: input.version,
    status: state.status,
    performance: state.performance,
    affinity: { ...state.affinity },
    completedSessions: state.sessions.filter((session) => session.status === 'completed').length,
    currentSessionNumber: state.status === 'completed' ? null : state.sessionIndex + 1,
    state,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
    completedAt: state.completedAt,
  };
}

export async function getProgress(config: DataConfig, studentId: string, careerId: string): Promise<CareerProgressRecord | null> {
  assertIdentifier(studentId, 'Estudiante');
  assertIdentifier(careerId, 'Carrera');
  const result = await documentClient(config).send(new GetCommand({
    TableName: config.tables.simulation,
    Key: keys.progress(studentId, careerId),
    ConsistentRead: true,
  }));
  return result.Item ? toRecord(result.Item) : null;
}

const SUMMARY_FIELDS = [
  'studentId',
  'careerId',
  'moduleId',
  'moduleVersion',
  'runId',
  'attempt',
  '#status',
  'performance',
  'affinity',
  'completedSessions',
  'currentSessionNumber',
  'startedAt',
  'updatedAt',
  'completedAt',
];

/** Resumen del progreso en una carrera para varios estudiantes (BatchGetItem, sin el estado completo). */
export async function getCareerProgressMany(
  config: DataConfig,
  studentIds: readonly string[],
  careerId: string,
): Promise<Map<string, CareerProgressSummary>> {
  assertIdentifier(careerId, 'Carrera');
  const unique = [...new Set(studentIds)];
  unique.forEach((id) => assertIdentifier(id, 'Estudiante'));
  const summaries = new Map<string, CareerProgressSummary>();
  for (let index = 0; index < unique.length; index += 100) {
    let keysToRead: Record<string, unknown>[] | undefined = unique.slice(index, index + 100).map((id) => keys.progress(id, careerId));
    for (let attempt = 0; keysToRead && keysToRead.length > 0 && attempt < 5; attempt += 1) {
      const result: BatchGetCommandOutput = await documentClient(config).send(new BatchGetCommand({
        RequestItems: {
          [config.tables.simulation]: {
            Keys: keysToRead,
            ProjectionExpression: SUMMARY_FIELDS.join(', '),
            ExpressionAttributeNames: { '#status': 'status' },
          },
        },
      }));
      for (const item of result.Responses?.[config.tables.simulation] ?? []) {
        const summary = toSummary(item);
        summaries.set(summary.studentId, summary);
      }
      keysToRead = result.UnprocessedKeys?.[config.tables.simulation]?.Keys;
    }
  }
  return summaries;
}

export async function listProgressForStudent(config: DataConfig, studentId: string): Promise<CareerProgressRecord[]> {
  assertIdentifier(studentId, 'Estudiante');
  const items: CareerProgressRecord[] = [];
  let cursor: Record<string, unknown> | undefined;
  do {
    const result = await documentClient(config).send(new QueryCommand({
      TableName: config.tables.simulation,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': keys.student(studentId).pk, ':prefix': keys.progressPrefix },
      ExclusiveStartKey: cursor,
    }));
    items.push(...(result.Items ?? []).map(toRecord));
    cursor = result.LastEvaluatedKey;
  } while (cursor);
  return items;
}

export async function createProgress(config: DataConfig, record: CareerProgressRecord): Promise<void> {
  await documentClient(config).send(new PutCommand({
    TableName: config.tables.simulation,
    Item: progressItem(record),
    ConditionExpression: 'attribute_not_exists(pk)',
  }));
}

/**
 * Guarda el nuevo estado y, si hay decisión, su evento, en una sola transacción. Falla
 * con CONFLICT si otra pestaña avanzó el progreso desde la lectura.
 */
export async function saveProgress(
  config: DataConfig,
  input: { record: CareerProgressRecord; expectedVersion: number; event?: DecisionEvent },
): Promise<void> {
  const put = {
    Put: {
      TableName: config.tables.simulation,
      Item: progressItem(input.record),
      ConditionExpression: '#version = :expected AND runId = :runId',
      ExpressionAttributeNames: { '#version': 'version' },
      ExpressionAttributeValues: { ':expected': input.expectedVersion, ':runId': input.record.runId },
    },
  };
  try {
    if (!input.event) {
      await documentClient(config).send(new PutCommand(put.Put));
      return;
    }
    await documentClient(config).send(new TransactWriteCommand({
      TransactItems: [
        put,
        {
          Put: {
            TableName: config.tables.simulation,
            Item: { ...keys.event(input.event.runId, input.event.sequence), entity: 'DecisionEvent', ...input.event },
            ConditionExpression: 'attribute_not_exists(pk)',
          },
        },
      ],
    }));
  } catch (error) {
    if (isConditionalFailure(error)) {
      throw new DataError('CONFLICT', 'El progreso cambió en otra pestaña o dispositivo.');
    }
    throw error;
  }
}

/** Reemplaza el intento actual por uno nuevo, condicionado a la versión leída. */
export async function replaceProgress(
  config: DataConfig,
  input: { record: CareerProgressRecord; expectedVersion: number },
): Promise<void> {
  try {
    await documentClient(config).send(new PutCommand({
      TableName: config.tables.simulation,
      Item: progressItem(input.record),
      ConditionExpression: '#version = :expected',
      ExpressionAttributeNames: { '#version': 'version' },
      ExpressionAttributeValues: { ':expected': input.expectedVersion },
    }));
  } catch (error) {
    if (isConditionalFailure(error)) throw new DataError('CONFLICT', 'El progreso cambió mientras se reiniciaba.');
    throw error;
  }
}

export async function listRunEvents(config: DataConfig, runId: string): Promise<DecisionEvent[]> {
  assertIdentifier(runId, 'Intento');
  const events: DecisionEvent[] = [];
  let cursor: Record<string, unknown> | undefined;
  do {
    const result = await documentClient(config).send(new QueryCommand({
      TableName: config.tables.simulation,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': keys.event(runId, 0).pk },
      ExclusiveStartKey: cursor,
    }));
    events.push(...(result.Items ?? []).map(toEvent));
    cursor = result.LastEvaluatedKey;
  } while (cursor);
  return events;
}

export async function listProgressByCareer(
  config: DataConfig,
  careerId: string,
  options: { limit?: number; cursor?: string } = {},
): Promise<{ items: CareerProgressSummary[]; nextCursor?: string }> {
  assertIdentifier(careerId, 'Carrera');
  const result = await documentClient(config).send(new QueryCommand({
    TableName: config.tables.simulation,
    IndexName: INDEXES.progressByCareer,
    KeyConditionExpression: 'progressByCareerPk = :pk',
    ExpressionAttributeValues: { ':pk': `CAREER#${careerId}` },
    ScanIndexForward: false,
    Limit: Math.min(Math.max(options.limit ?? 100, 1), 500),
    ExclusiveStartKey: decodeCursor(options.cursor),
  }));
  return {
    items: (result.Items ?? []).map(toSummary),
    nextCursor: encodeCursor(result.LastEvaluatedKey),
  };
}

function progressItem(record: CareerProgressRecord): Record<string, unknown> {
  return {
    ...keys.progress(record.studentId, record.careerId),
    ...keys.progressByCareer(record.careerId, record.updatedAt, record.studentId),
    entity: 'CareerProgress',
    ...record,
  };
}

function toRecord(item: Record<string, unknown>): CareerProgressRecord {
  const summary = toSummary(item);
  return {
    ...summary,
    previousRunIds: Array.isArray(item.previousRunIds) ? item.previousRunIds.map(String) : undefined,
    version: Number(item.version),
    state: item.state as SimulationState,
  };
}

function toSummary(item: Record<string, unknown>): CareerProgressSummary {
  return {
    studentId: String(item.studentId),
    careerId: String(item.careerId),
    moduleId: String(item.moduleId),
    moduleVersion: Number(item.moduleVersion),
    runId: String(item.runId),
    attempt: Number(item.attempt),
    status: item.status === 'completed' ? 'completed' : 'in_progress',
    performance: Number(item.performance),
    affinity: item.affinity as AffinityVector,
    completedSessions: Number(item.completedSessions ?? 0),
    currentSessionNumber: item.currentSessionNumber === null || item.currentSessionNumber === undefined
      ? null
      : Number(item.currentSessionNumber),
    startedAt: String(item.startedAt),
    updatedAt: String(item.updatedAt),
    completedAt: typeof item.completedAt === 'string' ? item.completedAt : undefined,
  };
}

function toEvent(item: Record<string, unknown>): DecisionEvent {
  const { pk: _pk, sk: _sk, entity: _entity, ...event } = item;
  return event as DecisionEvent;
}
