import {
  SyncConfig,
  SyncSource,
  defaultDexSource,
  syncConfigVersion,
} from './sync-types';

const sourceIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const invalidGitRefPattern = /[\u0000-\u0020~^:?*[\\]/;

export class SyncConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncConfigError';
  }
}

export function parseSyncConfig(contents: string): SyncConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new SyncConfigError(`JSON inválido: ${detail}`);
  }

  const root = requireObject(parsed, 'a configuração');
  if (root.version !== syncConfigVersion) {
    throw new SyncConfigError(
      `campo “version” inválido; a única versão aceita é ${syncConfigVersion}`,
    );
  }
  if (!Array.isArray(root.sources)) {
    throw new SyncConfigError('campo “sources” deve ser uma lista');
  }

  const seenIds = new Set<string>();
  const sources = root.sources.map((entry, index) => {
    const source = parseSource(entry, index);
    if (seenIds.has(source.id)) {
      throw new SyncConfigError(
        `fonte ${index + 1}, campo “id”: valor duplicado “${source.id}”`,
      );
    }
    seenIds.add(source.id);
    return source;
  });

  return { ...root, version: syncConfigVersion, sources } as SyncConfig;
}

export function serializeSyncConfig(config: SyncConfig): string {
  return `${JSON.stringify(config, undefined, 2)}\n`;
}

export type AddDefaultSourceResult =
  | { status: 'added'; config: SyncConfig }
  | { status: 'already-configured'; sourceId: string }
  | { status: 'id-conflict'; sourceId: string }
  | { status: 'catalog-already-configured'; sourceId: string };

export function addDefaultSource(config: SyncConfig): AddDefaultSourceResult {
  const sameId = config.sources.find((source) => source.id === defaultDexSource.id);
  if (sameId) {
    return sourceMatchesDefaultCatalog(sameId) &&
      sameId.enabled === defaultDexSource.enabled
      ? { status: 'already-configured', sourceId: sameId.id }
      : { status: 'id-conflict', sourceId: sameId.id };
  }

  const sameCatalog = config.sources.find(sourceMatchesDefaultCatalog);
  if (sameCatalog) {
    return { status: 'catalog-already-configured', sourceId: sameCatalog.id };
  }

  return {
    status: 'added',
    config: {
      ...config,
      sources: [...config.sources, { ...defaultDexSource }],
    },
  };
}

function sourceMatchesDefaultCatalog(source: SyncSource): boolean {
  return (
    source.repository === defaultDexSource.repository &&
    source.ref === defaultDexSource.ref &&
    source.path === defaultDexSource.path
  );
}

function parseSource(value: unknown, index: number): SyncSource {
  const label = `fonte ${index + 1}`;
  const source = requireObject(value, label);
  const id = requireString(source.id, label, 'id');
  if (!sourceIdPattern.test(id)) {
    throw new SyncConfigError(
      `${label}, campo “id”: use letras minúsculas, números e hífens`,
    );
  }

  const repository = normalizeGitHubRepository(
    requireString(source.repository, label, 'repository'),
    label,
  );
  const ref = validateGitRef(requireString(source.ref, label, 'ref'), label);
  const path = validateRepositoryPath(
    source.path === undefined
      ? 'skills'
      : requireString(source.path, label, 'path'),
    label,
  );
  const enabled =
    source.enabled === undefined
      ? true
      : requireBoolean(source.enabled, label, 'enabled');

  return { ...source, id, repository, ref, path, enabled } as SyncSource;
}

function normalizeGitHubRepository(value: string, label: string): string {
  let repositoryUrl: URL;
  try {
    repositoryUrl = new URL(value);
  } catch {
    throw new SyncConfigError(
      `${label}, campo “repository”: informe uma URL HTTPS do GitHub`,
    );
  }

  if (
    repositoryUrl.protocol !== 'https:' ||
    repositoryUrl.hostname.toLowerCase() !== 'github.com' ||
    repositoryUrl.username ||
    repositoryUrl.password ||
    repositoryUrl.search ||
    repositoryUrl.hash
  ) {
    throw new SyncConfigError(
      `${label}, campo “repository”: informe uma URL pública HTTPS do GitHub`,
    );
  }

  const segments = repositoryUrl.pathname.split('/').filter(Boolean);
  if (segments.length !== 2) {
    throw new SyncConfigError(
      `${label}, campo “repository”: use https://github.com/<owner>/<repository>`,
    );
  }

  const owner = segments[0];
  const repository = segments[1].endsWith('.git')
    ? segments[1].slice(0, -4)
    : segments[1];
  if (!owner || !repository) {
    throw new SyncConfigError(
      `${label}, campo “repository”: owner e repository são obrigatórios`,
    );
  }

  return `https://github.com/${owner}/${repository}`;
}

function validateGitRef(value: string, label: string): string {
  if (
    invalidGitRefPattern.test(value) ||
    value === '@' ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.endsWith('.') ||
    value.includes('..') ||
    value.includes('//') ||
    value.includes('@{')
  ) {
    throw new SyncConfigError(`${label}, campo “ref”: referência Git inválida`);
  }
  return value;
}

function validateRepositoryPath(value: string, label: string): string {
  if (value.startsWith('/') || value.includes('\\')) {
    throw new SyncConfigError(
      `${label}, campo “path”: use um caminho POSIX relativo`,
    );
  }

  const segments = value.split('/');
  if (
    segments.length === 0 ||
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new SyncConfigError(
      `${label}, campo “path”: segmentos vazios, “.” e “..” não são permitidos`,
    );
  }
  return segments.join('/');
}

function requireObject(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SyncConfigError(`${label} deve ser um objeto`);
  }
  return value as Record<string, unknown>;
}

function requireString(
  value: unknown,
  label: string,
  field: string,
): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new SyncConfigError(`${label}, campo “${field}”: texto obrigatório`);
  }
  return value;
}

function requireBoolean(
  value: unknown,
  label: string,
  field: string,
): boolean {
  if (typeof value !== 'boolean') {
    throw new SyncConfigError(`${label}, campo “${field}”: use true ou false`);
  }
  return value;
}
