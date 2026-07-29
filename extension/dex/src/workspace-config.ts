import * as vscode from 'vscode';
import {
  AddDefaultSourceResult,
  addDefaultSource,
  parseSyncConfig,
  serializeSyncConfig,
  shouldInitializeSyncConfig,
} from './sync-config';
import { SyncConfig, createDefaultSyncConfig } from './sync-types';

export const syncConfigRelativePath = '.dex/sync.json';

export interface WorkspaceSyncConfig {
  config: SyncConfig;
  uri: vscode.Uri;
  virtual: boolean;
}

export interface SyncConfigChangedEvent {
  folder: vscode.WorkspaceFolder;
}

export class WorkspaceConfigManager implements vscode.Disposable {
  private readonly watchers = new Map<string, vscode.FileSystemWatcher>();
  private readonly disposables: vscode.Disposable[] = [];
  private readonly changedEmitter =
    new vscode.EventEmitter<SyncConfigChangedEvent>();

  readonly onDidChange = this.changedEmitter.event;

  constructor(private readonly outputChannel: vscode.OutputChannel) {
    this.disposables.push(this.changedEmitter);
  }

  async start(): Promise<void> {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      this.watch(folder);
    }

    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        for (const folder of event.removed) {
          this.unwatch(folder);
        }
        for (const folder of event.added) {
          this.watch(folder);
        }
        if (vscode.workspace.isTrusted) {
          void this.initializeFolders(event.added);
        }
      }),
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        void this.initializeFolders(vscode.workspace.workspaceFolders ?? []);
      }),
    );

    if (vscode.workspace.isTrusted) {
      await this.initializeFolders(vscode.workspace.workspaceFolders ?? []);
    }
  }

  async read(folder: vscode.WorkspaceFolder): Promise<WorkspaceSyncConfig> {
    const uri = this.getConfigUri(folder);
    try {
      const contents = await vscode.workspace.fs.readFile(uri);
      return {
        config: parseSyncConfig(new TextDecoder().decode(contents)),
        uri,
        virtual: false,
      };
    } catch (error) {
      if (isFileNotFound(error) && !vscode.workspace.isTrusted) {
        return { config: createDefaultSyncConfig(), uri, virtual: true };
      }
      throw error;
    }
  }

  async write(folder: vscode.WorkspaceFolder, config: SyncConfig): Promise<void> {
    if (!vscode.workspace.isTrusted) {
      throw new Error('o workspace precisa ser confiável para alterar sync.json');
    }

    // Valida também configurações construídas por comandos antes de persistir.
    const serialized = serializeSyncConfig(config);
    parseSyncConfig(serialized);
    const uri = this.getConfigUri(folder);
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folder.uri, '.dex'));
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(serialized));
  }

  async addDefaultSource(
    folder: vscode.WorkspaceFolder,
  ): Promise<AddDefaultSourceResult> {
    if (!vscode.workspace.isTrusted) {
      throw new Error('o workspace precisa ser confiável para alterar sync.json');
    }

    let current: SyncConfig;
    try {
      current = (await this.read(folder)).config;
    } catch (error) {
      if (!isFileNotFound(error)) {
        throw error;
      }
      current = { version: 1, sources: [] };
    }

    const result = addDefaultSource(current);
    if (result.status === 'added') {
      await this.write(folder, result.config);
    }
    return result;
  }

  async removeSource(
    folder: vscode.WorkspaceFolder,
    sourceId: string,
  ): Promise<boolean> {
    const { config } = await this.read(folder);
    const sources = config.sources.filter((source) => source.id !== sourceId);
    if (sources.length === config.sources.length) {
      return false;
    }
    await this.write(folder, { ...config, sources });
    return true;
  }

  dispose(): void {
    for (const watcher of this.watchers.values()) {
      watcher.dispose();
    }
    this.watchers.clear();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private async initializeFolders(
    folders: readonly vscode.WorkspaceFolder[],
  ): Promise<void> {
    await Promise.all(
      folders.map(async (folder) => {
        const uri = this.getConfigUri(folder);
        const exists = await uriExists(uri);
        if (!shouldInitializeSyncConfig(vscode.workspace.isTrusted, exists)) {
          return;
        }

        try {
          await this.write(folder, createDefaultSyncConfig());
          this.outputChannel.appendLine(
            `[${new Date().toISOString()}] Configuração criada em ${uri.toString()}`,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.outputChannel.appendLine(
            `[${new Date().toISOString()}] Falha ao criar ${uri.toString()}: ${message}`,
          );
        }
      }),
    );
  }

  private watch(folder: vscode.WorkspaceFolder): void {
    const key = folder.uri.toString();
    if (this.watchers.has(key)) {
      return;
    }

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(folder, syncConfigRelativePath),
    );
    const notify = (): void => this.changedEmitter.fire({ folder });
    watcher.onDidCreate(notify, undefined, this.disposables);
    watcher.onDidChange(notify, undefined, this.disposables);
    watcher.onDidDelete(notify, undefined, this.disposables);
    this.watchers.set(key, watcher);
  }

  private unwatch(folder: vscode.WorkspaceFolder): void {
    const key = folder.uri.toString();
    this.watchers.get(key)?.dispose();
    this.watchers.delete(key);
  }

  private getConfigUri(folder: vscode.WorkspaceFolder): vscode.Uri {
    return vscode.Uri.joinPath(folder.uri, '.dex', 'sync.json');
  }
}

async function uriExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch (error) {
    if (isFileNotFound(error)) {
      return false;
    }
    throw error;
  }
}

function isFileNotFound(error: unknown): boolean {
  return error instanceof vscode.FileSystemError && error.code === 'FileNotFound';
}
