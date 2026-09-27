import {
  addAffinity,
  buildAffinityProfile,
  clamp,
  cumulativeAffinityMaximum,
  emptyAffinity,
  mergeAffinity,
  scaleAffinity,
} from './affinity.ts';
import { evaluateCondition, resolveLines, resolveText, type ConditionContext } from './conditions.ts';
import type {
  AffinityDelta,
  AffinityProfile,
  AppliedOutcome,
  BlockRule,
  CareerModule,
  Condition,
  Flags,
  HudState,
  LogEntry,
  MessageBuilderInteraction,
  Outcome,
  OutcomeDetail,
  PublicInteraction,
  PublicScene,
  Scene,
  SceneResponse,
  ScoredBranch,
  SessionDefinition,
  SessionRecord,
  SimulationState,
  SummaryData,
  SummaryHighlight,
  TimelineInteraction,
} from './types.ts';

/** Cada cuánto sube en una unidad el contador de quejas mientras el problema sigue activo. */
export const COMPLAINT_INTERVAL_MS = 3_000;
/** Tope del tiempo reportado por escena; evita que una pestaña olvidada distorsione el registro. */
export const MAX_SCENE_ELAPSED_MS = 30 * 60 * 1_000;
export const MAX_PLAYER_NAME_LENGTH = 40;

/** Flags que el motor administra para el HUD del mundo del juego. */
export const WORLD_FLAGS = {
  complaints: 'complaints',
  complaintsTrend: 'complaintsTrend',
  launchWindowSeconds: 'launchWindowSeconds',
  launchDecision: 'launchDecision',
} as const;

export type SimulationErrorCode =
  | 'MODULE_MISMATCH'
  | 'MODULE_COMPLETED'
  | 'SESSION_LOCKED'
  | 'SESSION_NOT_STARTED'
  | 'SCENE_MISMATCH'
  | 'INVALID_RESPONSE';

export class SimulationError extends Error {
  readonly code: SimulationErrorCode;

  constructor(code: SimulationErrorCode, message: string) {
    super(message);
    this.name = 'SimulationError';
    this.code = code;
  }
}

export function createInitialState(
  module: CareerModule,
  input: { playerName: string; now: string },
): SimulationState {
  return {
    schemaVersion: 1,
    moduleId: module.id,
    moduleVersion: module.version,
    careerId: module.careerId,
    playerName: normalizePlayerName(input.playerName),
    status: 'in_progress',
    sessionIndex: 0,
    sceneIndex: 0,
    performance: clamp(module.initialPerformance, 0, 100),
    affinity: emptyAffinity(),
    flags: { ...module.initialFlags },
    sessions: module.sessions.map((session, index) => ({
      id: session.id,
      status: index === 0 ? 'available' : 'locked',
      elapsedMs: 0,
    })),
    log: [],
    startedAt: input.now,
    updatedAt: input.now,
  };
}

export function normalizePlayerName(value: string): string {
  const name = value.replace(/\s+/g, ' ').trim().slice(0, MAX_PLAYER_NAME_LENGTH);
  return name || 'practicante';
}

/** Abre la sesión disponible. Es idempotente si la sesión ya está en curso. */
export function startSession(
  module: CareerModule,
  state: SimulationState,
  input: { sessionIndex: number; now: string },
): SimulationState {
  assertModule(module, state);
  if (state.status === 'completed') {
    throw new SimulationError('MODULE_COMPLETED', 'El módulo ya fue completado.');
  }
  const record = state.sessions[input.sessionIndex];
  if (!record || input.sessionIndex !== state.sessionIndex) {
    throw new SimulationError('SESSION_LOCKED', 'Esa sesión todavía no está disponible.');
  }
  if (record.status === 'in_progress') return state;
  if (record.status !== 'available') {
    throw new SimulationError('SESSION_LOCKED', 'Esa sesión todavía no está disponible.');
  }

  return {
    ...state,
    sceneIndex: 0,
    sessions: state.sessions.map((session, index): SessionRecord => index === input.sessionIndex
      ? { ...session, status: 'in_progress', startedAt: input.now, performanceStart: state.performance }
      : session),
    updatedAt: input.now,
  };
}

export function currentSession(module: CareerModule, state: SimulationState): SessionDefinition | undefined {
  return module.sessions[state.sessionIndex];
}

