import { KnownSourceDefinition } from './default-sources';
import { createKnownSourceChoices, KnownSourceChoice } from './known-sources';
import { parseSyncConfig } from './sync-config';

export const remoteKnownSourcesUrl =
  'https://raw.githubusercontent.com/gdesordi/dex-ai/main/extension/dex/default-sources.json';

export class RemoteKnownSourcesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoteKnownSourcesError';
  }
}

export class KnownSourcesCatalog {
  private choices: readonly KnownSourceChoice[];

  constructor(fallback: readonly KnownSourceDefinition[]) {
    this.choices = createKnownSourceChoices(fallback);
  }

  getChoices(): readonly KnownSourceChoice[] {
    return this.choices;
  }

  async refresh(fetcher: typeof fetch = fetch): Promise<void> {
    const response = await fetcher(remoteKnownSourcesUrl, {
      headers: { 'User-Agent': 'dex-vscode-extension' },
    });
    if (!response.ok) {
      throw new RemoteKnownSourcesError(
        `o catálogo remoto respondeu com ${response.status} ${response.statusText}`,
      );
    }
    this.choices = createKnownSourceChoices(parseRemoteKnownSources(await response.json()));
  }
}

export function parseRemoteKnownSources(value: unknown): readonly KnownSourceDefinition[] {
  if (!isObject(value) || value.version !== 1 || !Array.isArray(value.sources)) {
    throw new RemoteKnownSourcesError(
      'o catálogo remoto deve conter version 1 e uma lista sources',
    );
  }
  if (value.sources.length === 0) {
    throw new RemoteKnownSourcesError('o catálogo remoto não pode estar vazio');
  }
  const seenIds = new Set<string>();
  const definitions = value.sources.map((entry, index) => {
    if (!isObject(entry)) {
      throw new RemoteKnownSourcesError(`fonte ${index + 1} deve ser um objeto`);
    }
    const label = requireText(entry.label, index, 'label');
    const description = requireText(entry.description, index, 'description');
    const { label: _label, description: _description, ...sourceEntry } = entry;
    const { sources } = parseSyncConfig(
      JSON.stringify({ version: 1, sources: [sourceEntry] }),
    );
    if (seenIds.has(sources[0].id)) {
      throw new RemoteKnownSourcesError(`id duplicado “${sources[0].id}”`);
    }
    seenIds.add(sources[0].id);
    return Object.freeze({ label, description, source: Object.freeze(sources[0]) });
  });
  if (!definitions.some((definition) => definition.source.id === 'dex-ai')) {
    throw new RemoteKnownSourcesError('o catálogo remoto deve conter a fonte dex-ai');
  }
  return Object.freeze(definitions);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireText(value: unknown, index: number, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new RemoteKnownSourcesError(`fonte ${index + 1}, campo “${field}” é obrigatório`);
  }
  return value;
}
