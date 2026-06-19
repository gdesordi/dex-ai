import * as vscode from 'vscode';

const skillsTreeUrl =
  'https://api.github.com/repos/gdesordi/dex-ai/git/trees/main?recursive=1';
const rawRepositoryUrl =
  'https://raw.githubusercontent.com/gdesordi/dex-ai/main';
const skillsManifestUrl = `${rawRepositoryUrl}/skills/dex.json`;
const skillsChangelogUrl = `${rawRepositoryUrl}/skills/changelog.md`;
const lastUpdateCheckKey = 'dex.skills.lastUpdateCheckAt';
const updateCheckIntervalMs = 24 * 60 * 60 * 1000;
const updateCheckTimerIntervalMs = 60 * 60 * 1000;

interface GitTreeEntry {
  path: string;
  type: 'blob' | 'tree' | string;
}

interface GitTreeResponse {
  tree?: GitTreeEntry[];
  truncated?: boolean;
}

interface SkillsManifest {
  skillsVersion: string;
}

let isDownloadingSkills = false;

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Dex');
  const downloadSkillsCommand = vscode.commands.registerCommand(
    'dex.downloadSkills',
    async () => runSkillsDownload(context, true),
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

  const checkSkillsUpdatesCommand = vscode.commands.registerCommand(
    'dex.checkSkillsUpdates',
    async () => {
      try {
        await checkSkillsUpdates(context, true);
        await context.globalState.update(lastUpdateCheckKey, Date.now());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível verificar atualizações das skills: ${message}`,
        );
      }
    },
  );

  const periodicUpdateCheck = (): void => {
    void runPeriodicSkillsUpdateCheck(context, outputChannel);
  };
  const updateCheckTimer = setInterval(
    periodicUpdateCheck,
    updateCheckTimerIntervalMs,
  );
  const updateCheckTimerDisposable = new vscode.Disposable(() => {
    clearInterval(updateCheckTimer);
  });

  context.subscriptions.push(
    outputChannel,
    downloadSkillsCommand,
    openSkillsFolderCommand,
    addSkillsToWorkspaceCommand,
    configureSkillsCommand,
    checkSkillsUpdatesCommand,
    updateCheckTimerDisposable,
  );

  periodicUpdateCheck();
}

export function deactivate(): void {}

async function runSkillsDownload(
  context: vscode.ExtensionContext,
  showSuccessNotification: boolean,
): Promise<boolean> {
  if (isDownloadingSkills) {
    void vscode.window.showInformationMessage(
      'O download das skills já está em andamento.',
    );
    return false;
  }

  isDownloadingSkills = true;

  try {
    const downloadedFiles = await downloadSkills(context);
    if (showSuccessNotification) {
      void vscode.window.showInformationMessage(
        `${downloadedFiles} arquivo(s) de skills baixado(s) com sucesso.`,
      );
    }
    return true;
  } catch (error) {
    if (error instanceof vscode.CancellationError) {
      void vscode.window.showInformationMessage('Download das skills cancelado.');
      return false;
    }

    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(
      `Não foi possível baixar as skills: ${message}`,
    );
    return false;
  } finally {
    isDownloadingSkills = false;
  }
}

async function checkSkillsUpdates(
  context: vscode.ExtensionContext,
  notifyWhenCurrent: boolean,
): Promise<void> {
  const remoteManifest = await fetchSkillsManifest();
  const localVersion = await readLocalSkillsVersion(context);

  if (
    localVersion &&
    compareSemver(localVersion, remoteManifest.skillsVersion) >= 0
  ) {
    if (notifyWhenCurrent) {
      void vscode.window.showInformationMessage(
        `As Dex AI Skills já estão atualizadas (${localVersion}).`,
      );
    }
    return;
  }

  const message = `Nova versão das Dex AI Skills disponível: ${remoteManifest.skillsVersion}`;

  while (true) {
    const choice = await vscode.window.showInformationMessage(
      message,
      'Ver mudanças',
      'Atualizar agora',
      'Ignorar',
    );

    if (choice === 'Ver mudanças') {
      try {
        await showSkillsChangelog(context);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível abrir o changelog das skills: ${errorMessage}`,
        );
      }
      continue;
    }

    if (choice === 'Atualizar agora') {
      const updated = await runSkillsDownload(context, false);
      if (!updated) {
        return;
      }

      const workspaceChoice = await vscode.window.showInformationMessage(
        'Dex AI Skills atualizadas. Deseja atualizar também o workspace?',
        'Atualizar workspace',
        'Agora não',
      );

      if (workspaceChoice === 'Atualizar workspace') {
        await vscode.commands.executeCommand('dex.addSkillsToWorkspace');
      }
      return;
    }

    return;
  }
}

