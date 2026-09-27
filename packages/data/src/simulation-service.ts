import { randomUUID } from 'node:crypto';
import {
  applySceneResponse,
  createInitialState,
  findModule,
  startSession,
  type AppliedOutcome,
  type CareerModule,
  type SceneResponse,
} from '@despega/simulator';
import type { DataConfig } from './config.ts';
import { DataError, isConditionalFailure } from './errors.ts';
import {
  createProgress,
  getProgress,
  recordFromState,
  replaceProgress,
  saveProgress,
  type CareerProgressRecord,
  type DecisionEvent,
} from './progress.ts';

/**
 * Casos de uso del simulador. El servidor es la autoridad: recibe la respuesta del
 * jugador, la evalúa con el mismo motor puro y persiste el resultado. El navegador
 * nunca envía puntajes.
 */

export function moduleFor(careerId: string): CareerModule {
  const module = findModule(careerId);
  if (!module) throw new DataError('MODULE_NOT_FOUND', 'Esta carrera todavía no tiene un módulo jugable.');
  return module;
}

export async function ensureCareerProgress(
  config: DataConfig,
  input: { studentId: string; careerId: string; playerName: string; now: string },
): Promise<CareerProgressRecord> {
  const existing = await getProgress(config, input.studentId, input.careerId);
  if (existing) return existing;

  const module = moduleFor(input.careerId);
  const record = recordFromState({
    studentId: input.studentId,
    runId: randomUUID(),
    attempt: 1,
    version: 1,
    state: createInitialState(module, { playerName: input.playerName, now: input.now }),
  });
  try {
    await createProgress(config, record);
    return record;
  } catch (error) {
    if (!isConditionalFailure(error)) throw error;
    // Otra pestaña lo creó al mismo tiempo: se usa el que quedó guardado.
    return (await getProgress(config, input.studentId, input.careerId))!;
  }
}

export async function beginSession(
  config: DataConfig,
  input: { studentId: string; careerId: string; sessionIndex: number; now: string },
): Promise<CareerProgressRecord> {
  const current = await requireProgress(config, input.studentId, input.careerId);
  const module = moduleFor(input.careerId);
  const state = startSession(module, current.state, { sessionIndex: input.sessionIndex, now: input.now });
  if (state === current.state) return current;

  const next = recordFromState({ ...current, version: current.version + 1, state });
  await saveProgress(config, { record: next, expectedVersion: current.version });
  return next;
}

export async function submitSceneResponse(
  config: DataConfig,
  input: {
    studentId: string;
    careerId: string;
    runId: string;
    expectedVersion: number;
    sceneId: string;
    response: SceneResponse;
    elapsedMs: number;
    now: string;
  },
): Promise<{ record: CareerProgressRecord; outcome: AppliedOutcome }> {
  const current = await requireProgress(config, input.studentId, input.careerId);
  if (current.runId !== input.runId || current.version !== input.expectedVersion) {
    throw new DataError('CONFLICT', 'El progreso cambió en otra pestaña o dispositivo.');
  }

  const module = moduleFor(input.careerId);
  const { state, outcome } = applySceneResponse(module, current.state, {
    sceneId: input.sceneId,
    response: input.response,
    elapsedMs: input.elapsedMs,
    now: input.now,
  });
  const next = recordFromState({ ...current, version: current.version + 1, state });
  const event: DecisionEvent | undefined = outcome.detail.kind === 'continue'
    ? undefined
    : {
        runId: current.runId,
        sequence: next.version,
        studentId: current.studentId,
        careerId: current.careerId,
        sessionId: outcome.sessionId,
        sceneId: outcome.sceneId,
        response: input.response,
        outcomeId: outcome.outcomeId,
        label: outcome.label,
        timedOut: outcome.timedOut,
        elapsedMs: Math.max(0, Math.round(input.elapsedMs)),
        performanceBefore: outcome.performanceBefore,
        performanceAfter: outcome.performanceAfter,
        affinityDelta: outcome.affinityDelta,
        createdAt: input.now,
      };

  await saveProgress(config, { record: next, expectedVersion: current.version, event });
  return { record: next, outcome };
}

/**
 * Reinicio administrativo (pruebas y demostraciones). El estudiante nunca repite una
 * sesión por su cuenta; el intento anterior y sus eventos se conservan.
 */
export async function restartCareer(
  config: DataConfig,
  input: { studentId: string; careerId: string; playerName: string; now: string },
): Promise<CareerProgressRecord> {
  const current = await requireProgress(config, input.studentId, input.careerId);
  const module = moduleFor(input.careerId);
  const next = recordFromState({
    studentId: input.studentId,
    runId: randomUUID(),
    attempt: current.attempt + 1,
    previousRunIds: [current.runId, ...(current.previousRunIds ?? [])].slice(0, 20),
    version: current.version + 1,
    state: createInitialState(module, { playerName: input.playerName, now: input.now }),
  });
  await replaceProgress(config, { record: next, expectedVersion: current.version });
  return next;
}

async function requireProgress(config: DataConfig, studentId: string, careerId: string): Promise<CareerProgressRecord> {
  const record = await getProgress(config, studentId, careerId);
  if (!record) throw new DataError('NOT_FOUND', 'Todavía no has empezado esta carrera.');
  return record;
}
