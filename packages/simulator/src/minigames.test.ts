import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SimulationError,
  applySceneResponse,
  createInitialState,
  currentSceneDefinition,
  getPublicScene,
  progressSnapshot,
  startSession,
} from './engine.ts';
import { MODULES } from './modules/index.ts';
import { ingenieriaSoftware as module } from './modules/ingenieria-software.ts';
import type { AppliedOutcome, CareerModule, Interaction, SceneResponse, SimulationState } from './types.ts';

/**
 * Pruebas exhaustivas de los mini-juegos: cada interacción se prueba con todas las
 * respuestas posibles (o una muestra aleatoria reproducible cuando son demasiadas), y se
 * verifica que siempre haya consecuencia narrativa, que el puntaje siga la tabla de
 * docs/architecture/functional-analysis.md y que las respuestas inválidas se rechacen.
 */

const NOW = '2026-09-26T12:00:00.000Z';
const CONTINUE: SceneResponse = { kind: 'continue' };

/** Mejor respuesta de cada escena; las escenas sin entrada solo avanzan. */
const BEST: Readonly<Record<string, SceneResponse>> = {
  '1.2': { kind: 'dialogue', optionId: 'revisar' },
  '1.3': { kind: 'classification', timedOut: false, assignments: { 'wifi-publico': 'lenta', fibra: 'rapida', 'datos-debiles': 'lenta', 'mala-senal': 'lenta' } },
  '1.4': { kind: 'dialogue', optionId: 'espera' },
  '1.5': { kind: 'message-builder', blockIds: ['estado', 'compromiso', 'apoyo'] },
  '2.1': { kind: 'sequence', candidateId: 'carga', slot: 1 },
  '2.2': { kind: 'dialogue', optionId: 'grupo' },
  '2.3': { kind: 'message-builder', blockIds: ['reconoce', 'prueba'] },
  '2.4': { kind: 'prioritization', selectedTaskIds: ['pruebas', 'ticket', 'diseno'] },
  '3.2': { kind: 'matching', timedOut: false, matches: { duplicado: 'sol-desactivar', envio: 'sol-sumar-envio', historial: 'sol-mensaje-vacio', correo: 'sol-correo-inmediato' } },
  '3.3': { kind: 'live-decision', optionId: 'lanzar' },
  '3.4': { kind: 'dialogue', optionId: 'investigar' },
};

/** Juega desde cero hasta que la escena actual sea `target`, con el mejor camino salvo `overrides`. */
function reach(target: string, overrides: Readonly<Record<string, SceneResponse>> = {}): SimulationState {
  let state = createInitialState(module, { playerName: 'Ana', now: NOW });
  for (let guard = 0; guard < 100; guard += 1) {
    if (!currentSceneDefinition(module, state)) state = startSession(module, state, { sessionIndex: state.sessionIndex, now: NOW });
    const { scene } = currentSceneDefinition(module, state)!;
    if (scene.id === target) return state;
    const response = overrides[scene.id] ?? BEST[scene.id] ?? CONTINUE;
    state = applySceneResponse(module, state, { sceneId: scene.id, response, elapsedMs: 1_000, now: NOW }).state;
  }
  throw new Error(`No se llegó a la escena ${target}.`);
}

function submit(state: SimulationState, sceneId: string, response: SceneResponse, elapsedMs = 1_000) {
  return applySceneResponse(module, state, { sceneId, response, elapsedMs, now: NOW });
}

function assertInvalid(action: () => unknown, message?: string): void {
  assert.throws(action, (error: unknown) => error instanceof SimulationError && error.code === 'INVALID_RESPONSE', message);
}

/** Regla del documento funcional: ninguna decisión se resuelve solo con «correcto/incorrecto». */
function assertConsequence(outcome: AppliedOutcome): void {
  const where = `${outcome.sceneId} → ${outcome.outcomeId}`;
  assert.ok(outcome.reactions.length > 0 || Boolean(outcome.narration), `${where} necesita una reacción narrativa`);
  for (const line of outcome.reactions) {
    assert.ok(line.text.trim().length > 0, `${where}: reacción vacía`);
    assert.ok(!line.text.includes('{nombre}'), `${where}: {nombre} sin reemplazar`);
  }
  assert.ok(outcome.performanceAfter >= 0 && outcome.performanceAfter <= 100, `${where}: desempeño fuera de 0–100`);
  assert.equal(outcome.performanceDelta, outcome.performanceAfter - outcome.performanceBefore);
}

