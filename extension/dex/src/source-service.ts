import * as vscode from 'vscode';
import { validateCatalog } from './catalog-validator';
import { GitHubSourceProvider } from './github-source';
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
  ) {
    this.storage = new SourceStorage(context.globalStorageUri);
  }

  async syncAll(folder: vscode.WorkspaceFolder): Promise<SourceSyncResult[]> {
    const { config } = await this.configs.read(folder);
    const enabled = config.sources.filter((source) => source.enabled);
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
    await this.compose(folder, enabled);
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
          throw error;
        } finally {
          cancellation.dispose();
        }
      },
    );

    await this.compose(
      folder,
      config.sources.filter((item) => item.enabled),
    );
    return result;
  }

  async checkUpdates(folder: vscode.WorkspaceFolder): Promise<string[]> {
    const { config } = await this.configs.read(folder);
    const updates: string[] = [];
    for (const source of config.sources.filter((item) => item.enabled)) {
      const [commit, metadata] = await Promise.all([
        this.provider.resolveCommit(source),
        this.storage.readMetadata(folder, source.id),
      ]);
      if (!metadata || metadata.resolvedCommit !== commit) {
        updates.push(source.id);
      }
    }
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
    const catalog = await this.provider.download(source, signal);
    const validated = validateCatalog(source.id, catalog.files);
    const metadata = await this.storage.install(
      folder,
      source,
      catalog,
      validated.skills.length,
      validated.skillsVersion,
    );
    return { sourceId: source.id, status: 'synced', metadata };
  }
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