export function currentSceneDefinition(
  module: CareerModule,
  state: SimulationState,
): { session: SessionDefinition; scene: Scene } | null {
  if (state.status === 'completed') return null;
  const session = module.sessions[state.sessionIndex];
  if (!session || state.sessions[state.sessionIndex]?.status !== 'in_progress') return null;
  const scene = session.scenes[state.sceneIndex];
  return scene ? { session, scene } : null;
}

export function getPublicScene(module: CareerModule, state: SimulationState): PublicScene | null {
  assertModule(module, state);
  const current = currentSceneDefinition(module, state);
  if (!current) return null;
  const { session, scene } = current;
  const context = contextOf(state);

  return {
    id: scene.id,
    title: scene.title,
    clock: scene.clock,
    screen: scene.screen,
    participants: [...(scene.participants ?? [])],
    hud: hudState(scene, state.flags),
    lines: resolveLines(scene.lines, context),
    notification: scene.notification && {
      app: scene.notification.app,
      title: scene.notification.title,
      body: resolveText(scene.notification.body, context),
      caller: scene.notification.caller,
    },
    email: scene.email && {
      from: scene.email.from,
      subject: scene.email.subject,
      body: resolveText(scene.email.body, context),
      signature: scene.email.signature,
    },
    visual: scene.visual,
    session: { id: session.id, number: session.number, title: session.title },
    sceneNumber: state.sceneIndex + 1,
    sceneCount: session.scenes.length,
    interaction: publicInteraction(module, state, scene, context),
  };
}

export function applySceneResponse(
  module: CareerModule,
  state: SimulationState,
  input: { sceneId: string; response: SceneResponse; elapsedMs: number; now: string },
): { state: SimulationState; outcome: AppliedOutcome } {
  assertModule(module, state);
  if (state.status === 'completed') {
    throw new SimulationError('MODULE_COMPLETED', 'El módulo ya fue completado.');
  }
  const current = currentSceneDefinition(module, state);
  if (!current) {
    throw new SimulationError('SESSION_NOT_STARTED', 'La sesión actual todavía no ha comenzado.');
  }
  const { session, scene } = current;
  if (scene.id !== input.sceneId) {
    throw new SimulationError('SCENE_MISMATCH', 'La escena ya no es la actual; recarga el progreso.');
  }

  const elapsedMs = clamp(Math.round(Number.isFinite(input.elapsedMs) ? input.elapsedMs : 0), 0, MAX_SCENE_ELAPSED_MS);
  const before = contextOf(state);
  const evaluation = evaluateScene(scene, input.response, before);
  const outcome = evaluation.outcome;

  // El mundo avanza con el tiempo jugado antes de aplicar la consecuencia: las quejas
  // que llegaron mientras el jugador decidía ya ocurrieron.
  let flags = advanceWorld(scene, state.flags, elapsedMs);
  flags = { ...flags, ...(outcome?.flags ?? {}), ...evaluation.extraFlags };

  const performanceAfter = clamp(state.performance + (outcome?.performance ?? 0) + evaluation.extraPerformance, 0, 100);
  const performanceDelta = performanceAfter - state.performance;
  const affinityDelta = mergeAffinity(outcome?.affinity, evaluation.extraAffinity);
  const affinity = addAffinity(state.affinity, affinityDelta);
  const after: ConditionContext = { flags, performance: performanceAfter, playerName: state.playerName };
  const outcomeId = outcome?.id ?? `${scene.id}:continue`;
  const label = outcome?.label ?? 'Continuar';

  const log: LogEntry[] = isDecision(scene)
    ? [...state.log, {
        sceneId: scene.id,
        sessionId: session.id,
        outcomeId,
        label,
        performanceDelta,
        affinityDelta,
        timedOut: evaluation.timedOut,
        at: input.now,
      }]
    : state.log;

  const sessionIndex = state.sessionIndex;
  const sessions = state.sessions.map((record) => ({ ...record }));
  const record = sessions[sessionIndex]!;
  record.elapsedMs += elapsedMs;

  const sessionCompleted = state.sceneIndex >= session.scenes.length - 1;
  let nextSessionIndex = sessionIndex;
  let nextSceneIndex = state.sceneIndex + 1;
  let status: SimulationState['status'] = state.status;
  let completedAt = state.completedAt;
  if (sessionCompleted) {
    record.status = 'completed';
    record.completedAt = input.now;
    record.performanceEnd = performanceAfter;
    record.affinityEnd = { ...affinity };
    const next = sessions[sessionIndex + 1];
    if (next) {
      next.status = 'available';
      nextSessionIndex = sessionIndex + 1;
      nextSceneIndex = 0;
    } else {
      status = 'completed';
      completedAt = input.now;
      nextSceneIndex = session.scenes.length;
    }
  }

  const nextState: SimulationState = {
    ...state,
    status,
    sessionIndex: nextSessionIndex,
    sceneIndex: nextSceneIndex,
    performance: performanceAfter,
    affinity,
    flags,
    sessions,
    log,
    updatedAt: input.now,
    completedAt,
  };

  return {
    state: nextState,
    outcome: {
      sceneId: scene.id,
      sessionId: session.id,
      outcomeId,
      label,
      timedOut: evaluation.timedOut,
      performanceBefore: state.performance,
      performanceAfter,
      performanceDelta,
      affinityDelta,
      reactions: resolveLines(outcome?.reactions, after),
      narration: outcome?.narration ? resolveText(outcome.narration, after) : undefined,
      detail: evaluation.detail,
      sessionCompleted,
      moduleCompleted: status === 'completed',
    },
  };
}

