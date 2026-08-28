import assert from 'node:assert/strict';
import test from 'node:test';
import { runInitialSourceSync } from '../initial-source-sync';

test('executa a primeira sincronização e informa sucesso', async () => {
  let calls = 0;
  const result = await runInitialSourceSync(async () => {
    calls += 1;
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { status: 'synced' });
});

test('captura a falha da primeira sincronização sem propagá-la', async () => {
  const failure = new Error('download indisponível');
  const result = await runInitialSourceSync(async () => {
    throw failure;
  });

  assert.deepEqual(result, { status: 'failed', error: failure });
});
