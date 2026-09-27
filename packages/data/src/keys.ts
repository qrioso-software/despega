import { DataError } from './errors.ts';

/** Claves de ítems. Los identificadores nunca contienen `#`, así que no ambiguan. */
export const keys = {
  student: (studentId: string) => ({ pk: `STUDENT#${studentId}`, sk: 'PROFILE' }),
  progress: (studentId: string, careerId: string) => ({ pk: `STUDENT#${studentId}`, sk: `CAREER#${careerId}` }),
  progressPrefix: 'CAREER#',
  event: (runId: string, sequence: number) => ({ pk: `RUN#${runId}`, sk: `EVENT#${String(sequence).padStart(6, '0')}` }),
  studentsByCreated: (createdAt: string, studentId: string) => ({
    studentsByCreatedPk: 'STUDENTS',
    studentsByCreatedSk: `${createdAt}#${studentId}`,
  }),
  progressByCareer: (careerId: string, updatedAt: string, studentId: string) => ({
    progressByCareerPk: `CAREER#${careerId}`,
    progressByCareerSk: `${updatedAt}#${studentId}`,
  }),
};

const IDENTIFIER = /^[A-Za-z0-9_.:@+-]{1,128}$/;

export function assertIdentifier(value: string, label: string): void {
  if (!IDENTIFIER.test(value)) throw new DataError('NOT_FOUND', `${label} inválido.`);
}

export function encodeCursor(key: Record<string, unknown> | undefined): string | undefined {
  return key ? Buffer.from(JSON.stringify(key), 'utf8').toString('base64url') : undefined;
}

export function decodeCursor(cursor: string | undefined): Record<string, unknown> | undefined {
  if (!cursor) return undefined;
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('cursor');
    return value as Record<string, unknown>;
  } catch {
    throw new DataError('INVALID_CURSOR', 'El cursor de paginación no es válido.');
  }
}