function subsets<T>(items: readonly T[]): T[][] {
  return items.reduce<T[][]>((all, item) => all.flatMap((subset) => [subset, [...subset, item]]), [[]]);
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, index) => permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]));
}

/** Generador reproducible (mulberry32). */
function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other]!, copy[index]!];
  }
  return copy;
}

/* ------------------------------------------------------------------ */
/* Clasificación                                                       */
/* ------------------------------------------------------------------ */

describe('mini-juego: clasificación con reloj (1.3)', () => {
  const state = reach('1.3');
  const KEY: Readonly<Record<string, string>> = { 'wifi-publico': 'lenta', fibra: 'rapida', 'datos-debiles': 'lenta', 'mala-senal': 'lenta' };
  const ITEMS = Object.keys(KEY);
  const TIERS = {
    'patron-claro': { performance: 5, affinity: { analytical: 6, detail: 2 }, clue: 'clear' },
    'patron-parcial': { performance: 1, affinity: { detail: 2 }, clue: 'partial' },
    'sin-patron': { performance: -2, affinity: {}, clue: 'none' },
  } as const;
  // Cada tarjeta queda en la bandeja, en «lenta» o en «rápida»: 3^4 = 81 tableros.
  const BOARDS = ITEMS.reduce<Record<string, string>[]>(
    (boards, item) => boards.flatMap((board) => [board, { ...board, [item]: 'lenta' }, { ...board, [item]: 'rapida' }]),
    [{}],
  );

  it('los 81 tableros posibles tienen consecuencia y el tramo depende solo de los aciertos', () => {
    assert.equal(BOARDS.length, 81);
    const reached = new Set<string>();
    for (const assignments of BOARDS) {
      const correct = ITEMS.filter((item) => assignments[item] === KEY[item]).length;
      const tier = correct >= 3 ? 'patron-claro' : correct >= 1 ? 'patron-parcial' : 'sin-patron';
      const complete = Object.keys(assignments).length === ITEMS.length;
      for (const timedOut of complete ? [false, true] : [true]) {
        const { outcome, state: next } = submit(state, '1.3', { kind: 'classification', assignments, timedOut });
        assert.equal(outcome.outcomeId, tier, JSON.stringify(assignments));
        assert.equal(outcome.timedOut, timedOut);
        assert.equal(outcome.performanceDelta, TIERS[tier].performance);
        assert.deepEqual(outcome.affinityDelta, TIERS[tier].affinity);
        assert.equal(next.flags.s1Clue, TIERS[tier].clue);
        assert.deepEqual(outcome.detail, {
          kind: 'classification',
          correctCount: correct,
          total: 4,
          correctItemIds: ITEMS.filter((item) => assignments[item] === KEY[item]),
          expected: KEY,
        });
        assertConsequence(outcome);
        reached.add(tier);
      }
    }
    assert.deepEqual([...reached].sort(), Object.keys(TIERS).sort());
  });

  it('sin tiempo agotado exige clasificar todas las tarjetas', () => {
    for (const assignments of BOARDS.filter((board) => Object.keys(board).length < ITEMS.length)) {
      assertInvalid(() => submit(state, '1.3', { kind: 'classification', assignments, timedOut: false }));
    }
  });

  it('rechaza tarjetas o categorías que no existen', () => {
    assertInvalid(() => submit(state, '1.3', { kind: 'classification', timedOut: true, assignments: { inventada: 'lenta' } }));
    assertInvalid(() => submit(state, '1.3', { kind: 'classification', timedOut: true, assignments: { fibra: 'media' } }));
    assertInvalid(() => submit(state, '1.3', { kind: 'classification', timedOut: false, assignments: { ...KEY, extra: 'lenta' } }));
    assertInvalid(() => submit(state, '1.3', { kind: 'dialogue', optionId: 'revisar' }));
  });

  it('las reacciones no hablan de tiempo agotado cuando el tiempo no se agotó', () => {
    const allWrong = { 'wifi-publico': 'rapida', fibra: 'lenta', 'datos-debiles': 'rapida', 'mala-senal': 'rapida' };
    const { outcome } = submit(state, '1.3', { kind: 'classification', assignments: allWrong, timedOut: false });
    assert.equal(outcome.outcomeId, 'sin-patron');
    for (const line of outcome.reactions) assert.doesNotMatch(line.text, /tiempo/i);
  });
});

