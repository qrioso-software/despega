import type { CareerModule, Outcome, Scene } from './types.ts';

/**
 * Verifica que un módulo sea jugable de principio a fin: identificadores únicos,
 * referencias válidas y un resultado definido para toda respuesta posible. Un módulo
 * nuevo no se publica si esta función devuelve errores.
 */
export function validateModule(module: CareerModule): string[] {
  const errors: string[] = [];
  const sessionIds = new Set<string>();
  const sceneIds = new Set<string>();
  const speakers = new Set(['narrator', 'system', ...Object.keys(module.characters)]);

  if (module.sessions.length === 0) errors.push('El módulo no tiene sesiones.');
  if (module.initialPerformance < 0 || module.initialPerformance > 100) {
    errors.push('El desempeño inicial debe estar entre 0 y 100.');
  }

  module.sessions.forEach((session, sessionIndex) => {
    if (sessionIds.has(session.id)) errors.push(`Sesión duplicada: ${session.id}.`);
    sessionIds.add(session.id);
    if (session.number !== sessionIndex + 1) errors.push(`La sesión ${session.id} debe tener número ${sessionIndex + 1}.`);
    if (session.scenes.length === 0) errors.push(`La sesión ${session.id} no tiene escenas.`);
    const last = session.scenes[session.scenes.length - 1];
    if (last && last.interaction.kind !== 'summary' && last.interaction.kind !== 'timeline') {
      errors.push(`La sesión ${session.id} debe cerrar con un resumen o la proyección de carrera.`);
    }

    for (const scene of session.scenes) {
      const at = `Escena ${scene.id}`;
      if (sceneIds.has(scene.id)) errors.push(`${at}: identificador duplicado.`);
      sceneIds.add(scene.id);
      for (const participant of scene.participants ?? []) {
        if (!module.characters[participant]) errors.push(`${at}: participante desconocido ${participant}.`);
      }
      for (const line of scene.lines ?? []) {
        if (!speakers.has(line.speaker)) errors.push(`${at}: hablante desconocido ${line.speaker}.`);
      }
      if (scene.email && !module.characters[scene.email.from]) errors.push(`${at}: remitente desconocido.`);
      if (scene.notification?.caller && !module.characters[scene.notification.caller]) errors.push(`${at}: quien llama es desconocido.`);
      errors.push(...validateInteraction(scene, speakers).map((error) => `${at}: ${error}`));
    }
  });

  return errors;
}