/* ------------------------------------------------------------------ */
/* Vistas derivadas para HUD, resúmenes y backoffice                    */
/* ------------------------------------------------------------------ */

export type ProgressSnapshot = {
  readonly status: SimulationState['status'];
  readonly performance: number;
  readonly affinity: AffinityProfile;
  readonly currentSessionNumber: number | null;
  readonly completedSessions: number;
  readonly totalSessions: number;
  readonly sessions: readonly {
    readonly id: string;
    readonly number: number;
    readonly title: string;
    readonly synopsis: string;
    readonly estimatedMinutes: number;
    readonly status: SessionRecord['status'];
    readonly performanceStart?: number;
    readonly performanceEnd?: number;
    readonly startedAt?: string;
    readonly completedAt?: string;
    readonly elapsedMs: number;
  }[];
  readonly alignedBranchId?: string;
};

export function progressSnapshot(module: CareerModule, state: SimulationState): ProgressSnapshot {
  assertModule(module, state);
  const affinity = affinityProfileOf(module, state);
  const branches = scoreBranches(module, state);
  const completedSessions = state.sessions.filter((session) => session.status === 'completed').length;
  return {
    status: state.status,
    performance: state.performance,
    affinity,
    currentSessionNumber: state.status === 'completed' ? null : (module.sessions[state.sessionIndex]?.number ?? null),
    completedSessions,
    totalSessions: module.sessions.length,
    sessions: module.sessions.map((session, index) => {
      const record = state.sessions[index];
      return {
        id: session.id,
        number: session.number,
        title: session.title,
        synopsis: session.synopsis,
        estimatedMinutes: session.estimatedMinutes,
        status: record?.status ?? 'locked',
        performanceStart: record?.performanceStart,
        performanceEnd: record?.performanceEnd,
        startedAt: record?.startedAt,
        completedAt: record?.completedAt,
        elapsedMs: record?.elapsedMs ?? 0,
      };
    }),
    alignedBranchId: state.status === 'completed' ? branches.find((branch) => branch.aligned)?.id : undefined,
  };
}

/**
 * Perfil normalizado contra el máximo alcanzable en las sesiones ya iniciadas; así el
 * radar de la sesión 1 no aparece vacío por puntos que todavía no se podían ganar.
 */
export function affinityProfileOf(module: CareerModule, state: SimulationState): AffinityProfile {
  const lastPlayed = state.sessions.reduce(
    (latest, session, index) => session.status === 'in_progress' || session.status === 'completed' ? index : latest,
    0,
  );
  return buildAffinityProfile(state.affinity, cumulativeAffinityMaximum(module, lastPlayed));
}

