/**
 * Modelo de contenido y de estado del simulador.
 *
 * Un módulo de carrera es data declarativa: sesiones, escenas, interacciones y
 * resultados. El motor (`engine.ts`) no conoce la historia de ningún módulo; solo
 * interpreta estas estructuras. Así los 14 módulos previstos reutilizan la misma
 * mecánica y cambian únicamente su escenario profesional.
 */

export const AFFINITY_AXES = ['analytical', 'communication', 'detail', 'pressure', 'structure'] as const;

export type AffinityAxis = (typeof AFFINITY_AXES)[number];
export type AffinityVector = Record<AffinityAxis, number>;
export type AffinityDelta = Partial<AffinityVector>;

export type FlagValue = string | number | boolean;
export type Flags = Record<string, FlagValue>;

export type Mood = 'neutral' | 'happy' | 'concerned' | 'serious' | 'sad' | 'defensive' | 'excited';

/** Condición evaluada contra el estado acumulado (memoria entre escenas y sesiones). */
export type Condition =
  | { readonly flag: string; readonly equals: FlagValue }
  | { readonly flag: string; readonly oneOf: readonly FlagValue[] }
  | { readonly performanceAtLeast: number }
  | { readonly all: readonly Condition[] }
  | { readonly any: readonly Condition[] }
  | { readonly not: Condition };

export type TextVariant = { readonly when: Condition; readonly text: string };

/**
 * Texto con variantes según el estado. `{nombre}` se reemplaza por el nombre del
 * estudiante, que es el protagonista de la historia.
 */
export type Text = string | { readonly variants: readonly TextVariant[]; readonly fallback: string };

/** `speaker` es el id de un personaje del módulo, `narrator` o `system`. */
export type Line = {
  readonly speaker: string;
  readonly text: Text;
  readonly mood?: Mood;
  readonly when?: Condition;
};

/** Consecuencia de una decisión: puntos, afinidad, memoria y reacción narrativa. */
export type Outcome = {
  readonly id: string;
  /** Resumen legible para el resumen de sesión y el backoffice. */
  readonly label: string;
  readonly performance?: number;
  readonly affinity?: AffinityDelta;
  readonly flags?: Flags;
  readonly reactions?: readonly Line[];
  readonly narration?: Text;
};

export type ScreenKind =
  | 'notification'
  | 'video-call'
  | 'chat'
  | 'inbox'
  | 'task-board'
  | 'dashboard'
  | 'cutscene'
  | 'summary'
  | 'timeline';

export type HudConfig = {
  /** Contador de quejas de usuarios en vivo. */
  readonly complaints?: boolean;
  /** Contador ambiental de la ventana de lanzamiento. */
  readonly launchWindow?: boolean;
};

export type NoneInteraction = {
  readonly kind: 'none';
  readonly continueLabel?: string;
  /** Corte a negro antes de avanzar (cliffhanger). */
  readonly cutToBlack?: boolean;
  /** Memoria que se registra al avanzar, sin puntaje. */
  readonly outcome?: Outcome;
};

export type DialogueOption = { readonly id: string; readonly label: string; readonly outcome: Outcome };

export type DialogueInteraction = {
  readonly kind: 'dialogue';
  readonly prompt?: Text;
  /** Decisión con tiempo límite. Requiere `timeoutOutcome`. */
  readonly timeLimitSeconds?: number;
  /** Medidor de riesgo que sube mientras el jugador decide. */
  readonly riskMeter?: boolean;
  readonly hint?: { readonly when: Condition; readonly text: string };
  readonly options: readonly DialogueOption[];
  readonly timeoutOutcome?: Outcome;
};

export type ClassificationCategory = { readonly id: string; readonly label: string; readonly emoji?: string };

export type ClassificationItem = {
  readonly id: string;
  readonly title: string;
  readonly from?: string;
  readonly body: string;
  readonly correctCategoryId: string;
};

