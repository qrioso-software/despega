import 'server-only';

import type { DecisionEvent } from '@despega/data';
import { AFFINITY_SHORT_LABELS, type AffinityAxis, type CareerModule, type Scene } from '@despega/simulator';
import type { DecisionRow } from '@/components/tables';
import { formatDateTime, formatDuration } from './format';

/** Traduce la respuesta guardada a lo que el estudiante vio en pantalla. */
export function describeResponse(scene: Scene | undefined, event: DecisionEvent): string | undefined {
  if (!scene) return undefined;
  const interaction = scene.interaction;
  const response = event.response;
  switch (response.kind) {
    case 'timeout':
      return 'No eligió antes de que se acabara el tiempo.';
    case 'dialogue':
      return interaction.kind === 'dialogue' ? `«${interaction.options.find((option) => option.id === response.optionId)?.label ?? response.optionId}»` : undefined;
    case 'classification': {
      if (interaction.kind !== 'classification') return undefined;
      const correct = interaction.items.filter((item) => response.assignments[item.id] === item.correctCategoryId).length;
      const placed = Object.keys(response.assignments).length;
      return `${correct} de ${interaction.items.length} bien clasificados · ${placed} ubicados${response.timedOut ? ' antes de que se acabara el tiempo' : ''}.`;
    }
    case 'message-builder': {
      if (interaction.kind !== 'message-builder') return undefined;
      if (response.blockIds.length === 0) return 'No envió ningún mensaje.';
      return `«${response.blockIds.map((id) => interaction.blocks.find((block) => block.id === id)?.text ?? id).join(' ')}»`;
    }
    case 'sequence': {
      if (interaction.kind !== 'sequence') return undefined;
      const candidate = interaction.candidates.find((item) => item.id === response.candidateId)?.text ?? response.candidateId;
      return `Insertó «${candidate}» en la posición ${response.slot + 1}.`;
    }
    case 'prioritization': {
      if (interaction.kind !== 'prioritization') return undefined;
      const discarded = interaction.tasks.filter((task) => !response.selectedTaskIds.includes(task.id)).map((task) => task.title);
      return `Dejó fuera: ${discarded.join(', ') || '—'}.`;
    }
    case 'matching': {
      if (interaction.kind !== 'matching') return undefined;
      const correct = interaction.problems.filter((problem) => response.matches[problem.id] === interaction.answer[problem.id]).length;
      return `${correct} de ${interaction.problems.length} parejas correctas${response.timedOut ? ' (se acabó el tiempo)' : ''}.`;
    }
    case 'live-decision':
      return interaction.kind === 'live-decision' ? `«${interaction.options.find((option) => option.id === response.optionId)?.label ?? response.optionId}»` : undefined;
    default:
      return undefined;
  }
}

export function decisionRows(module: CareerModule, events: readonly DecisionEvent[]): DecisionRow[] {
  const scenes = new Map(module.sessions.flatMap((session) => session.scenes.map((scene) => [scene.id, { scene, session }] as const)));
  return events.map((event) => {
    const entry = scenes.get(event.sceneId);
    return {
      id: `${event.runId}-${event.sequence}`,
      scene: event.sceneId,
      sceneTitle: entry?.scene.title ?? '',
      session: entry ? `Sesión ${entry.session.number} · ${entry.session.title}` : event.sessionId,
      decision: event.label,
      detail: describeResponse(entry?.scene, event),
      timedOut: event.timedOut,
      elapsed: formatDuration(event.elapsedMs),
      performanceDelta: event.performanceAfter - event.performanceBefore,
      affinity: (Object.entries(event.affinityDelta) as [AffinityAxis, number][])
        .filter(([, value]) => value)
        .map(([axis, value]) => `${value > 0 ? '+' : ''}${value} ${AFFINITY_SHORT_LABELS[axis].toLowerCase()}`),
      at: formatDateTime(event.createdAt),
    };
  });
}
