import assert from 'node:assert/strict';
import test from 'node:test';
import { fallbackKnownSources } from '../default-sources';
import {
  KnownSourcesCatalog,
  parseRemoteKnownSources,
} from '../remote-known-sources';

const document = {
  version: 1,
  sources: [
    {
      id: 'dex-ai',
      label: 'Dex atualizado',
      description: 'Catálogo atualizado',
      repository: 'https://github.com/gdesordi/dex-ai',
      ref: 'main',
      path: 'skills',
      enabled: true,
    },
  ],
};

test('valida o catálogo remoto e preserva dados de apresentação fora da fonte', () => {
  const sources = parseRemoteKnownSources(document);
  assert.equal(sources[0].label, 'Dex atualizado');
  assert.deepEqual(sources[0].source, {
    id: 'dex-ai',
    repository: 'https://github.com/gdesordi/dex-ai',
    ref: 'main',
    path: 'skills',
    enabled: true,
  });
});

test('rejeita catálogo sem Dex AI ou com identificadores duplicados', () => {
  assert.throws(() => parseRemoteKnownSources({ ...document, sources: [] }));
  assert.throws(() => parseRemoteKnownSources({
    ...document,
    sources: [document.sources[0], document.sources[0]],
  }));
});

test('mantém o fallback quando a atualização remota falha', async () => {
  const catalog = new KnownSourcesCatalog(fallbackKnownSources);
  await assert.rejects(() => catalog.refresh(async () => new Response('', { status: 503 })));
  assert.equal(catalog.getChoices()[0].label, 'Dex AI');
  assert.equal(catalog.getChoices().at(-1)?.sourceType, 'custom');
});

test('substitui as fontes conhecidas somente após resposta válida', async () => {
  const catalog = new KnownSourcesCatalog(fallbackKnownSources);
  await catalog.refresh(async () => Response.json(document));
  assert.equal(catalog.getChoices()[0].label, 'Dex atualizado');
  assert.equal(catalog.getChoices().at(-1)?.sourceType, 'custom');
});
