/** Espejo de las políticas de Cognito definidas en infra/lib/constructs/auth.ts. */
export type PasswordPolicy = {
  readonly minLength: number;
  readonly lowercase: boolean;
  readonly uppercase: boolean;
  readonly digits: boolean;
};

export const STUDENT_PASSWORD_POLICY: PasswordPolicy = { minLength: 8, lowercase: true, uppercase: false, digits: true };
export const STAFF_PASSWORD_POLICY: PasswordPolicy = { minLength: 12, lowercase: true, uppercase: true, digits: true };

/** Devuelve el primer problema de la contraseña o `null` si cumple la política. */
export function passwordProblem(password: string, policy: PasswordPolicy): string | null {
  if (password.length < policy.minLength) return `Usa al menos ${policy.minLength} caracteres.`;
  if (password.length > 256) return 'La contraseña es demasiado larga.';
  if (policy.lowercase && !/[a-z]/.test(password)) return 'Incluye al menos una letra minúscula.';
  if (policy.uppercase && !/[A-Z]/.test(password)) return 'Incluye al menos una letra mayúscula.';
  if (policy.digits && !/\d/.test(password)) return 'Incluye al menos un número.';
  return null;
}
