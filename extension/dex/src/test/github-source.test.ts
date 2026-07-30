import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FetchLike,
  GitHubSourceError,
  GitHubSourceProvider,
  validateRemotePath,
} from '../github-source';
import { SyncSource } from '../sync-types';

const source: SyncSource = {
  id: 'example',
  repository: 'https://github.com/example/skills',
  ref: 'main',
  path: 'skills',
  enabled: true,
};

test('resolve commit, filtra a pasta e baixa arquivos pelo commit', async () => {
  const calls: string[] = [];
  const fetcher: FetchLike = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/commits/')) {
      return jsonResponse({ sha: 'a'.repeat(40) });
    }
    if (url.includes('/git/trees/')) {
      return jsonResponse({
        tree: [
          { path: 'skills/alpha/SKILL.md', type: 'blob' },
          { path: 'outside.txt', type: 'blob' },
        ],
      });
    }
    return new Response('---\nname: alpha\ndescription: Alpha\n---\n');
  };

  const result = await new GitHubSourceProvider(fetcher).download(source);
  assert.equal(result.resolvedCommit, 'a'.repeat(40));
  assert.deepEqual([...result.files.keys()], ['alpha/SKILL.md']);
  assert.equal(calls.length, 3);
  assert.match(calls[2], new RegExp(`/[a]{40}/skills/alpha/SKILL.md$`));
});

test('distingue rate limit e árvore truncada', async () => {
  const rateLimited = new GitHubSourceProvider(async () =>
    new Response('', {
      status: 403,
      headers: { 'x-ratelimit-remaining': '0' },
    }),
  );
  await assert.rejects(
    () => rateLimited.resolveCommit(source),
    (error: unknown) =>
      error instanceof GitHubSourceError && error.code === 'rate-limit',
  );

  const truncated = new GitHubSourceProvider(async (input) => {
    const url = String(input);
    if (url.includes('/commits/')) {
      return jsonResponse({ sha: 'b'.repeat(40) });
    }
    if (url.includes('/git/trees/')) {
      return jsonResponse({ truncated: true, tree: [] });
    }
    return jsonResponse({ id: 1 });
  });
  await assert.rejects(
    () => truncated.download(source),
    (error: unknown) =>
      error instanceof GitHubSourceError && error.code === 'truncated',
  );
});

test('distingue repositório, referência e pasta não encontrados', async () => {
  const missingRepository = new GitHubSourceProvider(async () =>
    new Response('', { status: 404 }),
  );
  await assert.rejects(
    () => missingRepository.resolveCommit(source),
    (error: unknown) =>
      error instanceof GitHubSourceError &&
      error.code === 'repository-not-found' &&
      /repositório example\/skills/.test(error.message),
  );

  const missingRef = new GitHubSourceProvider(async (input) =>
    String(input).includes('/commits/')
      ? new Response('', { status: 404 })
      : jsonResponse({ id: 1 }),
  );
  await assert.rejects(
    () => missingRef.resolveCommit(source),
    (error: unknown) =>
      error instanceof GitHubSourceError && error.code === 'ref-not-found',
  );

  const missingPath = new GitHubSourceProvider(async (input) => {
    const url = String(input);
    if (url.includes('/commits/')) return jsonResponse({ sha: 'c'.repeat(40) });
    if (url.includes('/git/trees/')) return jsonResponse({ tree: [] });
    return jsonResponse({ id: 1 });
  });
  await assert.rejects(
    () => missingPath.download(source),
    (error: unknown) =>
      error instanceof GitHubSourceError && error.code === 'path-not-found',
  );
});

test('rejeita caminhos remotos inseguros', () => {
  for (const path of ['../secret', 'a/../secret', '/absolute', 'a\\b', 'a//b']) {
    assert.throws(
      () => validateRemotePath(path, 'example'),
      (error: unknown) =>
        error instanceof GitHubSourceError && error.code === 'unsafe-path',
    );
  }
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  });
}