export type ClassificationInteraction = {
  readonly kind: 'classification';
  readonly prompt: Text;
  readonly timeLimitSeconds: number;
  readonly categories: readonly ClassificationCategory[];
  readonly items: readonly ClassificationItem[];
  /** Se aplica el primer tramo cuyo mínimo de aciertos se cumpla (orden descendente). */
  readonly tiers: readonly { readonly minCorrect: number; readonly outcome: Outcome }[];
};

export type MessageBlock = { readonly id: string; readonly text: string; readonly tags: readonly string[] };

export type BlockRule =
  | { readonly kind: 'empty' }
  /** Todos los bloques elegidos tienen alguna de estas etiquetas. */
  | { readonly kind: 'only'; readonly tags: readonly string[] }
  /** La selección incluye todas las etiquetas `all` y ninguna de `none`. */
  | { readonly kind: 'includes'; readonly all?: readonly string[]; readonly none?: readonly string[] }
  | { readonly kind: 'always' };

export type MessageBuilderInteraction = {
  readonly kind: 'message-builder';
  readonly prompt: Text;
  readonly channel: 'email' | 'chat';
  readonly recipient: string;
  readonly minBlocks: number;
  readonly maxBlocks: number;
  readonly blocks: readonly MessageBlock[];
  /** Permite no enviar nada (p. ej. "No decir nada"). */
  readonly emptyOption?: { readonly label: string };
  /** Primera regla que coincide gana; la última debe ser `always`. */
  readonly rules: readonly { readonly when: BlockRule; readonly outcome: Outcome }[];
};

export type SequenceStep = { readonly id: string; readonly text: string };

export type SequenceInteraction = {
  readonly kind: 'sequence';
  readonly prompt: Text;
  /** Flujo existente, en orden. */
  readonly steps: readonly SequenceStep[];
  /** Pasos que el jugador puede insertar. */
  readonly candidates: readonly SequenceStep[];
  /** `slot` es la posición de inserción: 0 antes del primer paso, `steps.length` al final. */
  readonly answer: { readonly candidateId: string; readonly slot: number };
  readonly outcomes: { readonly correct: Outcome; readonly incorrect: Outcome };
};

export type PrioritizationTask = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly label?: string;
};

export type PrioritizationInteraction = {
  readonly kind: 'prioritization';
  readonly prompt: Text;
  readonly slots: number;
  readonly tasks: readonly PrioritizationTask[];
  /** Flag donde se registra la tarea descartada para sesiones posteriores. */
  readonly discardedFlag: string;
  readonly outcome: Outcome;
};

export type MatchingInteraction = {
  readonly kind: 'matching';
  readonly prompt: Text;
  readonly timeLimitSeconds: number;
  readonly problems: readonly SequenceStep[];
  /** En un orden distinto al de los problemas; sus ids no revelan la pareja. */
  readonly solutions: readonly SequenceStep[];
  /** problemId -> solutionId */
  readonly answer: Readonly<Record<string, string>>;
  /** Efecto por cada acierto (puntaje proporcional). */
  readonly perMatch: { readonly performance?: number; readonly affinity?: AffinityDelta };
  /** Reacción según aciertos; primer tramo que se cumpla (orden descendente). */
  readonly results: readonly { readonly minCorrect: number; readonly outcome: Outcome }[];
};

export type DashboardResult = { readonly positivePct: number; readonly headline: string };

export type LiveDecisionOption = {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  /** Primer resultado cuya condición se cumpla; el último no lleva condición. */
  readonly results: readonly { readonly when?: Condition; readonly outcome: Outcome; readonly dashboard: DashboardResult }[];
};

export type LiveDecisionInteraction = {
  readonly kind: 'live-decision';
  readonly prompt: Text;
  /** Estado del dashboard antes de decidir; el último no lleva condición. */
  readonly baseline: readonly { readonly when?: Condition; readonly positivePct: number; readonly note: string }[];
  readonly options: readonly LiveDecisionOption[];
};

