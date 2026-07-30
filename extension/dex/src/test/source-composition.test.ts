import assert from 'node:assert/strict';
import test from 'node:test';
import { managedEntriesToReplace } from '../source-composition';

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