/** Caminos de la bifurcación final, puntuados por el promedio normalizado de sus ejes. */
export function scoreBranches(module: CareerModule, state: SimulationState): ScoredBranch[] {
  const timeline = module.sessions
    .flatMap((session) => session.scenes)
    .map((scene) => scene.interaction)
    .find((interaction): interaction is TimelineInteraction => interaction.kind === 'timeline');
  if (!timeline) return [];
  const profile = buildAffinityProfile(state.affinity, cumulativeAffinityMaximum(module, module.sessions.length - 1));
  const scored = timeline.branches.map((branch) => ({
    ...branch,
    score: Math.round(branch.axes.reduce((sum, axis) => sum + profile.normalized[axis], 0) / Math.max(1, branch.axes.length)),
  }));
  const best = scored.reduce((winner, branch) => (branch.score > winner.score ? branch : winner), scored[0]!);
  return scored.map((branch) => ({ ...branch, aligned: branch.id === best.id }));
}

/* ------------------------------------------------------------------ */
/* Evaluación por tipo de interacción                                  */
/* ------------------------------------------------------------------ */

type Evaluation = {
  outcome?: Outcome;
  extraPerformance: number;
  extraAffinity?: AffinityDelta;
  extraFlags: Flags;
  timedOut: boolean;
  detail: OutcomeDetail;
};

