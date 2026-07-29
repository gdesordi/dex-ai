import * as vscode from 'vscode';
import { validateCatalog } from './catalog-validator';
import { GitHubSourceProvider } from './github-source';
import { SourceStorage } from './source-storage';
import { SyncSource, SourceSyncResult } from './sync-types';
import { WorkspaceConfigManager } from './workspace-config';

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
              const catalog = await this.provider.download(source, controller.signal);
              const validated = validateCatalog(source.id, catalog.files);
              const metadata = await this.storage.install(
                folder,
                source,
                catalog,
                validated.skills.length,
                validated.skillsVersion,
              );
              results.push({ sourceId: source.id, status: 'synced', metadata });
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

    const agents = vscode.Uri.joinPath(folder.uri, '.agents');
    const destination = vscode.Uri.joinPath(agents, 'skills');
    const temporary = vscode.Uri.joinPath(agents, 'skills-dex-next');
    const backup = vscode.Uri.joinPath(agents, 'skills-dex-backup');
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
