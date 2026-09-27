import type { Condition, Flags, Line, Mood, ResolvedLine, Text } from './types.ts';

export type ConditionContext = {
  readonly flags: Flags;
  readonly performance: number;
  readonly playerName: string;
};

export function evaluateCondition(condition: Condition, context: ConditionContext): boolean {
  if ('all' in condition) return condition.all.every((item) => evaluateCondition(item, context));
  if ('any' in condition) return condition.any.some((item) => evaluateCondition(item, context));
  if ('not' in condition) return !evaluateCondition(condition.not, context);
  if ('performanceAtLeast' in condition) return context.performance >= condition.performanceAtLeast;
  const value = context.flags[condition.flag];
  if ('equals' in condition) return value === condition.equals;
  return value !== undefined && condition.oneOf.includes(value);
}

export function resolveText(text: Text, context: ConditionContext): string {
  const raw = typeof text === 'string'
    ? text
    : text.variants.find((variant) => evaluateCondition(variant.when, context))?.text ?? text.fallback;
  return interpolate(raw, context);
}

export function resolveLines(
  lines: readonly Line[] | undefined,
  context: ConditionContext,
  defaultMood: Mood = 'neutral',
): ResolvedLine[] {
  return (lines ?? [])
    .filter((line) => !line.when || evaluateCondition(line.when, context))
    .map((line) => ({
      speaker: line.speaker,
      text: resolveText(line.text, context),
      mood: line.mood ?? defaultMood,
    }));
}

/** El estudiante es el protagonista: `{nombre}` siempre es su nombre de pila. */
export function interpolate(text: string, context: ConditionContext): string {
  return text.replaceAll('{nombre}', context.playerName);
}