function evaluateScene(scene: Scene, response: SceneResponse, context: ConditionContext): Evaluation {
  const interaction = scene.interaction;
  const base = { extraPerformance: 0, extraFlags: {}, timedOut: false };

  switch (interaction.kind) {
    case 'none':
    case 'summary':
    case 'timeline': {
      expectKind(response, 'continue');
      return { ...base, outcome: interaction.kind === 'none' ? interaction.outcome : undefined, detail: { kind: 'continue' } };
    }

    case 'dialogue': {
      if (response.kind === 'timeout') {
        if (!interaction.timeLimitSeconds || !interaction.timeoutOutcome) {
          throw invalid('Esta decisión no tiene tiempo límite.');
        }
        return { ...base, outcome: interaction.timeoutOutcome, timedOut: true, detail: { kind: 'dialogue', optionId: null } };
      }
      const selected = expectKind(response, 'dialogue');
      const option = interaction.options.find((item) => item.id === selected.optionId);
      if (!option) throw invalid('La opción elegida no existe.');
      return { ...base, outcome: option.outcome, detail: { kind: 'dialogue', optionId: option.id } };
    }

    case 'classification': {
      const answer = expectKind(response, 'classification');
      const itemIds = new Set(interaction.items.map((item) => item.id));
      const categoryIds = new Set(interaction.categories.map((category) => category.id));
      const assignments = Object.entries(answer.assignments ?? {});
      for (const [itemId, categoryId] of assignments) {
        if (!itemIds.has(itemId) || !categoryIds.has(categoryId)) throw invalid('Clasificación inválida.');
      }
      if (!answer.timedOut && assignments.length !== interaction.items.length) {
        throw invalid('Clasifica todas las tarjetas antes de enviar.');
      }
      const correctItemIds = interaction.items
        .filter((item) => answer.assignments[item.id] === item.correctCategoryId)
        .map((item) => item.id);
      const tier = firstTier(interaction.tiers, correctItemIds.length);
      return {
        ...base,
        outcome: tier,
        timedOut: Boolean(answer.timedOut),
        detail: {
          kind: 'classification',
          correctCount: correctItemIds.length,
          total: interaction.items.length,
          correctItemIds,
          expected: Object.fromEntries(interaction.items.map((item) => [item.id, item.correctCategoryId])),
        },
      };
    }

    case 'message-builder': {
      const answer = expectKind(response, 'message-builder');
      const blockIds = [...(answer.blockIds ?? [])];
      if (new Set(blockIds).size !== blockIds.length) throw invalid('Cada frase se usa una sola vez.');
      const blocks = blockIds.map((id) => interaction.blocks.find((block) => block.id === id));
      if (blocks.some((block) => !block)) throw invalid('Una de las frases no existe.');
      if (blockIds.length === 0 && !interaction.emptyOption) throw invalid('Elige al menos una frase.');
      if (blockIds.length > 0 && (blockIds.length < interaction.minBlocks || blockIds.length > interaction.maxBlocks)) {
        throw invalid(`Combina entre ${interaction.minBlocks} y ${interaction.maxBlocks} frases.`);
      }
      const selected = blocks.filter((block) => block !== undefined);
      const rule = interaction.rules.find((candidate) => matchesBlockRule(candidate.when, selected));
      if (!rule) throw invalid('El mensaje no coincide con ninguna regla del guión.');
      return { ...base, outcome: rule.outcome, detail: { kind: 'message-builder', message: selected.map((block) => block.text) } };
    }

    case 'sequence': {
      const answer = expectKind(response, 'sequence');
      if (!interaction.candidates.some((candidate) => candidate.id === answer.candidateId)) {
        throw invalid('El paso elegido no existe.');
      }
      if (!Number.isInteger(answer.slot) || answer.slot < 0 || answer.slot > interaction.steps.length) {
        throw invalid('La posición elegida no existe.');
      }
      const correct = answer.candidateId === interaction.answer.candidateId && answer.slot === interaction.answer.slot;
      return {
        ...base,
        outcome: correct ? interaction.outcomes.correct : interaction.outcomes.incorrect,
        detail: { kind: 'sequence', correct, expected: { ...interaction.answer } },
      };
    }

    case 'prioritization': {
      const answer = expectKind(response, 'prioritization');
      const selectedTaskIds = [...(answer.selectedTaskIds ?? [])];
      const taskIds = interaction.tasks.map((task) => task.id);
      if (
        new Set(selectedTaskIds).size !== selectedTaskIds.length
        || selectedTaskIds.length !== interaction.slots
        || selectedTaskIds.some((id) => !taskIds.includes(id))
      ) {
        throw invalid(`Elige exactamente ${interaction.slots} tareas.`);
      }
      const discardedTaskIds = taskIds.filter((id) => !selectedTaskIds.includes(id));
      return {
        ...base,
        outcome: interaction.outcome,
        extraFlags: { [interaction.discardedFlag]: discardedTaskIds.join(',') },
        detail: { kind: 'prioritization', selectedTaskIds, discardedTaskIds },
      };
    }

    case 'matching': {
      const answer = expectKind(response, 'matching');
      const problemIds = new Set(interaction.problems.map((problem) => problem.id));
      const solutionIds = new Set(interaction.solutions.map((solution) => solution.id));
      const matches = Object.entries(answer.matches ?? {});
      const usedSolutions = new Set<string>();
      for (const [problemId, solutionId] of matches) {
        if (!problemIds.has(problemId) || !solutionIds.has(solutionId) || usedSolutions.has(solutionId)) {
          throw invalid('Emparejamiento inválido.');
        }
        usedSolutions.add(solutionId);
      }
      if (!answer.timedOut && matches.length !== interaction.problems.length) {
        throw invalid('Empareja todos los errores antes de enviar.');
      }
      const correctProblemIds = interaction.problems
        .filter((problem) => answer.matches[problem.id] === interaction.answer[problem.id])
        .map((problem) => problem.id);
      const count = correctProblemIds.length;
      return {
        ...base,
        outcome: firstTier(interaction.results, count),
        extraPerformance: (interaction.perMatch.performance ?? 0) * count,
        extraAffinity: scaleAffinity(interaction.perMatch.affinity, count),
        timedOut: Boolean(answer.timedOut),
        detail: {
          kind: 'matching',
          correctCount: count,
          total: interaction.problems.length,
          correctProblemIds,
          expected: { ...interaction.answer },
        },
      };
    }

    case 'live-decision': {
      const answer = expectKind(response, 'live-decision');
      const option = interaction.options.find((item) => item.id === answer.optionId);
      if (!option) throw invalid('La opción elegida no existe.');
      const result = option.results.find((candidate) => !candidate.when || evaluateCondition(candidate.when, context));
      if (!result) throw invalid('La decisión no tiene un resultado aplicable.');
      return {
        ...base,
        outcome: result.outcome,
        extraFlags: { [WORLD_FLAGS.launchDecision]: option.id },
        detail: { kind: 'live-decision', optionId: option.id, dashboard: { ...result.dashboard } },
      };
    }
  }
}

function matchesBlockRule(rule: BlockRule, blocks: readonly { tags: readonly string[] }[]): boolean {
  switch (rule.kind) {
    case 'empty':
      return blocks.length === 0;
    case 'always':
      return true;
    case 'only':
      return blocks.length > 0 && blocks.every((block) => block.tags.some((tag) => rule.tags.includes(tag)));
    case 'includes': {
      if (blocks.length === 0) return false;
      const tags = new Set(blocks.flatMap((block) => block.tags));
      return (rule.all ?? []).every((tag) => tags.has(tag)) && !(rule.none ?? []).some((tag) => tags.has(tag));
    }
  }
}

