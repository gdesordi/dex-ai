import { SyncSource } from './sync-types';

export interface GitHubTreeEntry {
  path: string;
  type: string;
}

interface GitHubTreeResponse {
  tree?: GitHubTreeEntry[];
  truncated?: boolean;
}

interface GitHubCommitResponse {
  sha?: string;
}

export interface DownloadedCatalog {
  resolvedCommit: string;
  files: Map<string, Uint8Array>;
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class GitHubSourceError extends Error {
  constructor(
    readonly code:
      | 'rate-limit'
      | 'repository-not-found'
      | 'ref-not-found'
      | 'path-not-found'
      | 'file-not-found'
      | 'truncated'
      | 'http'
      | 'unsafe-path',
    message: string,
  ) {
    super(message);
    this.name = 'GitHubSourceError';
  }
}

export class GitHubSourceProvider {
  constructor(private readonly fetcher: FetchLike = fetch) {}

  async resolveCommit(source: SyncSource, signal?: AbortSignal): Promise<string> {
    const { owner, repository } = parseRepository(source.repository);
    const response = await this.fetcher(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${encodeURIComponent(source.ref)}`,
      { headers: githubHeaders(), signal },
    );
    if (response.status === 404) {
      const repositoryResponse = await this.fetcher(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
        { headers: githubHeaders(), signal },
      );
      await requireSuccessfulResponse(
        repositoryResponse,
        source,
        'consultar o repositório',
        'repository-not-found',
        `o repositório ${owner}/${repository} não foi encontrado ou não é público`,
      );
    }
    await requireSuccessfulResponse(
      response,
      source,
      'resolver a referência',
      'ref-not-found',
      `a referência “${source.ref}” não existe em ${owner}/${repository}`,
    );
    const body = (await response.json()) as GitHubCommitResponse;
    if (typeof body.sha !== 'string' || !/^[0-9a-f]{40}$/i.test(body.sha)) {
      throw new GitHubSourceError(
        'http',
        `${source.id}: o GitHub retornou um commit inválido`,
      );
    }
    return body.sha;
  }

  async download(
    source: SyncSource,
    signal?: AbortSignal,
    onProgress?: (completed: number, total: number, path: string) => void,
  ): Promise<DownloadedCatalog> {
    const resolvedCommit = await this.resolveCommit(source, signal);
    const { owner, repository } = parseRepository(source.repository);
    const treeResponse = await this.fetcher(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/trees/${resolvedCommit}?recursive=1`,
      { headers: githubHeaders(), signal },
    );
    await requireSuccessfulResponse(treeResponse, source, 'consultar a árvore');
    const tree = (await treeResponse.json()) as GitHubTreeResponse;
    if (tree.truncated) {
      throw new GitHubSourceError(
        'truncated',
        `${source.id}: a árvore retornada pelo GitHub foi truncada`,
      );
    }

    const prefix = `${source.path}/`;
    const entries = (tree.tree ?? []).filter(
      (entry) => entry.type === 'blob' && entry.path.startsWith(prefix),
    );
    if (entries.length === 0) {
      throw new GitHubSourceError(
        'path-not-found',
        `${source.id}: a pasta “${source.path}” não existe ou não contém arquivos no commit ${resolvedCommit.slice(0, 12)}`,
      );
    }

    const files = new Map<string, Uint8Array>();
    let nextIndex = 0;
    let completed = 0;
    const worker = async (): Promise<void> => {
      while (nextIndex < entries.length) {
        const entry = entries[nextIndex++];
        const relativePath = entry.path.slice(prefix.length);
        validateRemotePath(relativePath, source.id);
        const encodedPath = entry.path.split('/').map(encodeURIComponent).join('/');
        const response = await this.fetcher(
          `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${resolvedCommit}/${encodedPath}`,
          { headers: { 'User-Agent': 'dex-vscode-extension' }, signal },
        );
        await requireSuccessfulResponse(
          response,
          source,
          `baixar ${entry.path}`,
          'file-not-found',
          `o arquivo “${entry.path}” não foi encontrado no commit resolvido`,
        );
        files.set(relativePath, new Uint8Array(await response.arrayBuffer()));
        completed += 1;
        onProgress?.(completed, entries.length, relativePath);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(6, entries.length) }, () => worker()),
    );
    return { resolvedCommit, files };
  }
}

export function validateRemotePath(path: string, sourceId: string): void {
  const segments = path.split('/');
  if (
    path.startsWith('/') ||
    path.includes('\\') ||
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new GitHubSourceError(
      'unsafe-path',
      `${sourceId}: caminho remoto inseguro “${path}”`,
    );
  }
}

function parseRepository(repositoryUrl: string): {
  owner: string;
  repository: string;
} {
  const segments = new URL(repositoryUrl).pathname.split('/').filter(Boolean);
  return { owner: segments[0], repository: segments[1] };
}

function githubHeaders(): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'dex-vscode-extension',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function requireSuccessfulResponse(
  response: Response,
  source: SyncSource,
  operation: string,
  notFoundCode: GitHubSourceError['code'] = 'http',
  notFoundMessage?: string,
): Promise<void> {
  if (response.ok) {
    return;
  }
  if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
    throw new GitHubSourceError(
      'rate-limit',
      `${source.id}: limite da API do GitHub atingido ao ${operation}`,
    );
  }
  if (response.status === 404) {
    throw new GitHubSourceError(
      notFoundCode,
      `${source.id}: ${notFoundMessage ?? `recurso não encontrado ao ${operation}`}`,
    );
  }
  throw new GitHubSourceError(
    'http',
    `${source.id}: GitHub respondeu com ${response.status} ${response.statusText} ao ${operation}`,
  );
}
