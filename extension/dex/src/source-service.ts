import * as vscode from 'vscode';
import { validateCatalog } from './catalog-validator';
import { GitHubSourceError, GitHubSourceProvider } from './github-source';
import { SourceStorage } from './source-storage';
import { SyncSource, SourceSyncResult } from './sync-types';
import { WorkspaceConfigManager } from './workspace-config';
import { resolveSkillsDestination } from './environment';

export class SourceService {
  private readonly provider = new GitHubSourceProvider();
  readonly storage: SourceStorage;

  constructor(
    context: vscode.ExtensionContext,
    private readonly configs: WorkspaceConfigManager,
    private readonly output: vscode.OutputChannel,
  ) {
    this.storage = new SourceStorage(context.globalStorageUri);
  }

  async syncAll(folder: vscode.WorkspaceFolder): Promise<SourceSyncResult[]> {
    const { config } = await this.configs.read(folder);
    const enabled = config.sources.filter((source) => source.enabled);
    this.log(
      `Sincronização iniciada para “${folder.name}”: ${enabled.length} de ${config.sources.length} fonte(s) habilitada(s).`,
    );
    const results: SourceSyncResult[] = [];
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Dex: sincronizando fontes', cancellable: true },
      async (progress, token) => {
        const controller = new AbortController();
        const cancellation = token.onCancellationRequested(() => controller.abort());
        try {
          for (const source of enabled) {
            progress.report({ message: source.id });
            try {
              results.push(
                await this.downloadAndInstall(folder, source, controller.signal),
              );
            } catch (error) {
              if (controller.signal.aborted) {
                throw new vscode.CancellationError();
              }
              this.logError(source, error);
              results.push({
                sourceId: source.id,
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
              });
            }
          }
        } finally {
          cancellation.dispose();
        }
      },
    );
    this.log(`Compondo o destino de “${folder.name}” com ${enabled.length} fonte(s).`);
    try {
      await this.compose(folder, enabled);
    } catch (error) {
      this.log(`Falha ao compor o destino: ${errorMessage(error)}`);
      throw error;
    }
    this.log(`Sincronização de “${folder.name}” concluída.`);
    return results;
  }

  async syncSource(
    folder: vscode.WorkspaceFolder,
    sourceId: string,
  ): Promise<SourceSyncResult> {
    const { config } = await this.configs.read(folder);
    const source = config.sources.find((item) => item.id === sourceId);
    if (!source) {
      throw new Error(`a fonte “${sourceId}” não existe na configuração`);
    }

    this.log(`Sincronização individual iniciada para a fonte “${source.id}”.`);

    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Dex: sincronizando ${source.id}`,
        cancellable: true,
      },
      async (_progress, token) => {
        const controller = new AbortController();
        const cancellation = token.onCancellationRequested(() => controller.abort());
        try {
          return await this.downloadAndInstall(folder, source, controller.signal);
        } catch (error) {
          if (controller.signal.aborted) {
            throw new vscode.CancellationError();
          }
          this.logError(source, error);
          throw error;
        } finally {
          cancellation.dispose();
        }
      },
    );

    try {
      await this.compose(
        folder,
        config.sources.filter((item) => item.enabled),
      );
    } catch (error) {
      this.log(`Falha ao compor o destino: ${errorMessage(error)}`);
      throw error;
    }
    this.log(`Sincronização individual de “${source.id}” concluída.`);
    return result;
  }

  async checkUpdates(folder: vscode.WorkspaceFolder): Promise<string[]> {
    const { config } = await this.configs.read(folder);
    const updates: string[] = [];
    this.log(`Verificando atualizações das fontes de “${folder.name}”.`);
    for (const source of config.sources.filter((item) => item.enabled)) {
      try {
        this.log(`Fonte “${source.id}”: resolvendo ${source.repository}@${source.ref}.`);
        const [commit, metadata] = await Promise.all([
          this.provider.resolveCommit(source),
          this.storage.readMetadata(folder, source.id),
        ]);
        if (!metadata || metadata.resolvedCommit !== commit) {
          updates.push(source.id);
        }
        this.log(
          `Fonte “${source.id}”: commit remoto ${commit.slice(0, 12)}; ` +
            (metadata
              ? `commit local ${metadata.resolvedCommit.slice(0, 12)}${metadata.resolvedCommit === commit ? ' (atual).' : ' (atualização disponível).'}`
              : 'sem cache local.'),
        );
      } catch (error) {
        this.logError(source, error);
        throw error;
      }
    }
    this.log(`Verificação concluída: ${updates.length} fonte(s) com atualização.`);
    return updates;
  }

  private async compose(
    folder: vscode.WorkspaceFolder,
    sources: SyncSource[],
  ): Promise<void> {
    const owners = new Map<string, string>();
    for (const source of sources) {
      const active = this.storage.getActiveUri(folder, source.id);
      if (!(await exists(active))) {
        throw new Error(`a fonte “${source.id}” ainda não possui uma cópia válida`);
      }
      for (const [name, type] of await vscode.workspace.fs.readDirectory(active)) {
        if (!(type & vscode.FileType.Directory)) continue;
        const owner = owners.get(name);
        if (owner) throw new Error(`a skill “${name}” existe nas fontes “${owner}” e “${source.id}”`);
        owners.set(name, source.id);
      }
    }

    const target = resolveSkillsDestination(
      vscode.env.appName,
      vscode.env.uriScheme,
    );
    const environmentRoot = vscode.Uri.joinPath(
      folder.uri,
      target.rootDirectory,
    );
    const destination = vscode.Uri.joinPath(
      environmentRoot,
      target.skillsDirectory,
    );
    const temporary = vscode.Uri.joinPath(environmentRoot, 'skills-dex-next');
    const backup = vscode.Uri.joinPath(environmentRoot, 'skills-dex-backup');
    await remove(temporary);
    await remove(backup);
    await vscode.workspace.fs.createDirectory(temporary);
    try {
      for (const source of sources) {
        await copyDirectory(this.storage.getActiveUri(folder, source.id), temporary);
      }
      if (await exists(destination)) await vscode.workspace.fs.rename(destination, backup);
      try {
        await vscode.workspace.fs.rename(temporary, destination);
      } catch (error) {
        if (await exists(backup)) await vscode.workspace.fs.rename(backup, destination);
        throw error;
      }
      await remove(backup);
    } catch (error) {
      await remove(temporary);
      throw error;
    }
  }

  private async downloadAndInstall(
    folder: vscode.WorkspaceFolder,
    source: SyncSource,
    signal: AbortSignal,
  ): Promise<SourceSyncResult> {
    this.log(
      `Fonte “${source.id}”: consultando ${source.repository}, referência “${source.ref}”, pasta “${source.path}”.`,
    );
    const catalog = await this.provider.download(source, signal);
    this.log(
      `Fonte “${source.id}”: commit ${catalog.resolvedCommit.slice(0, 12)} resolvido; ${catalog.files.size} arquivo(s) baixado(s).`,
    );
    const validated = validateCatalog(source.id, catalog.files);
    this.log(
      `Fonte “${source.id}”: catálogo válido com ${validated.skills.length} skill(s).`,
    );
    const metadata = await this.storage.install(
      folder,
      source,
      catalog,
      validated.skills.length,
      validated.skillsVersion,
    );
    this.log(`Fonte “${source.id}”: cache local atualizado.`);
    return { sourceId: source.id, status: 'synced', metadata };
  }

  private log(message: string): void {
    this.output.appendLine(`[${new Date().toISOString()}] ${message}`);
  }

  private logError(source: SyncSource, error: unknown): void {
    const code = error instanceof GitHubSourceError ? ` [${error.code}]` : '';
    const message = error instanceof Error ? error.message : String(error);
    this.log(`Fonte “${source.id}”: falha${code}: ${message}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function copyDirectory(source: vscode.Uri, destination: vscode.Uri): Promise<void> {
  await vscode.workspace.fs.createDirectory(destination);
  for (const [name, type] of await vscode.workspace.fs.readDirectory(source)) {
    const from = vscode.Uri.joinPath(source, name);
    const to = vscode.Uri.joinPath(destination, name);
    if (type & vscode.FileType.Directory) await copyDirectory(from, to);
    else if (type & vscode.FileType.File) await vscode.workspace.fs.writeFile(to, await vscode.workspace.fs.readFile(from));
  }
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try { await vscode.workspace.fs.stat(uri); return true; } catch (error) {
    if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') return false;
    throw error;
  }
}

async function remove(uri: vscode.Uri): Promise<void> {
  try { await vscode.workspace.fs.delete(uri, { recursive: true }); } catch (error) {
    if (!(error instanceof vscode.FileSystemError) || error.code !== 'FileNotFound') throw error;
  }
}