export type SummaryInteraction = {
  readonly kind: 'summary';
  readonly scope: 'session' | 'module';
  readonly heading: string;
  /** Mensaje de cierre; primer texto cuya condición se cumpla, el último sin condición. */
  readonly closing?: readonly { readonly when?: Condition; readonly speaker: string; readonly text: string }[];
  readonly continueLabel?: string;
};

export type TimelineStage = {
  readonly id: string;
  readonly period: string;
  readonly title: string;
  readonly narration: string;
};

export type CareerBranch = {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly narration: string;
  /** Ejes de afinidad que, en promedio, alinean al estudiante con este camino. */
  readonly axes: readonly AffinityAxis[];
};

export type TimelineInteraction = {
  readonly kind: 'timeline';
  readonly stages: readonly TimelineStage[];
  readonly fork: { readonly title: string; readonly narration: string };
  readonly branches: readonly CareerBranch[];
  readonly alignmentNote: string;
  readonly continueLabel?: string;
};

export type Interaction =
  | NoneInteraction
  | DialogueInteraction
  | ClassificationInteraction
  | MessageBuilderInteraction
  | SequenceInteraction
  | PrioritizationInteraction
  | MatchingInteraction
  | LiveDecisionInteraction
  | SummaryInteraction
  | TimelineInteraction;

export type InteractionKind = Interaction['kind'];

export type Scene = {
  /** Identificador estable del guión, p. ej. `1.3`. */
  readonly id: string;
  readonly title: string;
  /** Hora dentro de la historia. */
  readonly clock?: string;
  readonly screen: ScreenKind;
  readonly participants?: readonly string[];
  readonly hud?: HudConfig;
  /** Conversación o narración previa a la interacción. */
  readonly lines?: readonly Line[];
  /** Notificación push; `caller` es el personaje que llama enseguida (videollamada entrante). */
  readonly notification?: { readonly app: string; readonly title: string; readonly body: Text; readonly caller?: string };
  readonly email?: { readonly from: string; readonly subject: string; readonly body: Text; readonly signature?: string };
  /** Elemento visual de ambiente, p. ej. el gráfico de quejas del cliffhanger 2.5. */
  readonly visual?: SceneVisual;
  readonly interaction: Interaction;
};

export type SceneVisual = 'complaints-chart';

export type SessionDefinition = {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly synopsis: string;
  readonly estimatedMinutes: number;
  readonly scenes: readonly Scene[];
};

export type CharacterDefinition = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly bio: string;
};

export type CareerModule = {
  readonly id: string;
  /** Carrera a la que pertenecen el desempeño y el perfil de afinidad. */
  readonly careerId: string;
  /** Versión del guión. Cambia si cambian escenas o puntajes. */
  readonly version: number;
  readonly title: string;
  readonly tagline: string;
  readonly company: string;
  readonly playerRole: string;
  readonly initialPerformance: number;
  readonly initialFlags: Flags;
  readonly characters: Readonly<Record<string, CharacterDefinition>>;
  readonly sessions: readonly SessionDefinition[];
};

/* ------------------------------------------------------------------ */
/* Respuestas del jugador                                              */
/* ------------------------------------------------------------------ */

export type SceneResponse =
  | { readonly kind: 'continue' }
  | { readonly kind: 'dialogue'; readonly optionId: string }
  /** Se acabó el tiempo de una decisión con tiempo límite sin elegir. */
  | { readonly kind: 'timeout' }
  | { readonly kind: 'classification'; readonly assignments: Readonly<Record<string, string>>; readonly timedOut: boolean }
  | { readonly kind: 'message-builder'; readonly blockIds: readonly string[] }
  | { readonly kind: 'sequence'; readonly candidateId: string; readonly slot: number }
  | { readonly kind: 'prioritization'; readonly selectedTaskIds: readonly string[] }
  | { readonly kind: 'matching'; readonly matches: Readonly<Record<string, string>>; readonly timedOut: boolean }
  | { readonly kind: 'live-decision'; readonly optionId: string };