function validateInteraction(scene: Scene, speakers: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  const interaction = scene.interaction;
  const checkOutcome = (outcome: Outcome | undefined, label: string) => {
    if (!outcome) return;
    if (!outcome.id || !outcome.label) errors.push(`${label}: el resultado necesita id y etiqueta.`);
    for (const reaction of outcome.reactions ?? []) {
      if (!speakers.has(reaction.speaker)) errors.push(`${label}: hablante desconocido ${reaction.speaker}.`);
    }
  };

  switch (interaction.kind) {
    case 'none':
      checkOutcome(interaction.outcome, 'avance');
      break;
    case 'dialogue': {
      if (interaction.options.length < 2 || interaction.options.length > 4) errors.push('un diálogo tiene entre 2 y 4 opciones.');
      if (hasDuplicates(interaction.options.map((option) => option.id))) errors.push('opciones duplicadas.');
      if (interaction.timeLimitSeconds !== undefined && !interaction.timeoutOutcome) {
        errors.push('una decisión con tiempo límite necesita consecuencia por tiempo agotado.');
      }
      interaction.options.forEach((option) => checkOutcome(option.outcome, `opción ${option.id}`));
      checkOutcome(interaction.timeoutOutcome, 'tiempo agotado');
      break;
    }
    case 'classification': {
      const categories = new Set(interaction.categories.map((category) => category.id));
      if (categories.size < 2) errors.push('la clasificación necesita al menos dos categorías.');
      if (hasDuplicates(interaction.items.map((item) => item.id))) errors.push('tarjetas duplicadas.');
      for (const item of interaction.items) {
        if (!categories.has(item.correctCategoryId)) errors.push(`la tarjeta ${item.id} apunta a una categoría inexistente.`);
      }
      if (!interaction.tiers.some((tier) => tier.minCorrect === 0)) errors.push('falta el resultado para cero aciertos.');
      interaction.tiers.forEach((tier) => checkOutcome(tier.outcome, `tramo ${tier.minCorrect}`));
      break;
    }
    case 'message-builder': {
      if (hasDuplicates(interaction.blocks.map((block) => block.id))) errors.push('frases duplicadas.');
      if (interaction.minBlocks < 1 || interaction.minBlocks > interaction.maxBlocks || interaction.maxBlocks > interaction.blocks.length) {
        errors.push('rango de frases inválido.');
      }
      if (interaction.rules[interaction.rules.length - 1]?.when.kind !== 'always') {
        errors.push('la última regla del mensaje debe cubrir cualquier combinación.');
      }
      if (interaction.emptyOption && !interaction.rules.some((rule) => rule.when.kind === 'empty')) {
        errors.push('falta la regla para el mensaje vacío.');
      }
      interaction.rules.forEach((rule, index) => checkOutcome(rule.outcome, `regla ${index + 1}`));
      break;
    }
    case 'sequence': {
      if (!interaction.candidates.some((candidate) => candidate.id === interaction.answer.candidateId)) {
        errors.push('la respuesta apunta a un paso inexistente.');
      }
      if (interaction.answer.slot < 0 || interaction.answer.slot > interaction.steps.length) {
        errors.push('la posición correcta está fuera del flujo.');
      }
      checkOutcome(interaction.outcomes.correct, 'correcto');
      checkOutcome(interaction.outcomes.incorrect, 'incorrecto');
      break;
    }
    case 'prioritization': {
      if (interaction.slots < 1 || interaction.slots >= interaction.tasks.length) {
        errors.push('la priorización debe dejar al menos una tarea fuera.');
      }
      if (hasDuplicates(interaction.tasks.map((task) => task.id))) errors.push('tareas duplicadas.');
      checkOutcome(interaction.outcome, 'priorización');
      break;
    }
    case 'matching': {
      const solutions = new Set(interaction.solutions.map((solution) => solution.id));
      if (interaction.problems.length !== interaction.solutions.length) errors.push('debe haber tantas soluciones como errores.');
      const answers = interaction.problems.map((problem) => interaction.answer[problem.id]);
      if (answers.some((answer) => !answer || !solutions.has(answer)) || hasDuplicates(answers.map(String))) {
        errors.push('cada error necesita una solución distinta y existente.');
      }
      if (!interaction.results.some((result) => result.minCorrect === 0)) errors.push('falta el resultado para cero aciertos.');
      interaction.results.forEach((result) => checkOutcome(result.outcome, `tramo ${result.minCorrect}`));
      break;
    }
    case 'live-decision': {
      if (interaction.options.length < 2) errors.push('la decisión necesita al menos dos opciones.');
      if (interaction.baseline[interaction.baseline.length - 1]?.when) errors.push('el último estado inicial no debe tener condición.');
      for (const option of interaction.options) {
        if (option.results.length === 0 || option.results[option.results.length - 1]?.when) {
          errors.push(`la opción ${option.id} necesita un resultado final sin condición.`);
        }
        option.results.forEach((result, index) => checkOutcome(result.outcome, `opción ${option.id} resultado ${index + 1}`));
      }
      break;
    }
    case 'summary':
      if (interaction.closing && interaction.closing[interaction.closing.length - 1]?.when) {
        errors.push('el último cierre no debe tener condición.');
      }
      break;
    case 'timeline':
      if (interaction.branches.length === 0) errors.push('la proyección necesita al menos un camino.');
      for (const branch of interaction.branches) {
        if (branch.axes.length === 0) errors.push(`el camino ${branch.id} necesita ejes de afinidad.`);
      }
      break;
  }

  return errors;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}
