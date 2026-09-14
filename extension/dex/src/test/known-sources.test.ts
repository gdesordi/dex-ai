import assert from 'node:assert/strict';
import test from 'node:test';
import { knownSourceChoices } from '../known-sources';

test('mantém os catálogos conhecidos e a fonte personalizada por último', () => {
  assert.deepEqual(
    knownSourceChoices.map((choice) => choice.sourceType),
    ['dex', 'known', 'known', 'known', 'known', 'custom'],
  );
  assert.equal(knownSourceChoices[0].label, 'Dex AI');
  assert.equal(knownSourceChoices.at(-1)?.label, 'Fonte de skills personalizada');

  const gct = knownSourceChoices.find(
    (choice) => 'source' in choice && choice.source.id === 'gct',
  );
  assert.ok(gct && 'source' in gct);
  assert.deepEqual(gct.source, {
    id: 'gct',
    repository: 'https://github.com/sordi-totvs/gct-resources',
    ref: 'main',
    path: 'skills',
    agentsPath: 'agents',
    enabled: true,
  });

  const gctStaging = knownSourceChoices.find(
    (choice) => 'source' in choice && choice.source.id === 'gct-staging',
  );
  assert.ok(gctStaging && 'source' in gctStaging);
  assert.deepEqual(gctStaging.source, {
    id: 'gct-staging',
    repository: 'https://github.com/sordi-totvs/gct-resources',
    ref: 'staging',
    path: 'skills',
    agentsPath: 'agents',
    enabled: true,
  });

  const advplTlpp = knownSourceChoices.find(
    (choice) => 'source' in choice && choice.source.id === 'engpro-advpl-tlpp',
  );
  assert.ok(advplTlpp && 'source' in advplTlpp);
  assert.deepEqual(advplTlpp.source, {
    id: 'engpro-advpl-tlpp',
    repository: 'https://github.com/totvs/engpro-advpl-tlpp-skills',
    ref: 'main',
    path: 'skills/advpl-tlpp',
    enabled: true,
  });

  const superpowers = knownSourceChoices.find(
    (choice) => 'source' in choice && choice.source.id === 'engpro-superpowers',
  );
  assert.ok(superpowers && 'source' in superpowers);
  assert.deepEqual(superpowers.source, {
    id: 'engpro-superpowers',
    repository: 'https://github.com/totvs/engpro-advpl-tlpp-skills',
    ref: 'main',
    path: 'skills/superpowers',
    enabled: true,
  });
});
