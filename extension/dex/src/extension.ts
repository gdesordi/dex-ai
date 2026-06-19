import * as vscode from 'vscode';

const skillsTreeUrl =
  'https://api.github.com/repos/gdesordi/dex-ai/git/trees/main?recursive=1';
const rawRepositoryUrl =
  'https://raw.githubusercontent.com/gdesordi/dex-ai/main';

interface GitTreeEntry {
  path: string;
  type: 'blob' | 'tree' | string;
}

interface GitTreeResponse {
  tree?: GitTreeEntry[];
  truncated?: boolean;
}

let isDownloadingSkills = false;

export function activate(context: vscode.ExtensionContext): void {
  const downloadSkillsCommand = vscode.commands.registerCommand(
    'dex.downloadSkills',
    async () => {
      if (isDownloadingSkills) {
        void vscode.window.showInformationMessage(
          'O download das skills já está em andamento.',
        );
        return false;
      }

      isDownloadingSkills = true;

      try {
        const downloadedFiles = await downloadSkills(context);
        void vscode.window.showInformationMessage(
          `${downloadedFiles} arquivo(s) de skills baixado(s) com sucesso.`,
        );
        return true;
      } catch (error) {
        if (error instanceof vscode.CancellationError) {
          void vscode.window.showInformationMessage(
            'Download das skills cancelado.',
          );
          return false;
        }

        const message = error instanceof Error ? error.message : String(error);
        await vscode.window.showErrorMessage(
          `Não foi possível baixar as skills: ${message}`,
        );
        return false;
      } finally {
        isDownloadingSkills = false;
      }
    },
  );

  const openSkillsFolderCommand = vscode.commands.registerCommand(
    'dex.openSkillsFolder',
    async () => {
      const skillsUri = vscode.Uri.joinPath(context.globalStorageUri, 'skills');
      await vscode.workspace.fs.createDirectory(skillsUri);
      await vscode.commands.executeCommand('revealFileInOS', skillsUri);
    },
  );

  const addSkillsToWorkspaceCommand = vscode.commands.registerCommand(
    'dex.addSkillsToWorkspace',
    async () => {
      const workspaceFolder = await selectWorkspaceFolder();
      if (!workspaceFolder) {
        if (!vscode.workspace.workspaceFolders?.length) {
          await vscode.window.showErrorMessage(
            'Abra uma pasta ou workspace antes de adicionar as skills.',
          );
        }
        return;
      }

      const sourceUri = vscode.Uri.joinPath(context.globalStorageUri, 'skills');
      if (!(await uriExists(sourceUri))) {
        await vscode.window.showErrorMessage(
          'Nenhuma skill foi baixada. Execute primeiro “Dex: Baixar skills”.',
        );
        return;
      }

      const agentsUri = vscode.Uri.joinPath(workspaceFolder.uri, '.agents');
      const destinationUri = vscode.Uri.joinPath(agentsUri, 'skills');

      const copiedFiles = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Dex: adicionando skills ao workspace',
        },
        async (progress) => {
          await vscode.workspace.fs.createDirectory(agentsUri);
          return copyDirectory(sourceUri, destinationUri, (relativePath) => {
            progress.report({ message: relativePath });
          });
        },
      );

      if (copiedFiles === 0) {
        await vscode.window.showErrorMessage(
          'A pasta de skills baixadas não contém arquivos.',
        );
        return;
      }

      void vscode.window.showInformationMessage(
        `${copiedFiles} arquivo(s) de skills adicionado(s) a ${workspaceFolder.name}/.agents/skills.`,
      );
    },
  );

  const configureSkillsCommand = vscode.commands.registerCommand(
    'dex.configureSkills',
    async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        await vscode.window.showErrorMessage(
          'Abra uma pasta ou workspace antes de configurar as skills.',
        );
        return;
      }

      const downloaded = await vscode.commands.executeCommand<boolean>(
        'dex.downloadSkills',
      );
      if (!downloaded) {
        return;
      }

      await vscode.commands.executeCommand('dex.addSkillsToWorkspace');
    },
  );

  context.subscriptions.push(
    downloadSkillsCommand,
    openSkillsFolderCommand,
    addSkillsToWorkspaceCommand,
    configureSkillsCommand,
  );
}

export function deactivate(): void {}