function firstTier(tiers: readonly { minCorrect: number; outcome: Outcome }[], correct: number): Outcome {
  const tier = [...tiers].sort((left, right) => right.minCorrect - left.minCorrect).find((item) => correct >= item.minCorrect);
  if (!tier) throw invalid('El guión no define un resultado para este puntaje.');
  return tier.outcome;
}

/* ------------------------------------------------------------------ */
/* Escena pública                                                      */
/* ------------------------------------------------------------------ */

function publicInteraction(
  module: CareerModule,
  state: SimulationState,
  scene: Scene,
  context: ConditionContext,
): PublicInteraction {
  const interaction = scene.interaction;
  switch (interaction.kind) {
    case 'none':
      return { kind: 'none', continueLabel: interaction.continueLabel ?? 'Continuar', cutToBlack: Boolean(interaction.cutToBlack) };
    case 'dialogue':
      return {
        kind: 'dialogue',
        prompt: interaction.prompt ? resolveText(interaction.prompt, context) : undefined,
        timeLimitSeconds: interaction.timeLimitSeconds,
        riskMeter: Boolean(interaction.riskMeter),
        hint: interaction.hint && evaluateCondition(interaction.hint.when, context) ? interaction.hint.text : undefined,
        options: interaction.options.map((option) => ({ id: option.id, label: resolveText(option.label, context) })),
      };
    case 'classification':
      return {
        kind: 'classification',
        prompt: resolveText(interaction.prompt, context),
        timeLimitSeconds: interaction.timeLimitSeconds,
        categories: interaction.categories.map((category) => ({ ...category })),
        items: interaction.items.map(({ correctCategoryId: _hidden, ...item }) => item),
      };
    case 'message-builder':
      return publicMessageBuilder(interaction, context);
    case 'sequence':
      return {
        kind: 'sequence',
        prompt: resolveText(interaction.prompt, context),
        steps: interaction.steps.map((step) => ({ ...step })),
        candidates: interaction.candidates.map((candidate) => ({ ...candidate })),
      };
    case 'prioritization':
      return {
        kind: 'prioritization',
        prompt: resolveText(interaction.prompt, context),
        slots: interaction.slots,
        tasks: interaction.tasks.map((task) => ({ ...task })),
      };
    case 'matching':
      return {
        kind: 'matching',
        prompt: resolveText(interaction.prompt, context),
        timeLimitSeconds: interaction.timeLimitSeconds,
        problems: interaction.problems.map((problem) => ({ ...problem })),
        solutions: interaction.solutions.map((solution) => ({ ...solution })),
      };
    case 'live-decision': {
      const baseline = interaction.baseline.find((item) => !item.when || evaluateCondition(item.when, context))
        ?? interaction.baseline[interaction.baseline.length - 1]!;
      return {
        kind: 'live-decision',
        prompt: resolveText(interaction.prompt, context),
        baseline: { positivePct: baseline.positivePct, note: baseline.note },
        options: interaction.options.map((option) => ({ id: option.id, label: option.label, description: option.description })),
      };
    }
    case 'summary':
      return {
        kind: 'summary',
        scope: interaction.scope,
        heading: interaction.heading,
        continueLabel: interaction.continueLabel ?? 'Continuar',
        summary: buildSummary(module, state, interaction.scope, interaction.closing, context),
      };
    case 'timeline':
      return {
        kind: 'timeline',
        continueLabel: interaction.continueLabel ?? 'Terminar',
        stages: interaction.stages.map((stage) => ({ ...stage })),
        fork: { ...interaction.fork },
        branches: scoreBranches(module, state),
        alignmentNote: interaction.alignmentNote,
      };
  }
}

function publicMessageBuilder(interaction: MessageBuilderInteraction, context: ConditionContext): PublicInteraction {
  return {
    kind: 'message-builder',
    prompt: resolveText(interaction.prompt, context),
    channel: interaction.channel,
    recipient: interaction.recipient,
    minBlocks: interaction.minBlocks,
    maxBlocks: interaction.maxBlocks,
    blocks: interaction.blocks.map((block) => ({ id: block.id, text: block.text })),
    emptyOption: interaction.emptyOption && { ...interaction.emptyOption },
  };
}

