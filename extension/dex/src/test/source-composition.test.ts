import assert from 'node:assert/strict';
import test from 'node:test';
import {
  managedEntriesToReplace,
  newlyDisabledSourceIds,
} from '../source-composition';

test('substitui apenas skills gerenciadas e preserva entradas externas', () => {
  const destination = new Set(['dex-antiga', 'dex-atual', 'skill-local']);
  const managed = managedEntriesToReplace(
    ['dex-antiga', 'dex-atual'],
    ['dex-atual', 'dex-nova'],
  );

  for (const name of managed) destination.delete(name);

  assert.deepEqual([...destination], ['skill-local']);
  assert.deepEqual(
    [...managed].sort(),
    ['dex-antiga', 'dex-atual', 'dex-nova'],
  );
});

test('identifica somente fontes que acabaram de ser desativadas', () => {
  const disabled = newlyDisabledSourceIds(
    [
      { id: 'ativa', enabled: true },
      { id: 'ja-desativada', enabled: false },
      { id: 'continua-ativa', enabled: true },
    ],
    [
      { id: 'ativa', enabled: false },
      { id: 'ja-desativada', enabled: false },
      { id: 'continua-ativa', enabled: true },
    ],
  );

  assert.deepEqual(disabled, ['ativa']);
});