async function downloadSkills(
  context: vscode.ExtensionContext,
): Promise<number> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Dex: baixando skills',
      cancellable: true,
    },
    async (progress, cancellationToken) => {
      const abortController = new AbortController();
      const cancellation = cancellationToken.onCancellationRequested(() => {
        abortController.abort();
      });
      const temporaryUri = vscode.Uri.joinPath(
        context.globalStorageUri,
        'skills-download',
      );
      const destinationUri = vscode.Uri.joinPath(
        context.globalStorageUri,
        'skills',
      );

      try {
        await deleteIfPresent(temporaryUri);
        await vscode.workspace.fs.createDirectory(temporaryUri);

        progress.report({ message: 'Consultando o repositório…' });
        const treeResponse = await fetch(skillsTreeUrl, {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'dex-vscode-extension',
          },
          signal: abortController.signal,
        });

        if (!treeResponse.ok) {
          throw new Error(
            `GitHub respondeu com ${treeResponse.status} ${treeResponse.statusText}`,
          );
        }

        const repositoryTree = (await treeResponse.json()) as GitTreeResponse;
        if (repositoryTree.truncated) {
          throw new Error('a lista de arquivos retornada pelo GitHub foi truncada');
        }

        const files = (repositoryTree.tree ?? []).filter(
          (entry) => entry.type === 'blob' && entry.path.startsWith('skills/'),
        );

        if (files.length === 0) {
          throw new Error('nenhuma skill foi encontrada no repositório');
        }

        let nextFileIndex = 0;
        let completedFiles = 0;
        const workerCount = Math.min(6, files.length);

        const downloadNextFile = async (): Promise<void> => {
          while (nextFileIndex < files.length) {
            throwIfCancelled(cancellationToken);
            const file = files[nextFileIndex++];
            const relativePath = file.path.slice('skills/'.length);
            const encodedPath = file.path
              .split('/')
              .map(encodeURIComponent)
              .join('/');
            const fileResponse = await fetch(
              `${rawRepositoryUrl}/${encodedPath}`,
              { signal: abortController.signal },
            );

            if (!fileResponse.ok) {
              throw new Error(
                `falha ao baixar ${file.path} (${fileResponse.status})`,
              );
            }

            const fileUri = vscode.Uri.joinPath(
              temporaryUri,
              ...relativePath.split('/'),
            );
            const parentUri = vscode.Uri.joinPath(fileUri, '..');
            await vscode.workspace.fs.createDirectory(parentUri);
            await vscode.workspace.fs.writeFile(
              fileUri,
              new Uint8Array(await fileResponse.arrayBuffer()),
            );

            completedFiles += 1;
            progress.report({
              increment: 100 / files.length,
              message: `${completedFiles}/${files.length}: ${relativePath}`,
            });
          }
        };

        await Promise.all(
          Array.from({ length: workerCount }, () => downloadNextFile()),
        );
        throwIfCancelled(cancellationToken);

        await deleteIfPresent(destinationUri);
        await vscode.workspace.fs.rename(temporaryUri, destinationUri);

        return completedFiles;
      } catch (error) {
        await deleteIfPresent(temporaryUri);

        if (
          cancellationToken.isCancellationRequested ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          throw new vscode.CancellationError();
        }

        throw error;
      } finally {
        cancellation.dispose();
      }
    },
  );
}

async function deleteIfPresent(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.delete(uri, { recursive: true });
  } catch (error) {
    if (!(error instanceof vscode.FileSystemError) || error.code !== 'FileNotFound') {
      throw error;
    }
  }
}

async function selectWorkspaceFolder(): Promise<
  vscode.WorkspaceFolder | undefined
> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }

  if (folders.length === 1) {
    return folders[0];
  }

  return vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Selecione o workspace que receberá as skills',
  });
}

async function uriExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch (error) {
    if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
      return false;
    }

    throw error;
  }
}

async function copyDirectory(
  sourceUri: vscode.Uri,
  destinationUri: vscode.Uri,
  onFileCopied: (relativePath: string) => void,
  relativeDirectory = '',
): Promise<number> {
  await vscode.workspace.fs.createDirectory(destinationUri);
  const entries = await vscode.workspace.fs.readDirectory(sourceUri);
  let copiedFiles = 0;

  for (const [name, fileType] of entries) {
    const sourceEntryUri = vscode.Uri.joinPath(sourceUri, name);
    const destinationEntryUri = vscode.Uri.joinPath(destinationUri, name);
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${name}`
      : name;

    if (fileType & vscode.FileType.Directory) {
      copiedFiles += await copyDirectory(
        sourceEntryUri,
        destinationEntryUri,
        onFileCopied,
        relativePath,
      );
      continue;
    }

    if (fileType & vscode.FileType.File) {
      const contents = await vscode.workspace.fs.readFile(sourceEntryUri);
      await vscode.workspace.fs.writeFile(destinationEntryUri, contents);
      copiedFiles += 1;
      onFileCopied(relativePath);
    }
  }

  return copiedFiles;
}

function throwIfCancelled(token: vscode.CancellationToken): void {
  if (token.isCancellationRequested) {
    throw new vscode.CancellationError();
  }
}