async function runPeriodicSkillsUpdateCheck(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): Promise<void> {
  const now = Date.now();
  const lastCheck = context.globalState.get<number>(lastUpdateCheckKey, 0);
  if (now - lastCheck < updateCheckIntervalMs) {
    return;
  }

  // Registra antes de exibir uma notificação para impedir verificações
  // duplicadas enquanto a decisão do usuário ainda estiver pendente.
  await context.globalState.update(lastUpdateCheckKey, now);

  try {
    await checkSkillsUpdates(context, false);
  } catch (error) {
    // Uma falha temporária pode ser tentada novamente na próxima passagem do
    // timer, sem interromper ou notificar o usuário durante a inicialização.
    await context.globalState.update(lastUpdateCheckKey, 0);
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(
      `[${new Date().toISOString()}] Falha ao verificar atualizações: ${message}`,
    );
  }
}

async function fetchSkillsManifest(): Promise<SkillsManifest> {
  const response = await fetch(skillsManifestUrl, {
    headers: { 'User-Agent': 'dex-vscode-extension' },
  });
  if (!response.ok) {
    throw new Error(
      `GitHub respondeu com ${response.status} ${response.statusText}`,
    );
  }

  const manifest = (await response.json()) as Partial<SkillsManifest>;
  if (
    typeof manifest.skillsVersion !== 'string' ||
    !isValidSemver(manifest.skillsVersion)
  ) {
    throw new Error('o dex.json remoto contém uma versão inválida');
  }

  return manifest as SkillsManifest;
}

async function readLocalSkillsVersion(
  context: vscode.ExtensionContext,
): Promise<string | undefined> {
  const manifestUri = vscode.Uri.joinPath(
    context.globalStorageUri,
    'skills',
    'dex.json',
  );

  try {
    const contents = await vscode.workspace.fs.readFile(manifestUri);
    const manifest = JSON.parse(
      new TextDecoder().decode(contents),
    ) as Partial<SkillsManifest>;

    if (
      typeof manifest.skillsVersion !== 'string' ||
      !isValidSemver(manifest.skillsVersion)
    ) {
      throw new Error('o dex.json local contém uma versão inválida');
    }

    return manifest.skillsVersion;
  } catch (error) {
    if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
      return undefined;
    }
    throw error;
  }
}

async function showSkillsChangelog(
  context: vscode.ExtensionContext,
): Promise<void> {
  const response = await fetch(skillsChangelogUrl, {
    headers: { 'User-Agent': 'dex-vscode-extension' },
  });
  if (!response.ok) {
    throw new Error(
      `GitHub respondeu com ${response.status} ${response.statusText}`,
    );
  }

  const previewUri = vscode.Uri.joinPath(
    context.globalStorageUri,
    'skills-changelog.md',
  );
  await vscode.workspace.fs.createDirectory(context.globalStorageUri);
  await vscode.workspace.fs.writeFile(
    previewUri,
    new TextEncoder().encode(await response.text()),
  );
  await vscode.commands.executeCommand('markdown.showPreview', previewUri);
}

function isValidSemver(version: string): boolean {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version);
}

function compareSemver(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }

  return 0;
}

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