/* ------------------------------------------------------------------ */
/* Decisiones con reloj                                                */
/* ------------------------------------------------------------------ */

describe('mini-juego: decisiones con tiempo límite (1.4 y 2.2)', () => {
  it('1.4: cada hipótesis y el tiempo agotado tienen consecuencia; solo la correcta frena las quejas', () => {
    const state = reach('1.4');
    const expected = {
      espera: { id: 'diagnostico-correcto', performance: 8, trend: 'stopped' },
      diseno: { id: 'diagnostico-diseno', performance: -3, trend: 'rising' },
      telefono: { id: 'diagnostico-telefono', performance: -3, trend: 'rising' },
    } as const;
    for (const [optionId, want] of Object.entries(expected)) {
      const { outcome, state: next } = submit(state, '1.4', { kind: 'dialogue', optionId });
      assert.equal(outcome.outcomeId, want.id);
      assert.equal(outcome.performanceDelta, want.performance);
      assert.equal(outcome.timedOut, false);
      assert.equal(next.flags.complaintsTrend, want.trend);
      assertConsequence(outcome);
    }
    const { outcome, state: next } = submit(state, '1.4', { kind: 'timeout' }, 15_000);
    assert.equal(outcome.outcomeId, 'diagnostico-tiempo-agotado');
    assert.equal(outcome.timedOut, true);
    assert.equal(outcome.performanceDelta, -3);
    assert.deepEqual(outcome.affinityDelta, { pressure: 1 });
    assert.deepEqual(outcome.detail, { kind: 'dialogue', optionId: null });
    assert.equal(next.flags.complaintsTrend, 'rising');
    assertConsequence(outcome);
  });

  it('2.2: el tiempo agotado deja la decisión a Andrés y la sesión 3 lo recuerda', () => {
    const state = reach('2.2');
    for (const optionId of ['publicar', 'esperar', 'grupo']) {
      const { outcome } = submit(state, '2.2', { kind: 'dialogue', optionId });
      assert.equal(outcome.performanceDelta, 0, 'el documento no asigna desempeño a estas opciones');
      assertConsequence(outcome);
    }
    const { outcome, state: next } = submit(state, '2.2', { kind: 'timeout' }, 20_000);
    assert.equal(outcome.outcomeId, 'decide-andres');
    assert.equal(outcome.performanceDelta, -2);
    assert.equal(next.flags.s2Release, 'now');
    assert.equal(next.flags.s2ReleaseDecidedBy, 'andres');
    assertConsequence(outcome);
    const opening = getPublicScene(module, reach('3.1', { '2.2': { kind: 'timeout' } }))!;
    assert.ok(opening.lines.some((line) => /salió ayer con prisa/.test(line.text)));
  });

  it('los diálogos sin reloj no aceptan tiempo agotado', () => {
    assertInvalid(() => submit(reach('1.2'), '1.2', { kind: 'timeout' }));
    assertInvalid(() => submit(reach('3.4'), '3.4', { kind: 'timeout' }));
  });
});

/* ------------------------------------------------------------------ */
/* Construcción de mensaje                                             */
/* ------------------------------------------------------------------ */

