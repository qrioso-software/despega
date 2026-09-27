import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  COMPLAINT_INTERVAL_MS,
  SimulationError,
  applySceneResponse,
  createInitialState,
  getPublicScene,
  progressSnapshot,
  startSession,
} from './engine.ts';
import { ingenieriaSoftware as module } from './modules/ingenieria-software.ts';
import type { SceneResponse, SimulationState } from './types.ts';
import { validateModule } from './validation.ts';

const NOW = '2026-09-26T12:00:00.000Z';

function fresh(): SimulationState {
  return createInitialState(module, { playerName: 'Ana', now: NOW });
}

function play(state: SimulationState, sceneId: string, response: SceneResponse, elapsedMs = 1_000) {
  return applySceneResponse(module, state, { sceneId, response, elapsedMs, now: NOW });
}

function begin(state: SimulationState): SimulationState {
  return startSession(module, state, { sessionIndex: state.sessionIndex, now: NOW });
}

const CONTINUE: SceneResponse = { kind: 'continue' };

const BEST_SESSION_1: [string, SceneResponse][] = [
  ['1.1', CONTINUE],
  ['1.2', { kind: 'dialogue', optionId: 'revisar' }],
  ['1.3', { kind: 'classification', timedOut: false, assignments: { 'wifi-publico': 'lenta', fibra: 'rapida', 'datos-debiles': 'lenta', 'mala-senal': 'lenta' } }],
  ['1.4', { kind: 'dialogue', optionId: 'espera' }],
  ['1.5', { kind: 'message-builder', blockIds: ['estado', 'compromiso', 'apoyo'] }],
  ['1.6', CONTINUE],
  ['1.7', CONTINUE],
];

const BEST_SESSION_2: [string, SceneResponse][] = [
  ['2.1', { kind: 'sequence', candidateId: 'carga', slot: 1 }],
  ['2.2', { kind: 'dialogue', optionId: 'grupo' }],
  ['2.3', { kind: 'message-builder', blockIds: ['reconoce', 'prueba'] }],
  ['2.4', { kind: 'prioritization', selectedTaskIds: ['pruebas', 'ticket', 'diseno'] }],
  ['2.5', CONTINUE],
  ['2.6', CONTINUE],
];

const BEST_SESSION_3: [string, SceneResponse][] = [
  ['3.1', CONTINUE],
  ['3.2', { kind: 'matching', timedOut: false, matches: { duplicado: 'sol-desactivar', envio: 'sol-sumar-envio', historial: 'sol-mensaje-vacio', correo: 'sol-correo-inmediato' } }],
  ['3.3', { kind: 'live-decision', optionId: 'lanzar' }],
  ['3.4', { kind: 'dialogue', optionId: 'investigar' }],
  ['3.5', CONTINUE],
  ['3.6', CONTINUE],
];

function playSession(state: SimulationState, steps: [string, SceneResponse][]): SimulationState {
  let current = begin(state);
  for (const [sceneId, response] of steps) current = play(current, sceneId, response).state;
  return current;
}

