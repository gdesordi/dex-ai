import assert from 'node:assert/strict';
import test from 'node:test';
import { knownSourceChoices } from '../known-sources';

test('mantém Dex primeiro, GCT configurada e a fonte personalizada por último', () => {
  assert.deepEqual(
    knownSourceChoices.map((choice) => choice.sourceType),
    ['dex', 'gct', 'custom'],
  );
  assert.equal(knownSourceChoices[0].label, 'Dex AI');
  assert.equal(knownSourceChoices.at(-1)?.label, 'Fonte de skills personalizada');

  const gct = knownSourceChoices.find((choice) => choice.sourceType === 'gct');
  assert.ok(gct && 'source' in gct);
  assert.deepEqual(gct.source, {
    id: 'gct',
    repository: 'https://github.com/sordi-totvs/gct-resources',
    ref: 'main',
    path: 'skills',
    enabled: true,
  });
});