describe('mini-juego: construcción de mensaje (1.5 y 2.3)', () => {
  function textOf(sceneId: string, blockId: string): string {
    const scene = module.sessions.flatMap((session) => session.scenes).find((item) => item.id === sceneId)!;
    assert.ok(scene.interaction.kind === 'message-builder');
    return scene.interaction.blocks.find((block) => block.id === blockId)!.text;
  }

  it('1.5: las 20 combinaciones de 2–3 frases, en cualquier orden, siguen el documento', () => {
    const state = reach('1.5');
    // Documento: 3 bloques profesionales y 2 poco profesionales.
    const professional = new Set(['estado', 'compromiso', 'apoyo']);
    const effects = {
      'correo-profesional': { performance: 6, affinity: { communication: 6 }, mood: 'calm' },
      'correo-poco-profesional': { performance: -4, affinity: {}, mood: 'escalated' },
      'correo-mixto': { performance: 1, affinity: { communication: 1 }, mood: 'neutral' },
    } as const;
    let tried = 0;
    for (const subset of subsets(['estado', 'no-se', 'compromiso', 'relax', 'apoyo'])) {
      if (subset.length < 2 || subset.length > 3) {
        assertInvalid(() => submit(state, '1.5', { kind: 'message-builder', blockIds: subset }), `${subset.length} frases`);
        continue;
      }
      tried += 1;
      const pro = subset.filter((id) => professional.has(id)).length;
      const expected = pro === subset.length ? 'correo-profesional' : pro === 0 ? 'correo-poco-profesional' : 'correo-mixto';
      for (const order of permutations(subset)) {
        const { outcome, state: next } = submit(state, '1.5', { kind: 'message-builder', blockIds: order });
        assert.equal(outcome.outcomeId, expected, order.join('+'));
        assert.equal(outcome.performanceDelta, effects[expected].performance);
        assert.deepEqual(outcome.affinityDelta, effects[expected].affinity);
        assert.equal(next.flags.andresMood, effects[expected].mood);
        assert.deepEqual(outcome.detail, { kind: 'message-builder', message: order.map((id) => textOf('1.5', id)) });
        assertConsequence(outcome);
      }
    }
    assert.equal(tried, 20);
  });

  it('1.5: Andrés no pregunta la hora si el correo ya la promete', () => {
    const state = reach('1.5');
    for (const blockIds of [['compromiso', 'no-se'], ['relax', 'compromiso'], ['estado', 'compromiso', 'relax']]) {
      const { outcome } = submit(state, '1.5', { kind: 'message-builder', blockIds });
      assert.equal(outcome.outcomeId, 'correo-mixto');
      for (const line of outcome.reactions) assert.doesNotMatch(line.text, /a qué hora/i, blockIds.join('+'));
    }
  });

  it('1.5: el correo no se puede dejar sin responder', () => {
    assertInvalid(() => submit(reach('1.5'), '1.5', { kind: 'message-builder', blockIds: [] }));
  });

  it('2.3: silencio, crítica, propuesta y mezcla dan la reacción del documento', () => {
    const state = reach('2.3');
    const tags: Readonly<Record<string, 'positive' | 'critique' | 'proposal'>> = {
      reconoce: 'positive',
      'error-basico': 'critique',
      prueba: 'proposal',
      'esperaba-mas': 'critique',
      equipo: 'proposal',
    };
    const effects = {
      'feedback-silencio': { performance: -2, affinity: { communication: -3 } },
      'feedback-constructivo': { performance: 4, affinity: { communication: 4 } },
      'feedback-solo-critica': { performance: 0, affinity: { communication: 1 } },
      'feedback-mixto': { performance: 1, affinity: { communication: 2 } },
    } as const;
    const reached = new Set<string>();
    for (const subset of subsets(Object.keys(tags))) {
      if (subset.length === 1 || subset.length > 3) {
        assertInvalid(() => submit(state, '2.3', { kind: 'message-builder', blockIds: subset }), `${subset.length} frases`);
        continue;
      }
      const kinds = subset.map((id) => tags[id]);
      const expected = subset.length === 0
        ? 'feedback-silencio'
        : kinds.includes('proposal') && !kinds.includes('critique')
          ? 'feedback-constructivo'
          : kinds.every((kind) => kind === 'critique') ? 'feedback-solo-critica' : 'feedback-mixto';
      for (const order of permutations(subset)) {
        const { outcome } = submit(state, '2.3', { kind: 'message-builder', blockIds: order });
        assert.equal(outcome.outcomeId, expected, order.join('+'));
        assert.equal(outcome.performanceDelta, effects[expected].performance);
        assert.deepEqual(outcome.affinityDelta, effects[expected].affinity);
        assertConsequence(outcome);
        reached.add(expected);
      }
    }
    assert.deepEqual([...reached].sort(), Object.keys(effects).sort());
  });

  it('2.3: Camila solo agradece ideas cuando el mensaje propone algo', () => {
    const state = reach('2.3');
    const praiseAndCritique = submit(state, '2.3', { kind: 'message-builder', blockIds: ['reconoce', 'error-basico'] }).outcome;
    assert.equal(praiseAndCritique.outcomeId, 'feedback-mixto');
    for (const line of praiseAndCritique.reactions) assert.doesNotMatch(line.text, /ideas/i);
  });

  it('rechaza frases repetidas o inexistentes', () => {
    const state = reach('2.3');
    assertInvalid(() => submit(state, '2.3', { kind: 'message-builder', blockIds: ['prueba', 'prueba'] }));
    assertInvalid(() => submit(state, '2.3', { kind: 'message-builder', blockIds: ['prueba', 'inventada'] }));
  });
});

/* ------------------------------------------------------------------ */
/* Secuencia                                                           */
/* ------------------------------------------------------------------ */

