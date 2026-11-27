import assert from 'node:assert/strict';
import test from 'node:test';
import { ignoredRevisionKey, isSourceRevisionCurrent } from '../source-revision';
import { SourceMetadata, SyncSource } from '../sync-types';

const source: SyncSource = {
  id: 'catalog',
  repository: 'https://github.com/example/catalog',
  ref: 'main',
  path: 'skills',
  enabled: true,
};

const metadata: SourceMetadata = {
  sourceId: source.id,
  repository: source.repository,
  requestedRef: source.ref,
  sourcePath: source.path,
  resolvedCommit: 'a'.repeat(40),
  syncedAt: '2026-08-28T12:00:00.000Z',
  skillCount: 2,
};

test('considera atual somente a mesma origem no mesmo commit', () => {
  assert.equal(
    isSourceRevisionCurrent(source, metadata, metadata.resolvedCommit),
    true,
  );
  assert.equal(
    isSourceRevisionCurrent(source, metadata, 'b'.repeat(40)),
    false,
  );
});

test('detecta mudança de repositório, referência ou caminho', () => {
  for (const changed of [
    { ...source, repository: 'https://github.com/example/other' },
    { ...source, ref: 'develop' },
    { ...source, path: 'catalog/skills' },
  ]) {
    assert.equal(
      isSourceRevisionCurrent(changed, metadata, metadata.resolvedCommit),
      false,
    );
  }
});

test('considera desatualizada metadata ausente ou anterior a sourcePath', () => {
  assert.equal(
    isSourceRevisionCurrent(source, undefined, metadata.resolvedCommit),
    false,
  );
  assert.equal(
    isSourceRevisionCurrent(
      source,
      { ...metadata, sourcePath: undefined },
      metadata.resolvedCommit,
    ),
    false,
  );
});

test('identifica versões ignoradas por workspace, configuração e commit', () => {
  const key = ignoredRevisionKey('file:///workspace', source, 'a'.repeat(40));
  assert.equal(key, ignoredRevisionKey('file:///workspace', { ...source }, 'a'.repeat(40)));
  for (const otherKey of [
    ignoredRevisionKey('file:///other', source, 'a'.repeat(40)),
    ignoredRevisionKey('file:///workspace', source, 'b'.repeat(40)),
    ignoredRevisionKey('file:///workspace', { ...source, ref: 'develop' }, 'a'.repeat(40)),
    ignoredRevisionKey('file:///workspace', { ...source, agentsPath: 'agents' }, 'a'.repeat(40)),
  ]) assert.notEqual(key, otherKey);
});
