/** Grupos del pool de staff (infra/lib/constructs/auth.ts). Módulo puro: sirve en proxy y páginas. */
export const STAFF_GROUPS = ['despega/admin', 'despega/counselor'] as const;
export type StaffGroup = (typeof STAFF_GROUPS)[number];

export const STAFF_ROLE_LABELS: Readonly<Record<StaffGroup, string>> = {
  'despega/admin': 'Administración',
  'despega/counselor': 'Orientación',
};

export function staffGroups(groups: readonly string[]): StaffGroup[] {
  return groups.filter((group): group is StaffGroup => (STAFF_GROUPS as readonly string[]).includes(group));
}

/** Solo administración puede reiniciar intentos; orientación consulta. */
export function canManageProgress(groups: readonly string[]): boolean {
  return groups.includes('despega/admin');
}