describe('mini-juego: insertar el paso faltante (2.1)', () => {
  const state = reach('2.1');

  it('de las 12 jugadas posibles solo una es correcta y todas tienen consecuencia', () => {
    let correct = 0;
    for (const candidateId of ['color', 'carga', 'reiniciar']) {
      for (let slot = 0; slot <= 3; slot += 1) {
        const { outcome, state: next } = submit(state, '2.1', { kind: 'sequence', candidateId, slot });
        const right = candidateId === 'carga' && slot === 1;
        if (right) correct += 1;
        assert.equal(outcome.outcomeId, right ? 'revision-correcta' : 'revision-incompleta', `${candidateId}@${slot}`);
        assert.equal(outcome.performanceDelta, right ? 6 : -2);
        assert.deepEqual(outcome.affinityDelta, right ? { analytical: 5, detail: 3 } : {});
        assert.deepEqual(outcome.detail, { kind: 'sequence', correct: right, expected: { candidateId: 'carga', slot: 1 } });
        assert.equal(next.flags.s2Review, right ? 'correct' : 'missed');
        assertConsequence(outcome);
      }
    }
    assert.equal(correct, 1);
  });

  it('Camila agradece en 2.3 solo si la revisión fue correcta', () => {
    const thanks = (scene: ReturnType<typeof getPublicScene>) => scene!.lines.some((line) => /mensaje de carga/.test(line.text));
    assert.equal(thanks(getPublicScene(module, reach('2.3'))), true);
    assert.equal(thanks(getPublicScene(module, reach('2.3', { '2.1': { kind: 'sequence', candidateId: 'carga', slot: 2 } }))), false);
  });

  it('rechaza pasos o posiciones fuera del flujo', () => {
    for (const slot of [-1, 4, 1.5, Number.NaN]) {
      assertInvalid(() => submit(state, '2.1', { kind: 'sequence', candidateId: 'carga', slot }), `posición ${slot}`);
    }
    assertInvalid(() => submit(state, '2.1', { kind: 'sequence', candidateId: 'toca', slot: 1 }), 'un paso existente no es candidato');
  });
});

/* ------------------------------------------------------------------ */
/* Priorización                                                        */
/* ------------------------------------------------------------------ */

describe('mini-juego: priorizar el tablero (2.4)', () => {
  const state = reach('2.4');
  const TASKS = ['pruebas', 'documentacion', 'ticket', 'diseno'];
  const CONSEQUENCE_IN_3_1: Readonly<Record<string, RegExp>> = {
    pruebas: /pruebas automáticas quedaron fuera/,
    documentacion: /Josué/,
    ticket: /ticket seguía sin respuesta/,
    diseno: /pantalla de confirmación sigue igual/,
  };

  it('cualquier tablero de 3 tareas, en cualquier orden, suma +2 estructura y registra la descartada', () => {
    const narrations = new Set<string>();
    for (const discarded of TASKS) {
      const chosen = TASKS.filter((task) => task !== discarded);
      for (const order of permutations(chosen)) {
        const { outcome, state: next } = submit(state, '2.4', { kind: 'prioritization', selectedTaskIds: order });
        assert.equal(outcome.performanceDelta, 0);
        assert.deepEqual(outcome.affinityDelta, { structure: 2 });
        assert.equal(next.flags.s2Discarded, discarded);
        assert.deepEqual(outcome.detail, { kind: 'prioritization', selectedTaskIds: order, discardedTaskIds: [discarded] });
        assertConsequence(outcome);
        narrations.add(outcome.narration!);
      }
    }
    assert.equal(narrations.size, 4, 'cada tarea descartada tiene su propia narración');
  });

  it('la tarea descartada reaparece como consecuencia en la apertura de la sesión 3', () => {
    for (const discarded of TASKS) {
      const selectedTaskIds = TASKS.filter((task) => task !== discarded);
      const opening = getPublicScene(module, reach('3.1', { '2.4': { kind: 'prioritization', selectedTaskIds } }))!;
      for (const [task, pattern] of Object.entries(CONSEQUENCE_IN_3_1)) {
        assert.equal(opening.lines.some((line) => pattern.test(line.text)), task === discarded, `descartada ${discarded}, consecuencia de ${task}`);
      }
    }
  });

  it('exige exactamente 3 tareas distintas y existentes', () => {
    for (const selectedTaskIds of [[], ['pruebas', 'ticket'], TASKS, ['pruebas', 'pruebas', 'ticket'], ['pruebas', 'ticket', 'inventada']]) {
      assertInvalid(() => submit(state, '2.4', { kind: 'prioritization', selectedTaskIds }), selectedTaskIds.join(','));
    }
  });
});

