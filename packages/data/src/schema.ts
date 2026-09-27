/**
 * Esquema DynamoDB: fuente única para CDK (`infra`), la creación de tablas locales y
 * los repositorios. Cada índice existe por un patrón de acceso documentado en
 * docs/architecture/data-model.md. No se usa Scan.
 */

export type IndexProjection = { readonly type: 'ALL' } | { readonly type: 'INCLUDE'; readonly attributes: readonly string[] };

export type IndexSpec = {
  readonly name: string;
  readonly partitionKey: string;
  readonly sortKey: string;
  readonly projection: IndexProjection;
};

export type TableSpec = {
  /** Sufijo del nombre físico: `despega_<stage>_<suffix>`. */
  readonly suffix: string;
  readonly partitionKey: 'pk';
  readonly sortKey: 'sk';
  readonly indexes: readonly IndexSpec[];
};

export const INDEXES = {
  studentsByCreatedAt: 'students-by-created-at-index',
  progressByCareer: 'progress-by-career-index',
} as const;

export const TABLES = {
  /** Identidades y perfiles: estudiantes (y a futuro colegios/cohortes). */
  core: {
    suffix: 'core',
    partitionKey: 'pk',
    sortKey: 'sk',
    indexes: [
      {
        // Backoffice: listar estudiantes del más reciente al más antiguo.
        name: INDEXES.studentsByCreatedAt,
        partitionKey: 'studentsByCreatedPk',
        sortKey: 'studentsByCreatedSk',
        projection: { type: 'ALL' },
      },
    ],
  },
  /** Progreso por estudiante y carrera, y bitácora inmutable de decisiones. */
  simulation: {
    suffix: 'simulation',
    partitionKey: 'pk',
    sortKey: 'sk',
    indexes: [
      {
        // Backoffice: progreso de todos los estudiantes en una carrera, reciente primero.
        name: INDEXES.progressByCareer,
        partitionKey: 'progressByCareerPk',
        sortKey: 'progressByCareerSk',
        projection: {
          type: 'INCLUDE',
          attributes: [
            'studentId',
            'careerId',
            'moduleId',
            'moduleVersion',
            'runId',
            'attempt',
            'status',
            'performance',
            'affinity',
            'completedSessions',
            'currentSessionNumber',
            'startedAt',
            'updatedAt',
            'completedAt',
          ],
        },
      },
    ],
  },
} as const satisfies Record<string, TableSpec>;

export type TableKey = keyof typeof TABLES;

export function physicalTableName(stage: string, table: TableKey): string {
  return `despega_${stage}_${TABLES[table].suffix}`.replaceAll('-', '_');
}
