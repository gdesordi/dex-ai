import { createHash } from 'node:crypto';
import * as vscode from 'vscode';
import { DownloadedCatalog } from './github-source';
import { SourceMetadata, SyncSource } from './sync-types';

export class SourceStorage {
  constructor(private readonly globalStorageUri: vscode.Uri) {}

  async install(
    workspaceFolder: vscode.WorkspaceFolder,
    source: SyncSource,
    catalog: DownloadedCatalog,
    skillCount: number,
    skillsVersion?: string,
  ): Promise<SourceMetadata> {
    const sourceRoot = this.getSourceRoot(workspaceFolder, source.id);
    const activeUri = vscode.Uri.joinPath(sourceRoot, 'active');
    const temporaryUri = vscode.Uri.joinPath(sourceRoot, 'download');
    const backupUri = vscode.Uri.joinPath(sourceRoot, 'backup');
    await deleteIfPresent(temporaryUri);
    await deleteIfPresent(backupUri);
    await vscode.workspace.fs.createDirectory(temporaryUri);

    try {
      for (const [path, contents] of catalog.files) {
        const fileUri = vscode.Uri.joinPath(temporaryUri, ...path.split('/'));
        await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(fileUri, '..'));
        await vscode.workspace.fs.writeFile(fileUri, contents);
      }

      const hadActive = await uriExists(activeUri);
      if (hadActive) {
        await vscode.workspace.fs.rename(activeUri, backupUri);
      }
      try {
        await vscode.workspace.fs.rename(temporaryUri, activeUri);
      } catch (error) {
        if (hadActive && (await uriExists(backupUri))) {
          await vscode.workspace.fs.rename(backupUri, activeUri);
        }
        throw error;
      }

      const metadata: SourceMetadata = {
        sourceId: source.id,
        repository: source.repository,
        requestedRef: source.ref,
        resolvedCommit: catalog.resolvedCommit,
        syncedAt: new Date().toISOString(),
        skillCount,
        ...(skillsVersion ? { skillsVersion } : {}),
      };
      await vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(sourceRoot, 'metadata.json'),
        new TextEncoder().encode(`${JSON.stringify(metadata, undefined, 2)}\n`),
      );
      await deleteIfPresent(backupUri);
      return metadata;
    } catch (error) {
      await deleteIfPresent(temporaryUri);
      throw error;
    }
  }

  async readMetadata(
    workspaceFolder: vscode.WorkspaceFolder,
    sourceId: string,
  ): Promise<SourceMetadata | undefined> {
    try {
      const contents = await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(
          this.getSourceRoot(workspaceFolder, sourceId),
          'metadata.json',
        ),
      );
      return JSON.parse(new TextDecoder().decode(contents)) as SourceMetadata;
    } catch (error) {
      if (isFileNotFound(error)) {
        return undefined;
      }
      throw error;
    }
  }

  getActiveUri(
    workspaceFolder: vscode.WorkspaceFolder,
    sourceId: string,
  ): vscode.Uri {
    return vscode.Uri.joinPath(this.getSourceRoot(workspaceFolder, sourceId), 'active');
  }

  getWorkspaceRoot(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
    return vscode.Uri.joinPath(
      this.globalStorageUri,
      'sources',
      workspaceStorageKey(workspaceFolder.uri.toString()),
    );
  }

  private getSourceRoot(
    workspaceFolder: vscode.WorkspaceFolder,
    sourceId: string,
  ): vscode.Uri {
    return vscode.Uri.joinPath(this.getWorkspaceRoot(workspaceFolder), sourceId);
  }
}

export function workspaceStorageKey(workspaceUri: string): string {
  return createHash('sha256').update(workspaceUri).digest('hex').slice(0, 24);
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

async function deleteIfPresent(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.delete(uri, { recursive: true });
  } catch (error) {
    if (!isFileNotFound(error)) {
      throw error;
    }
  }
}

function isFileNotFound(error: unknown): boolean {
  return error instanceof vscode.FileSystemError && error.code === 'FileNotFound';
}