/* ------------------------------------------------------------------ */
/* Estado persistido por estudiante y carrera                          */
/* ------------------------------------------------------------------ */

export type SessionStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type SessionRecord = {
  id: string;
  status: SessionStatus;
  startedAt?: string;
  completedAt?: string;
  performanceStart?: number;
  performanceEnd?: number;
  affinityEnd?: AffinityVector;
  /** Tiempo activo reportado por las escenas jugadas. */
  elapsedMs: number;
};

export type LogEntry = {
  sceneId: string;
  sessionId: string;
  outcomeId: string;
  label: string;
  performanceDelta: number;
  affinityDelta: AffinityDelta;
  timedOut: boolean;
  at: string;
};

export type SimulationState = {
  schemaVersion: 1;
  moduleId: string;
  moduleVersion: number;
  careerId: string;
  playerName: string;
  status: 'in_progress' | 'completed';
  /** Sesión actual: la que se está jugando o la siguiente disponible. */
  sessionIndex: number;
  sceneIndex: number;
  /** 0–100, empieza en 50. */
  performance: number;
  /** Puntos acumulados por eje (pueden ser negativos). */
  affinity: AffinityVector;
  flags: Flags;
  sessions: SessionRecord[];
  log: LogEntry[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

/* ------------------------------------------------------------------ */
/* Vistas derivadas                                                    */
/* ------------------------------------------------------------------ */

export type ResolvedLine = { readonly speaker: string; readonly text: string; readonly mood: Mood };

export type AffinityProfile = {
  readonly raw: AffinityVector;
  /** 0–100 respecto del máximo alcanzable en las sesiones consideradas. */
  readonly normalized: AffinityVector;
  /** Ejes ordenados de mayor a menor afinidad. */
  readonly ranking: readonly AffinityAxis[];
  /** Ejes que todavía no tuvieron ninguna oportunidad de sumar (máximo 0). */
  readonly unavailable: readonly AffinityAxis[];
};

export type SummaryHighlight = {
  readonly sceneId: string;
  readonly sceneTitle: string;
  readonly label: string;
  readonly performanceDelta: number;
  readonly affinityDelta: AffinityDelta;
  readonly timedOut: boolean;
};

export type SummaryData = {
  readonly performance: number;
  readonly performanceStart: number;
  readonly affinity: AffinityProfile;
  readonly highlights: readonly SummaryHighlight[];
  readonly closing?: ResolvedLine;
  readonly nextSession: { readonly number: number; readonly title: string } | null;
};

export type ScoredBranch = CareerBranch & { readonly score: number; readonly aligned: boolean };

export type PublicInteraction =
  | { readonly kind: 'none'; readonly continueLabel: string; readonly cutToBlack: boolean }
  | {
      readonly kind: 'dialogue';
      readonly prompt?: string;
      readonly timeLimitSeconds?: number;
      readonly riskMeter: boolean;
      readonly hint?: string;
      readonly options: readonly { readonly id: string; readonly label: string }[];
    }
  | {
      readonly kind: 'classification';
      readonly prompt: string;
      readonly timeLimitSeconds: number;
      readonly categories: readonly ClassificationCategory[];
      readonly items: readonly Omit<ClassificationItem, 'correctCategoryId'>[];
    }
  | {
      readonly kind: 'message-builder';
      readonly prompt: string;
      readonly channel: 'email' | 'chat';
      readonly recipient: string;
      readonly minBlocks: number;
      readonly maxBlocks: number;
      readonly blocks: readonly { readonly id: string; readonly text: string }[];
      readonly emptyOption?: { readonly label: string };
    }
  | {
      readonly kind: 'sequence';
      readonly prompt: string;
      readonly steps: readonly SequenceStep[];
      readonly candidates: readonly SequenceStep[];
    }
  | {
      readonly kind: 'prioritization';
      readonly prompt: string;
      readonly slots: number;
      readonly tasks: readonly PrioritizationTask[];
    }
  | {
      readonly kind: 'matching';
      readonly prompt: string;
      readonly timeLimitSeconds: number;
      readonly problems: readonly SequenceStep[];
      readonly solutions: readonly SequenceStep[];
    }
  | {
      readonly kind: 'live-decision';
      readonly prompt: string;
      readonly baseline: { readonly positivePct: number; readonly note: string };
      readonly options: readonly { readonly id: string; readonly label: string; readonly description?: string }[];
    }
  | {
      readonly kind: 'summary';
      readonly scope: 'session' | 'module';
      readonly heading: string;
      readonly continueLabel: string;
      readonly summary: SummaryData;
    }
  | {
      readonly kind: 'timeline';
      readonly continueLabel: string;
      readonly stages: readonly TimelineStage[];
      readonly fork: { readonly title: string; readonly narration: string };
      readonly branches: readonly ScoredBranch[];
      readonly alignmentNote: string;
    };

export type HudState = {
  readonly complaints?: { readonly count: number; readonly rising: boolean };
  /** `closed` indica que la decisión de lanzamiento ya se tomó. */
  readonly launchWindow?: { readonly seconds: number; readonly closed: boolean };
};

/** Escena resuelta para el cliente: textos finales y sin claves de respuesta. */
export type PublicScene = {
  readonly id: string;
  readonly title: string;
  readonly clock?: string;
  readonly screen: ScreenKind;
  readonly participants: readonly string[];
  readonly hud: HudState;
  readonly lines: readonly ResolvedLine[];
  readonly notification?: { readonly app: string; readonly title: string; readonly body: string; readonly caller?: string };
  readonly email?: { readonly from: string; readonly subject: string; readonly body: string; readonly signature?: string };
  readonly visual?: SceneVisual;
  readonly session: { readonly id: string; readonly number: number; readonly title: string };
  readonly sceneNumber: number;
  readonly sceneCount: number;
  readonly interaction: PublicInteraction;
};

export type OutcomeDetail =
  | { readonly kind: 'dialogue'; readonly optionId: string | null }
  | {
      readonly kind: 'classification';
      readonly correctCount: number;
      readonly total: number;
      readonly correctItemIds: readonly string[];
      readonly expected: Readonly<Record<string, string>>;
    }
  | { readonly kind: 'message-builder'; readonly message: readonly string[] }
  | { readonly kind: 'sequence'; readonly correct: boolean; readonly expected: { readonly candidateId: string; readonly slot: number } }
  | { readonly kind: 'prioritization'; readonly selectedTaskIds: readonly string[]; readonly discardedTaskIds: readonly string[] }
  | {
      readonly kind: 'matching';
      readonly correctCount: number;
      readonly total: number;
      readonly correctProblemIds: readonly string[];
      readonly expected: Readonly<Record<string, string>>;
    }
  | { readonly kind: 'live-decision'; readonly optionId: string; readonly dashboard: DashboardResult }
  | { readonly kind: 'continue' };

/** Resultado aplicado de una escena: lo que el jugador ve como consecuencia. */
export type AppliedOutcome = {
  readonly sceneId: string;
  readonly sessionId: string;
  readonly outcomeId: string;
  readonly label: string;
  readonly timedOut: boolean;
  readonly performanceBefore: number;
  readonly performanceAfter: number;
  readonly performanceDelta: number;
  readonly affinityDelta: AffinityDelta;
  readonly reactions: readonly ResolvedLine[];
  readonly narration?: string;
  readonly detail: OutcomeDetail;
  readonly sessionCompleted: boolean;
  readonly moduleCompleted: boolean;
};
