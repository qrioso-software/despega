import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialState, ingenieriaSoftware } from '@despega/simulator';
import { DataConfigurationError, dataConfigFromEnv } from './config.ts';
import { DataError, isConditionalFailure } from './errors.ts';
import { decodeCursor, encodeCursor, keys } from './keys.ts';
import { recordFromState } from './progress.ts';
import { TABLES, physicalTableName } from './schema.ts';

const VALID_ENV = {
  DATA_REGION: 'us-east-1',
  DYNAMODB_ENDPOINT: 'http://localhost:8000',
  DYNAMODB_TABLE_CORE: 'despega_local_core',
  DYNAMODB_TABLE_SIMULATION: 'despega_local_simulation',
};

describe('configuración de datos', () => {
  it('acepta DynamoDB Local y tablas explícitas', () => {
    assert.deepEqual(dataConfigFromEnv(VALID_ENV), {
      region: 'us-east-1',
      endpoint: 'http://localhost:8000',
      tables: { core: 'despega_local_core', simulation: 'despega_local_simulation' },
    });
  });

  it('usa el endpoint regional cuando no hay endpoint local', () => {
    assert.equal(dataConfigFromEnv({ ...VALID_ENV, DYNAMODB_ENDPOINT: '' }).endpoint, undefined);
  });

  it('rechaza endpoints remotos y configuraciones incompletas', () => {
    assert.throws(() => dataConfigFromEnv({ ...VALID_ENV, DYNAMODB_ENDPOINT: 'https://evil.example' }), DataConfigurationError);
    assert.throws(() => dataConfigFromEnv({ ...VALID_ENV, DATA_REGION: 'nowhere' }), DataConfigurationError);
    assert.throws(() => dataConfigFromEnv({ ...VALID_ENV, DYNAMODB_TABLE_CORE: '' }), DataConfigurationError);
  });
});

describe('claves y esquema', () => {
  it('separa perfil, progreso por carrera y eventos por intento', () => {
    assert.deepEqual(keys.student('abc'), { pk: 'STUDENT#abc', sk: 'PROFILE' });
    assert.deepEqual(keys.progress('abc', 'ingenieria-software'), { pk: 'STUDENT#abc', sk: 'CAREER#ingenieria-software' });
    assert.deepEqual(keys.event('run-1', 7), { pk: 'RUN#run-1', sk: 'EVENT#000007' });
  });

  it('nombra las tablas por stage', () => {
    assert.equal(physicalTableName('dev', 'core'), 'despega_dev_core');
    assert.equal(physicalTableName('prd', 'simulation'), 'despega_prd_simulation');
    assert.equal(TABLES.simulation.indexes[0].name, 'progress-by-career-index');
  });

  it('el cursor de paginación es opaco y validado', () => {
    const key = { pk: 'STUDENT#abc', sk: 'PROFILE' };
    assert.deepEqual(decodeCursor(encodeCursor(key)), key);
    assert.equal(encodeCursor(undefined), undefined);
    assert.throws(() => decodeCursor('no-es-json'), DataError);
  });
});

describe('registro de progreso', () => {
  it('guarda desempeño y afinidad por carrera junto al estado', () => {
    const state = createInitialState(ingenieriaSoftware, { playerName: 'Ana', now: '2026-09-26T12:00:00.000Z' });
    const record = recordFromState({ studentId: 'abc', runId: 'run-1', attempt: 1, version: 1, state });
    assert.equal(record.careerId, 'ingenieria-software');
    assert.equal(record.performance, 50);
    assert.deepEqual(record.affinity, { analytical: 0, communication: 0, detail: 0, pressure: 0, structure: 0 });
    assert.equal(record.currentSessionNumber, 1);
    assert.equal(record.completedSessions, 0);
    assert.equal(record.previousRunIds, undefined);
  });

  it('reconoce fallos de condición simples y transaccionales', () => {
    const simple = Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' });
    const transaction = Object.assign(new Error('x'), {
      name: 'TransactionCanceledException',
      CancellationReasons: [{ Code: 'None' }, { Code: 'ConditionalCheckFailed' }],
    });
    assert.equal(isConditionalFailure(simple), true);
    assert.equal(isConditionalFailure(transaction), true);
    assert.equal(isConditionalFailure(new Error('otro')), false);
  });
});