/* ------------------------------------------------------------------ */
/* Emparejamiento                                                      */
/* ------------------------------------------------------------------ */

describe('mini-juego: emparejar error con solución (3.2)', () => {
  const state = reach('3.2');
  const KEY: Readonly<Record<string, string>> = {
    duplicado: 'sol-desactivar',
    envio: 'sol-sumar-envio',
    historial: 'sol-mensaje-vacio',
    correo: 'sol-correo-inmediato',
  };
  const PROBLEMS = Object.keys(KEY);
  const SOLUTIONS = Object.values(KEY);

  /** Todas las asignaciones parciales sin repetir solución: 1 + 16 + 72 + 96 + 24 = 209. */
  function partialMatchings(): Record<string, string>[] {
    let boards: { matches: Record<string, string>; used: Set<string> }[] = [{ matches: {}, used: new Set() }];
    for (const problem of PROBLEMS) {
      boards = boards.flatMap((board) => [
        board,
        ...SOLUTIONS.filter((solution) => !board.used.has(solution)).map((solution) => ({
          matches: { ...board.matches, [problem]: solution },
          used: new Set([...board.used, solution]),
        })),
      ]);
    }
    return boards.map((board) => board.matches);
  }

  it('las 209 jugadas posibles suman +2 desempeño, +2 análisis y +1 detalle por acierto', () => {
    const matchings = partialMatchings();
    assert.equal(matchings.length, 209);
    for (const matches of matchings) {
      const correct = PROBLEMS.filter((problem) => matches[problem] === KEY[problem]).length;
      const tier = correct >= 4 ? 'emparejamiento-perfecto' : correct >= 2 ? 'emparejamiento-parcial' : 'emparejamiento-bajo';
      const complete = Object.keys(matches).length === PROBLEMS.length;
      for (const timedOut of complete ? [false, true] : [true]) {
        const { outcome } = submit(state, '3.2', { kind: 'matching', matches, timedOut });
        assert.equal(outcome.outcomeId, tier, JSON.stringify(matches));
        assert.equal(outcome.performanceDelta, 2 * correct);
        assert.deepEqual(outcome.affinityDelta, correct ? { analytical: 2 * correct, detail: correct } : {});
        assert.equal(outcome.detail.kind === 'matching' && outcome.detail.correctCount, correct);
        assertConsequence(outcome);
      }
      if (!complete) assertInvalid(() => submit(state, '3.2', { kind: 'matching', matches, timedOut: false }));
    }
  });

  it('rechaza soluciones repetidas o inexistentes', () => {
    assertInvalid(() => submit(state, '3.2', { kind: 'matching', timedOut: true, matches: { duplicado: 'sol-desactivar', envio: 'sol-desactivar' } }));
    assertInvalid(() => submit(state, '3.2', { kind: 'matching', timedOut: true, matches: { duplicado: 'sol-inventada' } }));
    assertInvalid(() => submit(state, '3.2', { kind: 'matching', timedOut: true, matches: { inventado: 'sol-desactivar' } }));
  });
});

/* ------------------------------------------------------------------ */
/* Decisión en vivo                                                    */
/* ------------------------------------------------------------------ */

