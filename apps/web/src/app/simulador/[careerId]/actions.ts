'use server';

import { DataError, beginSession, getProgress, moduleFor, submitSceneResponse } from '@despega/data';
import { SimulationError, getPublicScene } from '@despega/simulator';
import { z } from 'zod';
import { currentStudent } from '@/lib/auth';
import { dataConfig } from '@/lib/data';
import { toProgressView } from '@/lib/simulation';
import type { ActionFailure, ActionFailureCode, BeginResult, SubmitResult } from '@/lib/simulation-types';

const identifier = z.string().regex(/^[A-Za-z0-9_.:-]{1,64}$/);

const responseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('continue') }),
  z.object({ kind: z.literal('dialogue'), optionId: identifier }),
  z.object({ kind: z.literal('timeout') }),
  z.object({ kind: z.literal('classification'), assignments: z.record(identifier, identifier), timedOut: z.boolean() }),
  z.object({ kind: z.literal('message-builder'), blockIds: z.array(identifier).max(10) }),
  z.object({ kind: z.literal('sequence'), candidateId: identifier, slot: z.number().int().min(0).max(50) }),
  z.object({ kind: z.literal('prioritization'), selectedTaskIds: z.array(identifier).max(10) }),
  z.object({ kind: z.literal('matching'), matches: z.record(identifier, identifier), timedOut: z.boolean() }),
  z.object({ kind: z.literal('live-decision'), optionId: identifier }),
]);

const submitSchema = z.object({
  careerId: identifier,
  runId: z.uuid(),
  version: z.number().int().min(1),
  sceneId: z.string().regex(/^[0-9A-Za-z.-]{1,16}$/),
  elapsedMs: z.number().finite().min(0).max(3_600_000),
  response: responseSchema,
});

const beginSchema = z.object({ careerId: identifier, sessionNumber: z.number().int().min(1).max(20) });
const reloadSchema = z.object({ careerId: identifier });

/** Evalúa la respuesta del jugador en el servidor y devuelve la consecuencia y la siguiente escena. */
export async function submitSceneAction(input: unknown): Promise<SubmitResult> {
  const student = await currentStudent();
  if (!student) return fail('UNAUTHENTICATED', 'Tu sesión venció. Vuelve a entrar para continuar donde ibas.');
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return fail('INVALID', 'La respuesta no tiene un formato válido.');

  const { careerId, runId, version, sceneId, elapsedMs, response } = parsed.data;
  try {
    const { record, outcome } = await submitSceneResponse(dataConfig(), {
      studentId: student.studentId,
      careerId,
      runId,
      expectedVersion: version,
      sceneId,
      response,
      elapsedMs,
      now: new Date().toISOString(),
    });
    const careerModule = moduleFor(careerId);
    return { ok: true, outcome, scene: getPublicScene(careerModule, record.state), progress: toProgressView(careerModule, record) };
  } catch (error) {
    return failure(error);
  }
}

/** Abre la siguiente sesión disponible (la anterior ya terminó; no depende del calendario). */
export async function beginSessionAction(input: unknown): Promise<BeginResult> {
  const student = await currentStudent();
  if (!student) return fail('UNAUTHENTICATED', 'Tu sesión venció. Vuelve a entrar para continuar donde ibas.');
  const parsed = beginSchema.safeParse(input);
  if (!parsed.success) return fail('INVALID', 'La sesión solicitada no es válida.');

  try {
    const record = await beginSession(dataConfig(), {
      studentId: student.studentId,
      careerId: parsed.data.careerId,
      sessionIndex: parsed.data.sessionNumber - 1,
      now: new Date().toISOString(),
    });
    const careerModule = moduleFor(parsed.data.careerId);
    return { ok: true, scene: getPublicScene(careerModule, record.state), progress: toProgressView(careerModule, record) };
  } catch (error) {
    return failure(error);
  }
}

/** Relee el progreso guardado (p. ej. si otra pestaña avanzó la misma carrera). */
export async function reloadProgressAction(input: unknown): Promise<BeginResult> {
  const student = await currentStudent();
  if (!student) return fail('UNAUTHENTICATED', 'Tu sesión venció. Vuelve a entrar para continuar donde ibas.');
  const parsed = reloadSchema.safeParse(input);
  if (!parsed.success) return fail('INVALID', 'La carrera solicitada no es válida.');

  try {
    const record = await getProgress(dataConfig(), student.studentId, parsed.data.careerId);
    if (!record) return fail('NOT_FOUND', 'Todavía no has empezado esta carrera.');
    const careerModule = moduleFor(parsed.data.careerId);
    return { ok: true, scene: getPublicScene(careerModule, record.state), progress: toProgressView(careerModule, record) };
  } catch (error) {
    return failure(error);
  }
}

function fail(code: ActionFailureCode, message: string): ActionFailure {
  return { ok: false, code, message };
}

function failure(error: unknown): ActionFailure {
  if (error instanceof DataError) {
    if (error.code === 'CONFLICT') return fail('CONFLICT', 'Tu progreso avanzó en otra pestaña. Lo recargamos para seguir desde ahí.');
    return fail('NOT_FOUND', error.message);
  }
  if (error instanceof SimulationError) return fail(error.code, error.message);
  console.error('No se pudo guardar el progreso del simulador.', error);
  return fail('UNAVAILABLE', 'No pudimos guardar tu decisión. Revisa tu conexión e inténtalo de nuevo.');
}
