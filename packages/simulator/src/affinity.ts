import {
  AFFINITY_AXES,
  type AffinityAxis,
  type AffinityDelta,
  type AffinityProfile,
  type AffinityVector,
  type CareerModule,
  type Outcome,
  type Scene,
} from './types.ts';

export const AFFINITY_LABELS: Readonly<Record<AffinityAxis, string>> = {
  analytical: 'Pensamiento analítico',
  communication: 'Comunicación y trabajo en equipo',
  detail: 'Atención al detalle',
  pressure: 'Tolerancia a la presión',
  structure: 'Preferencia por lo estructurado',
};

export const AFFINITY_SHORT_LABELS: Readonly<Record<AffinityAxis, string>> = {
  analytical: 'Análisis',
  communication: 'Comunicación',
  detail: 'Detalle',
  pressure: 'Presión',
  structure: 'Estructura',
};

export const AFFINITY_DESCRIPTIONS: Readonly<Record<AffinityAxis, string>> = {
  analytical: 'Investigas, buscas patrones y decides con evidencia.',
  communication: 'Mantienes informado al equipo y cuidas cómo dices las cosas.',
  detail: 'Revisas lo que otros pasan por alto antes de dar algo por terminado.',
  pressure: 'Te mueves con decisión cuando el reloj corre y falta información.',
  structure: 'Prefieres planes, pasos y orden frente a improvisar (el polo opuesto es lo creativo).',
};

export function emptyAffinity(): AffinityVector {
  return { analytical: 0, communication: 0, detail: 0, pressure: 0, structure: 0 };
}

export function addAffinity(base: AffinityVector, delta: AffinityDelta | undefined): AffinityVector {
  const next = { ...base };
  for (const axis of AFFINITY_AXES) next[axis] += delta?.[axis] ?? 0;
  return next;
}

export function scaleAffinity(delta: AffinityDelta | undefined, factor: number): AffinityDelta {
  const scaled: AffinityDelta = {};
  for (const axis of AFFINITY_AXES) {
    const value = delta?.[axis];
    if (value) scaled[axis] = value * factor;
  }
  return scaled;
}

export function mergeAffinity(...deltas: readonly (AffinityDelta | undefined)[]): AffinityDelta {
  const merged: AffinityDelta = {};
  for (const delta of deltas) {
    for (const axis of AFFINITY_AXES) {
      const value = delta?.[axis];
      if (value) merged[axis] = (merged[axis] ?? 0) + value;
    }
  }
  for (const axis of AFFINITY_AXES) if (merged[axis] === 0) delete merged[axis];
  return merged;
}

/**
 * Máximo alcanzable por eje en cada sesión: la suma, escena por escena, del mejor
 * resultado posible para ese eje. Sirve para normalizar el radar; como los ejes
 * compiten entre sí en muchas decisiones, nadie llega al 100 % en todos.
 */
export function affinityMaximaBySession(module: CareerModule): AffinityVector[] {
  return module.sessions.map((session) => {
    const total = emptyAffinity();
    for (const scene of session.scenes) {
      const best = sceneAffinityMaximum(scene);
      for (const axis of AFFINITY_AXES) total[axis] += best[axis];
    }
    return total;
  });
}

export function cumulativeAffinityMaximum(module: CareerModule, throughSessionIndex: number): AffinityVector {
  const total = emptyAffinity();
  affinityMaximaBySession(module)
    .slice(0, throughSessionIndex + 1)
    .forEach((session) => {
      for (const axis of AFFINITY_AXES) total[axis] += session[axis];
    });
  return total;
}

export function buildAffinityProfile(raw: AffinityVector, maximum: AffinityVector): AffinityProfile {
  const normalized = emptyAffinity();
  for (const axis of AFFINITY_AXES) {
    const ceiling = maximum[axis];
    normalized[axis] = ceiling > 0 ? Math.round(clamp(raw[axis] / ceiling, 0, 1) * 100) : 0;
  }
  const unavailable = AFFINITY_AXES.filter((axis) => maximum[axis] <= 0);
  const ranking = [...AFFINITY_AXES]
    .filter((axis) => !unavailable.includes(axis))
    .sort((left, right) => normalized[right] - normalized[left] || raw[right] - raw[left]);
  return { raw: { ...raw }, normalized, ranking, unavailable };
}

function sceneAffinityMaximum(scene: Scene): AffinityVector {
  const interaction = scene.interaction;
  const outcomes: (Outcome | undefined)[] = [];
  let perMatchBonus = emptyAffinity();

  switch (interaction.kind) {
    case 'none':
      outcomes.push(interaction.outcome);
      break;
    case 'dialogue':
      outcomes.push(...interaction.options.map((option) => option.outcome), interaction.timeoutOutcome);
      break;
    case 'classification':
      outcomes.push(...interaction.tiers.map((tier) => tier.outcome));
      break;
    case 'message-builder':
      outcomes.push(...interaction.rules.map((rule) => rule.outcome));
      break;
    case 'sequence':
      outcomes.push(interaction.outcomes.correct, interaction.outcomes.incorrect);
      break;
    case 'prioritization':
      outcomes.push(interaction.outcome);
      break;
    case 'matching':
      outcomes.push(...interaction.results.map((result) => result.outcome));
      perMatchBonus = addAffinity(
        emptyAffinity(),
        scaleAffinity(interaction.perMatch.affinity, interaction.problems.length),
      );
      break;
    case 'live-decision':
      outcomes.push(...interaction.options.flatMap((option) => option.results.map((result) => result.outcome)));
      break;
    case 'summary':
    case 'timeline':
      break;
  }

  const best = emptyAffinity();
  for (const outcome of outcomes) {
    for (const axis of AFFINITY_AXES) best[axis] = Math.max(best[axis], outcome?.affinity?.[axis] ?? 0);
  }
  for (const axis of AFFINITY_AXES) best[axis] += Math.max(0, perMatchBonus[axis]);
  return best;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
