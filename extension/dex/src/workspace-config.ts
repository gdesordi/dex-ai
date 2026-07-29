import * as vscode from 'vscode';
import {
  AddDefaultSourceResult,
  addDefaultSource,
  parseSyncConfig,
  serializeSyncConfig,
} from './sync-config';
import { SyncConfig, SyncSource } from './sync-types';

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

  constructor() {
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
      }),
    );
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
      if (isFileNotFound(error)) {
        return {
          config: { version: 1, sources: [] },
          uri,
          virtual: true,
        };
      }
      throw error;
    }
  }

  async write(folder: vscode.WorkspaceFolder, config: SyncConfig): Promise<void> {
    if (!vscode.workspace.isTrusted) {
      throw new Error('o workspace precisa ser confiável para alterar sync.json');
    }

    // Valida também configurações construídas por comandos antes de persistir.
    const normalized = parseSyncConfig(serializeSyncConfig(config));
    const serialized = serializeSyncConfig(normalized);
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

  async addSource(
    folder: vscode.WorkspaceFolder,
    source: SyncSource,
  ): Promise<void> {
    const { config } = await this.read(folder);
    await this.write(folder, {
      ...config,
      sources: [...config.sources, source],
    });
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

function isFileNotFound(error: unknown): boolean {
  return error instanceof vscode.FileSystemError && error.code === 'FileNotFound';
}