describe('mini-juego: decisión de lanzamiento en vivo (3.3)', () => {
  const state = reach('3.3');
  const band = (performance: number) => (performance >= 70 ? 0 : performance >= 50 ? 1 : 2);
  const BASELINE = [78, 64, 48];
  const RESULTS: Readonly<Record<string, readonly { id: string; pct: number; performance: number }[]>> = {
    lanzar: [
      { id: 'lanzamiento-exitoso', pct: 91, performance: 4 },
      { id: 'lanzamiento-mixto', pct: 70, performance: 1 },
      { id: 'lanzamiento-dificil', pct: 42, performance: -3 },
    ],
    esperar: [
      { id: 'lanzamiento-pospuesto', pct: 63, performance: 0 },
      { id: 'lanzamiento-pospuesto', pct: 63, performance: 0 },
      { id: 'lanzamiento-pospuesto', pct: 63, performance: 0 },
    ],
    'por-partes': [
      { id: 'lanzamiento-gradual-exitoso', pct: 88, performance: 3 },
      { id: 'lanzamiento-gradual', pct: 77, performance: 3 },
      { id: 'lanzamiento-gradual-contenido', pct: 61, performance: 1 },
    ],
  };

  it('el dashboard y el resultado dependen del desempeño acumulado en cada umbral', () => {
    for (const performance of [0, 1, 49, 50, 51, 69, 70, 71, 99, 100]) {
      const before = { ...state, performance };
      const scene = getPublicScene(module, before)!;
      assert.ok(scene.interaction.kind === 'live-decision');
      assert.equal(scene.interaction.baseline.positivePct, BASELINE[band(performance)], `línea base con ${performance}`);
      for (const [optionId, results] of Object.entries(RESULTS)) {
        const want = results[band(performance)]!;
        const { outcome, state: next } = submit(before, '3.3', { kind: 'live-decision', optionId });
        assert.equal(outcome.outcomeId, want.id, `${optionId} con ${performance}`);
        assert.equal(outcome.performanceAfter, Math.min(100, Math.max(0, performance + want.performance)));
        assert.ok(outcome.detail.kind === 'live-decision');
        assert.equal(outcome.detail.dashboard.positivePct, want.pct);
        assert.equal(next.flags.launchDecision, optionId);
        assert.equal(getPublicScene(module, next)!.hud.launchWindow?.closed, true);
        assertConsequence(outcome);
      }
    }
  });

  it('llegar mejor preparado nunca empeora el dashboard de una misma opción', () => {
    for (const results of Object.values(RESULTS)) {
      assert.ok(results[0]!.pct >= results[1]!.pct && results[1]!.pct >= results[2]!.pct);
    }
  });

  it('rechaza opciones que no existen', () => {
    assertInvalid(() => submit(state, '3.3', { kind: 'live-decision', optionId: 'cancelar' }));
    assertInvalid(() => submit(state, '3.3', { kind: 'dialogue', optionId: 'lanzar' }));
  });
});

/* ------------------------------------------------------------------ */
/* Partidas aleatorias completas (todos los módulos registrados)       */
/* ------------------------------------------------------------------ */

type Player = { random: () => number; skill: number };

/** Respuesta válida al azar; con probabilidad `skill` usa la clave correcta del guión. */
function randomResponse(interaction: Interaction, { random, skill }: Player): SceneResponse {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
  const skilled = () => random() < skill;
  switch (interaction.kind) {
    case 'none':
    case 'summary':
    case 'timeline':
      return CONTINUE;
    case 'dialogue':
      if (interaction.timeoutOutcome && random() < 0.2) return { kind: 'timeout' };
      return { kind: 'dialogue', optionId: pick(interaction.options).id };
    case 'classification': {
      const timedOut = random() < 0.3;
      const assignments: Record<string, string> = {};
      for (const item of interaction.items) {
        if (timedOut && random() < 0.4) continue;
        assignments[item.id] = skilled() ? item.correctCategoryId : pick(interaction.categories).id;
      }
      return { kind: 'classification', assignments, timedOut };
    }
    case 'message-builder': {
      if (interaction.emptyOption && random() < 0.15) return { kind: 'message-builder', blockIds: [] };
      const size = interaction.minBlocks + Math.floor(random() * (interaction.maxBlocks - interaction.minBlocks + 1));
      return { kind: 'message-builder', blockIds: shuffle(interaction.blocks.map((block) => block.id), random).slice(0, size) };
    }
    case 'sequence':
      return skilled()
        ? { kind: 'sequence', ...interaction.answer }
        : { kind: 'sequence', candidateId: pick(interaction.candidates).id, slot: Math.floor(random() * (interaction.steps.length + 1)) };
    case 'prioritization':
      return { kind: 'prioritization', selectedTaskIds: shuffle(interaction.tasks.map((task) => task.id), random).slice(0, interaction.slots) };
    case 'matching': {
      const timedOut = random() < 0.3;
      const solutions = shuffle(interaction.solutions.map((solution) => solution.id), random);
      const matches: Record<string, string> = {};
      for (const [index, problem] of interaction.problems.entries()) {
        if (timedOut && random() < 0.4) continue;
        const wanted = interaction.answer[problem.id]!;
        const solution = skilled() && !Object.values(matches).includes(wanted) ? wanted : solutions[index]!;
        if (!Object.values(matches).includes(solution)) matches[problem.id] = solution;
      }
      const complete = Object.keys(matches).length === interaction.problems.length;
      return { kind: 'matching', matches, timedOut: timedOut || !complete };
    }
    case 'live-decision':
      return { kind: 'live-decision', optionId: pick(interaction.options).id };
  }
}

