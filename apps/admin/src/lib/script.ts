import {
  AFFINITY_SHORT_LABELS,
  type AffinityAxis,
  type BlockRule,
  type CareerModule,
  type Condition,
  type Interaction,
  type Outcome,
  type Scene,
  type ScreenKind,
  type Text,
} from '@despega/simulator';

export const SCREEN_LABELS: Readonly<Record<ScreenKind, string>> = {
  notification: 'Notificación push',
  'video-call': 'Videollamada',
  chat: 'Chat',
  inbox: 'Bandeja de entrada',
  'task-board': 'Tablero de tareas',
  dashboard: 'Dashboard en vivo',
  cutscene: 'Cinemática',
  summary: 'Resumen',
  timeline: 'Línea de tiempo',
};

export function interactionLabel(interaction: Interaction): string {
  switch (interaction.kind) {
    case 'none':
      return interaction.cutToBlack ? 'Avanzar · corte a negro' : 'Avanzar';
    case 'dialogue':
      return interaction.timeLimitSeconds
        ? `Decisión con tiempo límite (${interaction.timeLimitSeconds} s)${interaction.riskMeter ? ' + medidor de riesgo' : ''}`
        : 'Diálogo con opciones';
    case 'classification':
      return `Clasificación con reloj (${interaction.timeLimitSeconds} s)`;
    case 'message-builder':
      return `Construcción de mensaje (${interaction.minBlocks}–${interaction.maxBlocks} de ${interaction.blocks.length} frases)`;
    case 'sequence':
      return 'Insertar el paso faltante en el flujo';
    case 'prioritization':
      return `Priorización (${interaction.slots} de ${interaction.tasks.length})`;
    case 'matching':
      return `Emparejamiento con reloj (${interaction.timeLimitSeconds} s)`;
    case 'live-decision':
      return 'Decisión con dashboard en vivo (sin reloj)';
    case 'summary':
      return interaction.scope === 'module' ? 'Resultado final del módulo' : 'Resumen de sesión';
    case 'timeline':
      return 'Proyección de carrera';
  }
}

export function describeCondition(condition: Condition): string {
  if ('all' in condition) return condition.all.map(describeCondition).join(' y ');
  if ('any' in condition) return condition.any.map(describeCondition).join(' o ');
  if ('not' in condition) return `no (${describeCondition(condition.not)})`;
  if ('performanceAtLeast' in condition) return `desempeño ≥ ${condition.performanceAtLeast}`;
  if ('equals' in condition) return `${condition.flag} = ${String(condition.equals)}`;
  return `${condition.flag} ∈ {${condition.oneOf.map(String).join(', ')}}`;
}

export function textVariants(text: Text): { condition?: string; text: string }[] {
  if (typeof text === 'string') return [{ text }];
  return [...text.variants.map((variant) => ({ condition: describeCondition(variant.when), text: variant.text })), { condition: 'en otro caso', text: text.fallback }];
}

export function describeBlockRule(rule: BlockRule): string {
  switch (rule.kind) {
    case 'empty':
      return 'No envía nada';
    case 'always':
      return 'Cualquier otra combinación';
    case 'only':
      return `Solo frases «${rule.tags.join(' / ')}»`;
    case 'includes':
      return [rule.all?.length ? `Incluye «${rule.all.join(' + ')}»` : '', rule.none?.length ? `sin «${rule.none.join(' / ')}»` : ''].filter(Boolean).join(' ');
  }
}

export type OutcomeLine = {
  readonly trigger: string;
  readonly outcome: Outcome;
  readonly extra?: string;
};

/** Todas las consecuencias posibles de una escena, en el orden en que el motor las evalúa. */
export function outcomeLines(scene: Scene): OutcomeLine[] {
  const interaction = scene.interaction;
  switch (interaction.kind) {
    case 'none':
      return interaction.outcome ? [{ trigger: 'Al avanzar', outcome: interaction.outcome }] : [];
    case 'dialogue':
      return [
        ...interaction.options.map((option, index) => ({ trigger: `${String.fromCharCode(65 + index)}) ${option.label}`, outcome: option.outcome })),
        ...(interaction.timeoutOutcome ? [{ trigger: 'Se acaba el tiempo', outcome: interaction.timeoutOutcome }] : []),
      ];
    case 'classification':
      return [...interaction.tiers]
        .sort((left, right) => right.minCorrect - left.minCorrect)
        .map((tier) => ({ trigger: tier.minCorrect === 0 ? 'Ningún acierto' : `≥ ${tier.minCorrect} de ${interaction.items.length} aciertos`, outcome: tier.outcome }));
    case 'message-builder':
      return interaction.rules.map((rule) => ({ trigger: describeBlockRule(rule.when), outcome: rule.outcome }));
    case 'sequence':
      return [
        {
          trigger: `Correcto: «${interaction.candidates.find((candidate) => candidate.id === interaction.answer.candidateId)?.text}» en la posición ${interaction.answer.slot + 1}`,
          outcome: interaction.outcomes.correct,
        },
        { trigger: 'Cualquier otro paso o posición', outcome: interaction.outcomes.incorrect },
      ];
    case 'prioritization':
      return [{ trigger: 'Completa la priorización (cualquier combinación)', outcome: interaction.outcome, extra: `Guarda la tarea descartada en «${interaction.discardedFlag}»` }];
    case 'matching':
      return [...interaction.results]
        .sort((left, right) => right.minCorrect - left.minCorrect)
        .map((result) => ({
          trigger: result.minCorrect === 0 ? 'Menos de 2 aciertos' : `≥ ${result.minCorrect} aciertos`,
          outcome: result.outcome,
          extra: `Además, por cada acierto: ${deltaText(interaction.perMatch.performance, interaction.perMatch.affinity)}`,
        }));
    case 'live-decision':
      return interaction.options.flatMap((option) =>
        option.results.map((result) => ({
          trigger: `${option.label}${result.when ? ` · si ${describeCondition(result.when)}` : ''}`,
          outcome: result.outcome,
          extra: `Dashboard: ${result.dashboard.positivePct} % positivas — ${result.dashboard.headline}`,
        })),
      );
    case 'summary':
      return [];
    case 'timeline':
      return [];
  }
}

export function deltaText(performance: number | undefined, affinity: Partial<Record<AffinityAxis, number>> | undefined): string {
  const parts: string[] = [];
  if (performance) parts.push(`${performance > 0 ? '+' : ''}${performance} desempeño`);
  for (const [axis, value] of Object.entries(affinity ?? {}) as [AffinityAxis, number][]) {
    if (value) parts.push(`${value > 0 ? '+' : ''}${value} ${AFFINITY_SHORT_LABELS[axis].toLowerCase()}`);
  }
  return parts.join(' · ') || 'sin puntaje';
}

export function sceneCount(module: CareerModule): number {
  return module.sessions.reduce((total, session) => total + session.scenes.length, 0);
}
