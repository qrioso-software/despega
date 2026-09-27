export type DataErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'MODULE_NOT_FOUND' | 'INVALID_CURSOR';

export class DataError extends Error {
  readonly code: DataErrorCode;

  constructor(code: DataErrorCode, message: string) {
    super(message);
    this.name = 'DataError';
    this.code = code;
  }
}

/** Una condición de escritura falló: otro dispositivo o pestaña avanzó el mismo progreso. */
export function isConditionalFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'ConditionalCheckFailedException') return true;
  if (error.name !== 'TransactionCanceledException') return false;
  const reasons = (error as Error & { CancellationReasons?: { Code?: string }[] }).CancellationReasons ?? [];
  return reasons.some((reason) => reason.Code === 'ConditionalCheckFailed');
}