function buildSummary(
  module: CareerModule,
  state: SimulationState,
  scope: 'session' | 'module',
  closing: readonly { when?: Condition; speaker: string; text: string }[] | undefined,
  context: ConditionContext,
): SummaryData {
  const session = module.sessions[state.sessionIndex]!;
  const record = state.sessions[state.sessionIndex];
  const scenesById = new Map(module.sessions.flatMap((item) => item.scenes).map((scene) => [scene.id, scene]));
  const entries = scope === 'session'
    ? state.log.filter((entry) => entry.sessionId === session.id)
    : [...state.log]
        .sort((left, right) => Math.abs(right.performanceDelta) - Math.abs(left.performanceDelta))
        .slice(0, 6)
        .sort((left, right) => left.at.localeCompare(right.at));
  const highlights: SummaryHighlight[] = entries.map((entry) => ({
    sceneId: entry.sceneId,
    sceneTitle: scenesById.get(entry.sceneId)?.title ?? entry.sceneId,
    label: entry.label,
    performanceDelta: entry.performanceDelta,
    affinityDelta: entry.affinityDelta,
    timedOut: entry.timedOut,
  }));
  const next = scope === 'session' ? module.sessions[state.sessionIndex + 1] : undefined;
  const closingLine = closing?.find((item) => !item.when || evaluateCondition(item.when, context));

  return {
    performance: state.performance,
    performanceStart: scope === 'session' ? (record?.performanceStart ?? module.initialPerformance) : module.initialPerformance,
    affinity: buildAffinityProfile(
      state.affinity,
      cumulativeAffinityMaximum(module, scope === 'module' ? module.sessions.length - 1 : state.sessionIndex),
    ),
    highlights,
    closing: closingLine && {
      speaker: closingLine.speaker,
      text: resolveText(closingLine.text, context),
      mood: 'happy',
    },
    nextSession: next ? { number: next.number, title: next.title } : null,
  };
}

/* ------------------------------------------------------------------ */
/* Mundo del juego (HUD)                                               */
/* ------------------------------------------------------------------ */

function hudState(scene: Scene, flags: Flags): HudState {
  return {
    complaints: scene.hud?.complaints
      ? { count: numberFlag(flags, WORLD_FLAGS.complaints), rising: flags[WORLD_FLAGS.complaintsTrend] === 'rising' }
      : undefined,
    launchWindow: scene.hud?.launchWindow
      ? {
          seconds: numberFlag(flags, WORLD_FLAGS.launchWindowSeconds),
          closed: flags[WORLD_FLAGS.launchDecision] !== undefined,
        }
      : undefined,
  };
}

function advanceWorld(scene: Scene, flags: Flags, elapsedMs: number): Flags {
  let next = flags;
  if (scene.hud?.complaints && flags[WORLD_FLAGS.complaintsTrend] === 'rising') {
    next = {
      ...next,
      [WORLD_FLAGS.complaints]: Math.min(999, numberFlag(flags, WORLD_FLAGS.complaints) + Math.floor(elapsedMs / COMPLAINT_INTERVAL_MS)),
    };
  }
  if (scene.hud?.launchWindow && flags[WORLD_FLAGS.launchDecision] === undefined) {
    next = {
      ...next,
      [WORLD_FLAGS.launchWindowSeconds]: Math.max(0, numberFlag(flags, WORLD_FLAGS.launchWindowSeconds) - Math.floor(elapsedMs / 1_000)),
    };
  }
  return next;
}

function numberFlag(flags: Flags, key: string): number {
  const value = flags[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

function isDecision(scene: Scene): boolean {
  return !['none', 'summary', 'timeline'].includes(scene.interaction.kind);
}

function contextOf(state: SimulationState): ConditionContext {
  return { flags: state.flags, performance: state.performance, playerName: state.playerName };
}

function assertModule(module: CareerModule, state: SimulationState): void {
  if (state.moduleId !== module.id || state.careerId !== module.careerId) {
    throw new SimulationError('MODULE_MISMATCH', 'El progreso no pertenece a este módulo.');
  }
}

function expectKind<K extends SceneResponse['kind']>(
  response: SceneResponse,
  kind: K,
): Extract<SceneResponse, { kind: K }> {
  if (!response || response.kind !== kind) throw invalid('La respuesta no corresponde a la escena actual.');
  return response as Extract<SceneResponse, { kind: K }>;
}

function invalid(message: string): SimulationError {
  return new SimulationError('INVALID_RESPONSE', message);
}