/** Ids de todos los resultados que declara un módulo. */
function declaredOutcomes(careerModule: CareerModule): Set<string> {
  const ids = new Set<string>();
  for (const scene of careerModule.sessions.flatMap((session) => session.scenes)) {
    const interaction = scene.interaction;
    const add = (id: string | undefined) => id && ids.add(`${scene.id}:${id}`);
    switch (interaction.kind) {
      case 'none':
        add(interaction.outcome?.id);
        break;
      case 'dialogue':
        interaction.options.forEach((option) => add(option.outcome.id));
        add(interaction.timeoutOutcome?.id);
        break;
      case 'classification':
        interaction.tiers.forEach((tier) => add(tier.outcome.id));
        break;
      case 'message-builder':
        interaction.rules.forEach((rule) => add(rule.outcome.id));
        break;
      case 'sequence':
        add(interaction.outcomes.correct.id);
        add(interaction.outcomes.incorrect.id);
        break;
      case 'prioritization':
        add(interaction.outcome.id);
        break;
      case 'matching':
        interaction.results.forEach((result) => add(result.outcome.id));
        break;
      case 'live-decision':
        interaction.options.forEach((option) => option.results.forEach((result) => add(result.outcome.id)));
        break;
      case 'summary':
      case 'timeline':
        break;
    }
  }
  return ids;
}

const SECRETS = ['"correctCategoryId"', '"answer"', '"tags"', '"outcome"', '"outcomes"', '"tiers"', '"rules"', '"results"', '"perMatch"', '"timeoutOutcome"'];

for (const careerModule of Object.values(MODULES)) {
  describe(`partidas aleatorias: ${careerModule.title}`, () => {
    it('600 partidas con respuestas al azar terminan el módulo sin romper ninguna regla', () => {
      const random = seeded(20260926);
      const reached = new Set<string>();
      const decisionScenes = careerModule.sessions.flatMap((session) => session.scenes).filter((scene) => !['none', 'summary', 'timeline'].includes(scene.interaction.kind)).length;
      for (let run = 0; run < 600; run += 1) {
        const player: Player = { random, skill: random() };
        let state = createInitialState(careerModule, { playerName: `Jugador ${run}`, now: NOW });
        for (let step = 0; state.status !== 'completed'; step += 1) {
          assert.ok(step < 200, 'la partida no avanza');
          if (!currentSceneDefinition(careerModule, state)) {
            state = startSession(careerModule, state, { sessionIndex: state.sessionIndex, now: NOW });
          }
          const { scene } = currentSceneDefinition(careerModule, state)!;
          const publicScene = getPublicScene(careerModule, state)!;
          const serialized = JSON.stringify(publicScene);
          for (const secret of SECRETS) assert.ok(!serialized.includes(secret), `${scene.id} expone ${secret}`);
          assert.ok(!serialized.includes('{nombre}'), `${scene.id}: {nombre} sin reemplazar`);
          assert.ok(publicScene.lines.every((line) => line.text.trim().length > 0), `${scene.id}: línea vacía`);

          const response = randomResponse(scene.interaction, player);
          const elapsedMs = Math.floor(random() * 90_000);
          const applied = applySceneResponse(careerModule, state, { sceneId: scene.id, response, elapsedMs, now: NOW });
          if (applied.outcome.detail.kind !== 'continue') assertConsequence(applied.outcome);
          reached.add(`${scene.id}:${applied.outcome.outcomeId}`);
          state = applied.state;

          assert.ok(state.performance >= 0 && state.performance <= 100);
          const complaints = state.flags.complaints;
          assert.ok(complaints === undefined || (typeof complaints === 'number' && complaints >= 0 && complaints <= 999));
          const window = state.flags.launchWindowSeconds;
          assert.ok(window === undefined || (typeof window === 'number' && window >= 0));
        }
        assert.equal(state.log.length, decisionScenes, 'cada decisión queda registrada una vez');
        assert.ok(state.sessions.every((session) => session.status === 'completed'));
        assert.ok(progressSnapshot(careerModule, state).alignedBranchId, 'siempre hay un camino resaltado');
      }
      const missing = [...declaredOutcomes(careerModule)].filter((id) => !reached.has(id));
      assert.deepEqual(missing, [], 'todos los resultados del guión son alcanzables');
    });
  });
}
