import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SyncConfigError,
  addDefaultSource,
  parseOrCreateSyncConfig,
  parseSyncConfig,
  serializeSyncConfig,
  shouldInitializeSyncConfig,
} from '../sync-config';
import { createDefaultSyncConfig } from '../sync-types';

test('cria a configuração Dex padrão quando o conteúdo está ausente', () => {
  assert.deepEqual(parseOrCreateSyncConfig(undefined), createDefaultSyncConfig());
});

test('aplica defaults e preserva campos desconhecidos', () => {
  const config = parseSyncConfig(
    JSON.stringify({
      version: 1,
      team: 'platform',
      sources: [
        {
          id: 'shared-skills',
          repository: 'https://github.com/example/shared-skills.git/',
          ref: 'release/v1',
          owner: 'developer-experience',
        },
      ],
    }),
  );

  assert.equal(config.team, 'platform');
  assert.deepEqual(config.sources[0], {
    id: 'shared-skills',
    repository: 'https://github.com/example/shared-skills',
    ref: 'release/v1',
    path: 'skills',
    enabled: true,
    owner: 'developer-experience',
  });
  assert.deepEqual(parseSyncConfig(serializeSyncConfig(config)), config);
});

test('aceita uma lista vazia de fontes', () => {
  assert.deepEqual(parseSyncConfig('{"version":1,"sources":[]}').sources, []);
});

test('rejeita versão não suportada e fontes duplicadas', () => {
  assert.throws(
    () => parseSyncConfig('{"version":2,"sources":[]}'),
    /única versão aceita é 1/,
  );
  assert.throws(
    () =>
      parseSyncConfig(
        JSON.stringify({
          version: 1,
          sources: [
            defaultSource('duplicate'),
            defaultSource('duplicate'),
          ],
        }),
      ),
    /valor duplicado “duplicate”/,
  );
});

test('rejeita IDs, URLs e referências inválidas', () => {
  assertInvalidSource({ id: 'Invalid_ID' }, /campo “id”/);
  assertInvalidSource(
    { repository: 'http://github.com/example/skills' },
    /URL pública HTTPS do GitHub/,
  );
  assertInvalidSource(
    { repository: 'https://gitlab.com/example/skills' },
    /URL pública HTTPS do GitHub/,
  );
  assertInvalidSource({ ref: '../main' }, /campo “ref”/);
});

test('rejeita caminhos que podem escapar ou não são POSIX relativos', () => {
  for (const path of ['/skills', '../skills', 'skills/../private', 'a//b', 'a\\b']) {
    assertInvalidSource({ path }, /campo “path”/);
  }
});

test('inicializa somente quando o workspace é confiável e o arquivo não existe', () => {
  assert.equal(shouldInitializeSyncConfig(true, false), true);
  assert.equal(shouldInitializeSyncConfig(true, true), false);
  assert.equal(shouldInitializeSyncConfig(false, false), false);
  assert.equal(shouldInitializeSyncConfig(false, true), false);
});

test('adiciona a fonte padrão preservando a configuração', () => {
  const config = parseSyncConfig(
    JSON.stringify({
      version: 1,
      owner: 'team',
      sources: [defaultSource('existing')],
    }),
  );
  const result = addDefaultSource(config);
  assert.equal(result.status, 'added');
  if (result.status !== 'added') {
    return;
  }
  assert.equal(result.config.owner, 'team');
  assert.deepEqual(result.config.sources.map((item) => item.id), [
    'existing',
    'dex-ai',
  ]);
});

test('não duplica a fonte padrão e detecta conflitos', () => {
  assert.deepEqual(addDefaultSource(createDefaultSyncConfig()), {
    status: 'already-configured',
    sourceId: 'dex-ai',
  });

  const idConflict = createDefaultSyncConfig();
  idConflict.sources[0] = {
    ...idConflict.sources[0],
    repository: 'https://github.com/example/other',
  };
  assert.equal(addDefaultSource(idConflict).status, 'id-conflict');

  const catalogDuplicate = createDefaultSyncConfig();
  catalogDuplicate.sources[0] = { ...catalogDuplicate.sources[0], id: 'renamed' };
  assert.deepEqual(addDefaultSource(catalogDuplicate), {
    status: 'catalog-already-configured',
    sourceId: 'renamed',
  });
});

function assertInvalidSource(
  overrides: Record<string, unknown>,
  expected: RegExp,
): void {
  assert.throws(
    () =>
      parseSyncConfig(
        JSON.stringify({
          version: 1,
          sources: [{ ...defaultSource('valid-source'), ...overrides }],
        }),
      ),
    (error: unknown) => error instanceof SyncConfigError && expected.test(error.message),
  );
}

function defaultSource(id: string): Record<string, unknown> {
  return {
    id,
    repository: 'https://github.com/example/skills',
    ref: 'main',
    path: 'skills',
    enabled: true,
  };
}