describe('módulo Ingeniería de Software', () => {
  it('es un módulo válido y completo', () => {
    assert.deepEqual(validateModule(module), []);
    assert.equal(module.sessions.length, 3);
  });

  it('arranca en 50 puntos con solo la sesión 1 disponible', () => {
    const state = fresh();
    assert.equal(state.performance, 50);
    assert.deepEqual(state.sessions.map((session) => session.status), ['available', 'locked', 'locked']);
    assert.equal(getPublicScene(module, state), null, 'la sesión no empieza sola');
  });

  it('recorre el mejor camino y cierra el módulo', () => {
    let state = playSession(fresh(), BEST_SESSION_1);
    assert.equal(state.performance, 69);
    assert.deepEqual(state.sessions.map((session) => session.status), ['completed', 'available', 'locked']);

    state = playSession(state, BEST_SESSION_2);
    assert.equal(state.performance, 79);

    const beforeLaunch = state;
    state = playSession(beforeLaunch, BEST_SESSION_3);
    assert.equal(state.status, 'completed');
    assert.equal(state.performance, 91);
    assert.deepEqual(state.affinity, { analytical: 36, communication: 10, detail: 10, pressure: 2, structure: 4 });

    const snapshot = progressSnapshot(module, state);
    assert.equal(snapshot.completedSessions, 3);
    assert.equal(snapshot.currentSessionNumber, null);
    // Comunicación 10/14 supera el promedio de detalle 10/15 y estructura 4/6.
    assert.equal(snapshot.alignedBranchId, 'leadership');

    // Liberar por partes suma estructura y el perfil pasa a alinearse con el camino técnico.
    const gradual = playSession(beforeLaunch, BEST_SESSION_3.map(([sceneId, response]) => [
      sceneId,
      sceneId === '3.3' ? { kind: 'live-decision', optionId: 'por-partes' } : response,
    ]));
    assert.equal(gradual.performance, 90);
    assert.equal(progressSnapshot(module, gradual).alignedBranchId, 'technical');
  });

  it('nunca bloquea el progreso: el peor camino también termina el módulo', () => {
    let state = playSession(fresh(), [
      ['1.1', CONTINUE],
      ['1.2', { kind: 'dialogue', optionId: 'intentar' }],
      ['1.3', { kind: 'classification', timedOut: true, assignments: {} }],
      ['1.4', { kind: 'timeout' }],
      ['1.5', { kind: 'message-builder', blockIds: ['no-se', 'relax'] }],
      ['1.6', CONTINUE],
      ['1.7', CONTINUE],
    ]);
    assert.equal(state.performance, 41);
    state = playSession(state, [
      ['2.1', { kind: 'sequence', candidateId: 'color', slot: 3 }],
      ['2.2', { kind: 'timeout' }],
      ['2.3', { kind: 'message-builder', blockIds: [] }],
      ['2.4', { kind: 'prioritization', selectedTaskIds: ['documentacion', 'ticket', 'diseno'] }],
      ['2.5', CONTINUE],
      ['2.6', CONTINUE],
    ]);
    assert.equal(state.performance, 35);
    assert.equal(state.flags.s2Release, 'now');
    assert.equal(state.flags.s2ReleaseDecidedBy, 'andres');
    state = playSession(state, [
      ['3.1', CONTINUE],
      ['3.2', { kind: 'matching', timedOut: true, matches: {} }],
      ['3.3', { kind: 'live-decision', optionId: 'lanzar' }],
      ['3.4', { kind: 'dialogue', optionId: 'decidir' }],
      ['3.5', CONTINUE],
      ['3.6', CONTINUE],
    ]);
    assert.equal(state.status, 'completed');
    assert.equal(state.performance, 32);
    assert.equal(progressSnapshot(module, state).alignedBranchId, 'independent');
  });

  it('exige empezar la sesión y respetar la escena actual', () => {
    const state = fresh();
    assert.throws(() => play(state, '1.1', CONTINUE), (error: unknown) => error instanceof SimulationError && error.code === 'SESSION_NOT_STARTED');
    const started = begin(state);
    assert.throws(() => play(started, '1.2', { kind: 'dialogue', optionId: 'revisar' }), (error: unknown) => error instanceof SimulationError && error.code === 'SCENE_MISMATCH');
    assert.throws(() => startSession(module, started, { sessionIndex: 1, now: NOW }), (error: unknown) => error instanceof SimulationError && error.code === 'SESSION_LOCKED');
    assert.equal(begin(started), started, 'abrir una sesión en curso es idempotente');
  });

  it('rechaza respuestas que no corresponden a la escena', () => {
    let state = play(begin(fresh()), '1.1', CONTINUE).state;
    assert.throws(() => play(state, '1.2', { kind: 'dialogue', optionId: 'no-existe' }), /opción/);
    assert.throws(() => play(state, '1.2', { kind: 'timeout' }), /tiempo límite/);
    state = play(state, '1.2', { kind: 'dialogue', optionId: 'revisar' }).state;
    assert.throws(
      () => play(state, '1.3', { kind: 'classification', timedOut: false, assignments: { fibra: 'rapida' } }),
      /Clasifica todas/,
    );
  });

  it('la clasificación de 1.3 decide si 1.4 empieza con pista', () => {
    const base = play(play(begin(fresh()), '1.1', CONTINUE).state, '1.2', { kind: 'dialogue', optionId: 'revisar' }).state;

    const clear = play(base, '1.3', { kind: 'classification', timedOut: false, assignments: { 'wifi-publico': 'lenta', fibra: 'rapida', 'datos-debiles': 'lenta', 'mala-senal': 'rapida' } });
    assert.equal(clear.outcome.outcomeId, 'patron-claro');
    assert.deepEqual(clear.outcome.affinityDelta, { analytical: 6, detail: 2 });
    const withClue = getPublicScene(module, clear.state)!;
    assert.equal(withClue.interaction.kind === 'dialogue' && withClue.interaction.hint !== undefined, true);
    assert.match(withClue.lines[0]!.text, /conexión lenta/);

    const partial = play(base, '1.3', { kind: 'classification', timedOut: true, assignments: { fibra: 'rapida' } });
    assert.equal(partial.outcome.outcomeId, 'patron-parcial');
    assert.equal(partial.outcome.timedOut, true);

    const none = play(base, '1.3', { kind: 'classification', timedOut: true, assignments: {} });
    assert.equal(none.outcome.outcomeId, 'sin-patron');
    assert.equal(none.outcome.performanceDelta, -2);
    const withoutClue = getPublicScene(module, none.state)!;
    assert.equal(withoutClue.interaction.kind === 'dialogue' && withoutClue.interaction.hint, undefined);
    assert.match(withoutClue.lines[0]!.text, /No tenemos una pista/);
  });

  it('las quejas suben con el tiempo y se detienen con el diagnóstico correcto', () => {
    let state = begin(fresh());
    state = play(state, '1.1', CONTINUE, COMPLAINT_INTERVAL_MS * 4).state;
    assert.equal(state.flags.complaints, 9);
    state = play(state, '1.2', { kind: 'dialogue', optionId: 'revisar' }, COMPLAINT_INTERVAL_MS * 2).state;
    state = play(state, '1.3', { kind: 'classification', timedOut: true, assignments: {} }, COMPLAINT_INTERVAL_MS * 15).state;
    assert.equal(state.flags.complaints, 26);
    state = play(state, '1.4', { kind: 'dialogue', optionId: 'espera' }, COMPLAINT_INTERVAL_MS * 3).state;
    assert.equal(state.flags.complaints, 29, 'las quejas de los 15 segundos de decisión sí llegaron');
    assert.equal(state.flags.complaintsTrend, 'stopped');
    state = play(state, '1.5', { kind: 'message-builder', blockIds: ['estado', 'compromiso'] }, COMPLAINT_INTERVAL_MS * 10).state;
    assert.equal(state.flags.complaints, 29, 'ya no suben');
    assert.deepEqual(getPublicScene(module, state)!.hud.complaints, { count: 29, rising: false });
  });

  it('la construcción de mensajes aplica las reglas del guión', () => {
    let state = playSession(fresh(), BEST_SESSION_1);
    state = begin(state);
    state = play(state, '2.1', { kind: 'sequence', candidateId: 'carga', slot: 2 }).state;
    assert.equal(state.flags.s2Review, 'missed', 'la posición también importa');
    state = play(state, '2.2', { kind: 'dialogue', optionId: 'esperar' }).state;

    const onlyCritique = play(state, '2.3', { kind: 'message-builder', blockIds: ['error-basico', 'esperaba-mas'] });
    assert.equal(onlyCritique.outcome.outcomeId, 'feedback-solo-critica');
    assert.equal(onlyCritique.outcome.reactions[0]!.mood, 'defensive');

    const mixed = play(state, '2.3', { kind: 'message-builder', blockIds: ['reconoce', 'error-basico', 'prueba'] });
    assert.equal(mixed.outcome.outcomeId, 'feedback-mixto');

    const proposals = play(state, '2.3', { kind: 'message-builder', blockIds: ['prueba', 'equipo'] });
    assert.equal(proposals.outcome.outcomeId, 'feedback-constructivo');

    const silence = play(state, '2.3', { kind: 'message-builder', blockIds: [] });
    assert.deepEqual(silence.outcome.affinityDelta, { communication: -3 });

    assert.throws(() => play(state, '2.3', { kind: 'message-builder', blockIds: ['reconoce'] }), /entre 2 y 3/);
    assert.throws(() => play(state, '2.3', { kind: 'message-builder', blockIds: ['reconoce', 'reconoce'] }), /una sola vez/);
  });

  it('la tarea descartada en 2.4 reaparece en la sesión 3', () => {
    let state = playSession(fresh(), BEST_SESSION_1);
    state = playSession(state, BEST_SESSION_2);
    assert.equal(state.flags.s2Discarded, 'documentacion');
    state = begin(state);
    const opening = getPublicScene(module, state)!;
    assert.ok(opening.lines.some((line) => line.text.includes('Josué')));
    assert.ok(opening.lines.some((line) => line.text.includes('grupo pequeño')), 'también recuerda la decisión de 2.2');
  });

  it('el emparejamiento suma por cada acierto', () => {
    let state = playSession(fresh(), BEST_SESSION_1);
    state = playSession(state, BEST_SESSION_2);
    state = play(begin(state), '3.1', CONTINUE).state;
    const result = play(state, '3.2', { kind: 'matching', timedOut: true, matches: { duplicado: 'sol-desactivar', envio: 'sol-sumar-envio', historial: 'sol-correo-inmediato' } });
    assert.equal(result.outcome.outcomeId, 'emparejamiento-parcial');
    assert.equal(result.outcome.performanceDelta, 4);
    assert.deepEqual(result.outcome.affinityDelta, { analytical: 4, detail: 2 });
    assert.throws(
      () => play(state, '3.2', { kind: 'matching', timedOut: true, matches: { duplicado: 'sol-desactivar', envio: 'sol-desactivar' } }),
      /inválido/,
    );
  });

  it('el dashboard final depende del desempeño acumulado', () => {
    let state = playSession(fresh(), BEST_SESSION_1);
    state = playSession(state, BEST_SESSION_2);
    state = play(begin(state), '3.1', CONTINUE, 120_000).state;
    assert.equal(getPublicScene(module, state)!.hud.launchWindow?.seconds, 28 * 60 - 120);
    state = play(state, '3.2', { kind: 'matching', timedOut: true, matches: {} }, 60_000).state;

    const strong = play({ ...state, performance: 80 }, '3.3', { kind: 'live-decision', optionId: 'lanzar' }, 0);
    const weak = play({ ...state, performance: 40 }, '3.3', { kind: 'live-decision', optionId: 'lanzar' });
    assert.ok(strong.outcome.detail.kind === 'live-decision' && strong.outcome.detail.dashboard.positivePct > 80);
    assert.ok(weak.outcome.detail.kind === 'live-decision' && weak.outcome.detail.dashboard.positivePct < 50);
    assert.equal(weak.outcome.performanceDelta, -3);

    const hud = getPublicScene(module, strong.state)!.hud.launchWindow;
    assert.deepEqual(hud, { seconds: 28 * 60 - 180, closed: true });
  });

  it('la escena pública no revela respuestas ni puntajes', () => {
    let state = playSession(fresh(), BEST_SESSION_1);
    state = begin(state);
    const scenes = [getPublicScene(module, state)];
    state = play(state, '2.1', { kind: 'sequence', candidateId: 'carga', slot: 1 }).state;
    scenes.push(getPublicScene(module, state));
    const serialized = JSON.stringify(scenes);
    for (const secret of ['"answer"', '"outcome"', '"tags"', '"correctCategoryId"', '"performance":', '"affinity"']) {
      assert.equal(serialized.includes(secret), false, `no debe incluir ${secret}`);
    }
  });

  it('el resumen de sesión normaliza la afinidad y anuncia la siguiente sesión', () => {
    let state = begin(fresh());
    for (const [sceneId, response] of BEST_SESSION_1.slice(0, -1)) state = play(state, sceneId, response).state;
    const summary = getPublicScene(module, state)!;
    assert.equal(summary.interaction.kind, 'summary');
    if (summary.interaction.kind !== 'summary') return;
    const { affinity, nextSession, highlights, performanceStart } = summary.interaction.summary;
    assert.equal(performanceStart, 50);
    assert.deepEqual(nextSession, { number: 2, title: 'El código no miente' });
    assert.equal(highlights.length, 4);
    for (const value of Object.values(affinity.normalized)) assert.ok(value >= 0 && value <= 100);
    assert.equal(affinity.normalized.analytical, 100);
  });

  it('usa el nombre del estudiante como protagonista', () => {
    const state = play(begin(fresh()), '1.1', CONTINUE).state;
    assert.match(getPublicScene(module, state)!.lines[0]!.text, /Hola, Ana\./);
    assert.equal(createInitialState(module, { playerName: '   ', now: NOW }).playerName, 'practicante');
  });
});
