import * as vscode from 'vscode';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { constants } from 'node:fs';
import { WorkspaceConfigManager } from './workspace-config';
import { SourceService } from './source-service';
import { SourcesTreeProvider, isSourceNode } from './sources-tree';
import { answerSpecQuestionnaire } from './spec-questionnaire-command';
import { SyncSource } from './sync-types';
import { newlyDisabledSourceIds } from './source-composition';
import { fallbackKnownSources } from './default-sources';
import { KnownSourcesCatalog } from './remote-known-sources';
import { runInitialSourceSync } from './initial-source-sync';
import { ignoredRevisionKey } from './source-revision';
import {
  calculateWorkdayProgress,
  formatWorkdayProgress,
  millisecondsUntilNextLocalMidnight,
} from './time-progress';

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Dex');
  const knownSourcesCatalog = new KnownSourcesCatalog(fallbackKnownSources);
  createTimeStatusBar(context);
  const globalFolder: vscode.WorkspaceFolder = {
    uri: vscode.Uri.joinPath(context.globalStorageUri, 'global-sources'),
    name: 'Global',
    index: -1,
  };
  const workspaceConfigManager = new WorkspaceConfigManager(globalFolder);
  const sourceService = new SourceService(
    context,
    workspaceConfigManager,
    outputChannel,
  );
  const sourcesTree = new SourcesTreeProvider(
    workspaceConfigManager,
  );
  const sourceStates = new Map<string, SyncSource[]>();
  const configChangeSubscription = workspaceConfigManager.onDidChange(
    ({ folder }) => {
      void handleConfigChange(
        folder,
        workspaceConfigManager,
        sourceService,
        sourceStates,
        outputChannel,
      );
    },
  );
  const sourcesView = vscode.window.createTreeView('dex.skillSources', {
    treeDataProvider: sourcesTree,
    showCollapseAll: true,
  });
  const syncSourcesCommand = vscode.commands.registerCommand(
    'dex.syncSources',
    async () => {
      const folder = await selectInstallScope(globalFolder);
      if (!folder) return false;
      try {
        const results = await sourceService.syncAll(folder);
        sourcesTree.refresh();
        const failures = results.filter((result) => result.status === 'error');
        if (failures.length) {
          outputChannel.show(true);
          void vscode.window.showWarningMessage(
            `Sincronização concluída com ${failures.length} falha(s): ${failures.map((item) => item.sourceId).join(', ')}.`,
          );
        } else {
          void vscode.window.showInformationMessage(
            `${results.length} fonte(s) sincronizada(s) em ${folder.name}.`,
          );
        }
        return failures.length === 0;
      } catch (error) {
        outputChannel.show(true);
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Não foi possível sincronizar: ${message}`);
        return false;
      }
    },
  );

  const openSourceRepositoryCommand = vscode.commands.registerCommand(
    'dex.openSourceRepository',
    async (node: unknown) => {
      if (isSourceNode(node)) {
        await vscode.env.openExternal(vscode.Uri.parse(node.source.repository));
      }
    },
  );

  const syncSourceCommand = vscode.commands.registerCommand(
    'dex.syncSource',
    async (node: unknown) => {
      if (!isSourceNode(node)) return;
      try {
        await sourceService.syncSource(node.folder, node.source.id);
        sourcesTree.refresh();
        void vscode.window.showInformationMessage(
          `A fonte “${node.source.id}” foi sincronizada.`,
        );
      } catch (error) {
        if (error instanceof vscode.CancellationError) return;
        outputChannel.show(true);
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível sincronizar “${node.source.id}”: ${message}`,
        );
      }
    },
  );

  const enableSourceCommand = vscode.commands.registerCommand(
    'dex.enableSource',
    (node: unknown) => updateSourceState(node, true),
  );

  const disableSourceCommand = vscode.commands.registerCommand(
    'dex.disableSource',
    (node: unknown) => updateSourceState(node, false),
  );

  async function updateSourceState(
    node: unknown,
    enabled: boolean,
  ): Promise<void> {
    if (!isSourceNode(node) || node.source.enabled === enabled) return;
    try {
      const updated = await workspaceConfigManager.updateSourceEnabled(
        node.folder,
        node.source.id,
        enabled,
      );
      if (!updated) {
        throw new Error('a fonte não existe mais na configuração');
      }
      sourcesTree.refresh();
      if (enabled) {
        try {
          await sourceService.syncSource(node.folder, node.source.id);
          sourcesTree.refresh();
          void vscode.window.showInformationMessage(
            `A fonte “${node.source.id}” foi ativada e suas skills foram restauradas.`,
          );
        } catch (error) {
          outputChannel.show(true);
          const message =
            error instanceof vscode.CancellationError
              ? 'sincronização cancelada'
              : error instanceof Error
                ? error.message
                : String(error);
          void vscode.window.showWarningMessage(
            `A fonte “${node.source.id}” foi ativada, mas suas skills não puderam ser restauradas: ${message}.`,
          );
        }
        return;
      }
      void vscode.window.showInformationMessage(
        `A fonte “${node.source.id}” foi desativada.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(
        `Não foi possível ${enabled ? 'ativar' : 'desativar'} a fonte: ${message}`,
      );
    }
  }

  const removeSourceCommand = vscode.commands.registerCommand(
    'dex.removeSource',
    async (node: unknown) => {
      if (!isSourceNode(node)) return;
      const confirmation = await vscode.window.showWarningMessage(
        `Remover a fonte “${node.source.id}” da configuração?`,
        { modal: true },
        'Remover fonte',
      );
      if (confirmation !== 'Remover fonte') return;

      try {
        await workspaceConfigManager.removeSource(node.folder, node.source.id);
        sourcesTree.refresh();
        const cacheChoice = await vscode.window.showInformationMessage(
          `A fonte “${node.source.id}” foi removida. Deseja apagar também sua cópia local?`,
          'Preservar cache',
          'Apagar cache',
        );
        if (cacheChoice === 'Apagar cache') {
          await sourceService.storage.deleteSource(node.folder, node.source.id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível remover a fonte: ${message}`,
        );
      }
    },
  );

  const openSyncConfigCommand = vscode.commands.registerCommand(
    'dex.openSyncConfig',
    async () => {
      const folder = await selectInstallScope(globalFolder);
      if (!folder) return;
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.joinPath(folder.uri, '.dex', 'sync.json'),
      );
      await vscode.window.showTextDocument(document);
    },
  );

  const addSourceCommand = vscode.commands.registerCommand(
    'dex.addSource',
    async () => {
      const folder = await selectInstallScope(globalFolder);
      if (!folder) return;

      const sourceChoice = await vscode.window.showQuickPick(
        knownSourcesCatalog.getChoices(),
        {
          title: 'Adicionar fonte de skills',
          placeHolder: 'Escolha uma fonte',
        },
      );
      if (!sourceChoice) return;

      if (sourceChoice.sourceType === 'dex') {
        try {
          const result = await workspaceConfigManager.addDefaultSource(
            folder,
            sourceChoice.source,
          );
          sourcesTree.refresh();
          if (result.status === 'added') {
            await syncAddedSource(
              folder,
              sourceChoice.source.id,
              sourceService,
              sourcesTree,
            );
          } else if (result.status === 'already-configured') {
            void vscode.window.showInformationMessage(
              'A fonte dex-ai já está configurada.',
            );
          } else if (result.status === 'catalog-already-configured') {
            void vscode.window.showInformationMessage(
              `O catálogo Dex já está configurado pela fonte “${result.sourceId}”.`,
            );
          } else {
            void vscode.window.showErrorMessage(
              'O identificador dex-ai já pertence a uma fonte com outros valores.',
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          void vscode.window.showErrorMessage(
            `Não foi possível incluir a fonte Dex: ${message}`,
          );
        }
        return;
      }

      if (sourceChoice.sourceType !== 'custom') {
        try {
          await workspaceConfigManager.addSource(folder, { ...sourceChoice.source });
          sourcesTree.refresh();
          await syncAddedSource(
            folder,
            sourceChoice.source.id,
            sourceService,
            sourcesTree,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          void vscode.window.showErrorMessage(
            `Não foi possível incluir a fonte “${sourceChoice.source.id}”: ${message}`,
          );
        }
        return;
      }

      const id = await promptInputValue(
        'Adicionar fonte — Identificador',
        'Digite um ID único em kebab-case',
      );
      if (!id) return;
      const repository = await promptInputValue(
        'Adicionar fonte — Repositório',
        'Digite a URL pública do GitHub',
      );
      if (!repository) return;
      const ref = await promptInputValue(
        'Adicionar fonte — Referência',
        'Digite uma branch, tag ou commit',
      );
      if (!ref) return;
      const sourcePath = await promptInputValue(
        'Adicionar fonte — Pasta',
        'Digite o caminho relativo do catálogo no repositório',
      );
      if (!sourcePath) return;
      const agentsPathInput = await vscode.window.showInputBox({
        title: 'Adicionar fonte — Pasta de agentes (opcional)',
        placeHolder: 'Digite o caminho relativo dos agentes ou deixe em branco',
      });
      if (agentsPathInput === undefined) return;
      const agentsPath = agentsPathInput.trim() || undefined;
      const enabledChoice = await vscode.window.showQuickPick(
        [
          { label: 'Ativada', description: 'Participa das sincronizações' },
          { label: 'Desativada', description: 'Fica salva sem sincronizar' },
        ],
        {
          title: 'Adicionar fonte — Estado inicial',
          placeHolder: 'Escolha se a fonte deve iniciar ativada',
        },
      );
      if (!enabledChoice) return;

      try {
        await workspaceConfigManager.addSource(folder, {
          id,
          repository,
          ref,
          path: sourcePath,
          agentsPath,
          enabled: enabledChoice.label === 'Ativada',
        } as SyncSource);
        sourcesTree.refresh();
        await syncAddedSource(folder, id, sourceService, sourcesTree);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível adicionar a fonte: ${message}`,
        );
      }
    },
  );

  const checkSkillsUpdatesCommand = vscode.commands.registerCommand(
    'dex.checkSkillsUpdates',
    async () => {
      try {
        let total = 0;
        let failures = 0;
        for (const folder of [globalFolder, ...(vscode.workspace.workspaceFolders ?? [])]) {
          let updates: Awaited<ReturnType<SourceService['checkUpdates']>>;
          try {
            updates = await sourceService.checkUpdates(folder);
          } catch (error) {
            failures++;
            const message = error instanceof Error ? error.message : String(error);
            outputChannel.appendLine(`Falha ao verificar “${folder.name}”: ${message}`);
            continue;
          }
          total += updates.length;
          for (const { source, commit } of updates) {
            const key = ignoredRevisionKey(folder.uri.toString(), source, commit);
            if (context.globalState.get<boolean>(key)) continue;
            const choice = await vscode.window.showInformationMessage(
              `Atualização disponível para “${source.id}” em ${folder.name} (${commit.slice(0, 12)}).`,
              'Atualizar',
              'Ignorar essa versão',
            );
            if (choice === 'Atualizar') {
              await vscode.commands.executeCommand('dex.syncSource', { kind: 'source', folder, source });
            } else if (choice === 'Ignorar essa versão') {
              await context.globalState.update(key, true);
            }
          }
        }
        if (failures) {
          outputChannel.show(true);
          void vscode.window.showWarningMessage(`Não foi possível verificar ${failures} destino(s). Consulte a saída Dex.`);
        } else if (!total) void vscode.window.showInformationMessage('Todas as fontes de skills estão atualizadas.');
      } catch (error) {
        outputChannel.show(true);
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível verificar atualizações das skills: ${message}`,
        );
      }
    },
  );

  const propagateKiroPermissionsCommand = vscode.commands.registerCommand(
    'dex.propagateKiroPermissions',
    async () => {
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Propagando permissões no Kiro...' },
        async () => {
          const kiro = path.join(os.homedir(), '.kiro');
          const source = path.join(kiro, 'settings', 'permissions.yaml');
          const roots = path.join(kiro, 'workspace-roots');
          let failures = 0;
          let copied = 0;
          try {
            const sourceStat = await fs.stat(source);
            if (!sourceStat.isFile()) throw new Error(`A origem não é um arquivo: ${source}`);
            const entries = await fs.readdir(roots, { withFileTypes: true });
            for (const entry of entries) {
              if (!entry.isDirectory()) continue;
              const destination = path.join(roots, entry.name, 'permissions.yaml');
              try {
                await fs.copyFile(source, destination, constants.COPYFILE_EXCL);
                copied++;
              } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'EEXIST') continue;
                failures++;
                outputChannel.appendLine(`Falha ao copiar para ${destination}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
              }
            }
          } catch (error) {
            failures++;
            outputChannel.appendLine(`Falha ao propagar permissões do Kiro: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
          }
          if (failures) {
            outputChannel.show(true);
            void vscode.window.showErrorMessage('Não foi possível propagar todas as permissões no Kiro. Consulte a saída Dex.');
          } else {
            void vscode.window.showInformationMessage(`Permissões propagadas no Kiro para ${copied} pasta(s).`);
          }
        },
      );
    },
  );

  const answerSpecQuestionnaireCommand = vscode.commands.registerCommand(
    'dex.answerSpecQuestionnaire',
    () => answerSpecQuestionnaire(outputChannel),
  );

  context.subscriptions.push(
    outputChannel,
    workspaceConfigManager,
    sourcesTree,
    sourcesView,
    openSourceRepositoryCommand,
    syncSourceCommand,
    enableSourceCommand,
    disableSourceCommand,
    removeSourceCommand,
    openSyncConfigCommand,
    addSourceCommand,
    syncSourcesCommand,
    checkSkillsUpdatesCommand,
    answerSpecQuestionnaireCommand,
    propagateKiroPermissionsCommand,
    configChangeSubscription,
  );

  void vscode.commands.executeCommand('dex.checkSkillsUpdates').then(undefined, (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(
      `[${new Date().toISOString()}] Falha ao iniciar verificação de atualizações: ${message}`,
    );
  });

  void initializeConfigObservation(
    workspaceConfigManager,
    sourceStates,
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(
      `[${new Date().toISOString()}] Falha ao observar configurações: ${message}`,
    );
  });

  void knownSourcesCatalog.refresh().then(
    () => outputChannel.appendLine(
      `[${new Date().toISOString()}] Catálogo de fontes conhecidas atualizado.`,
    ),
    (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      outputChannel.appendLine(
        `[${new Date().toISOString()}] Não foi possível atualizar o catálogo de fontes conhecidas: ${message}`,
      );
    },
  );
}

async function initializeConfigObservation(
  configs: WorkspaceConfigManager,
  states: Map<string, SyncSource[]>,
): Promise<void> {
  for (const folder of [...(configs.globalFolder ? [configs.globalFolder] : []), ...(vscode.workspace.workspaceFolders ?? [])]) {
    states.set(folder.uri.toString(), (await configs.read(folder)).config.sources);
  }
  await configs.start();
}

async function handleConfigChange(
  folder: vscode.WorkspaceFolder,
  configs: WorkspaceConfigManager,
  sourceService: SourceService,
  states: Map<string, SyncSource[]>,
  output: vscode.OutputChannel,
): Promise<void> {
  try {
    const current = (await configs.read(folder)).config.sources;
    const key = folder.uri.toString();
    const previous = states.get(key);
    states.set(key, current);
    if (!previous) return;
    const disabledIds = newlyDisabledSourceIds(previous, current);
    if (disabledIds.length === 0) return;
    const removed = await sourceService.removeSourceSkills(folder, disabledIds);
    void vscode.window.showInformationMessage(
      `${removed} skill(s) removida(s) do workspace após desativar ${disabledIds.length} fonte(s).`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    output.appendLine(
      `[${new Date().toISOString()}] Falha ao remover skills desativadas: ${message}`,
    );
    void vscode.window.showErrorMessage(
      `Não foi possível remover as skills desativadas: ${message}`,
    );
  }
}

export function deactivate(): void {}

function createTimeStatusBar(context: vscode.ExtensionContext): void {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    -100,
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const update = (): void => {
    if (disposed) return;
    const now = new Date();
    const progress = calculateWorkdayProgress(now);
    const display = formatWorkdayProgress(progress);
    item.text = display.text;
    item.tooltip = display.tooltip;
    item.show();

    if (timer) clearTimeout(timer);
    timer = setTimeout(update, millisecondsUntilNextLocalMidnight(now));
  };

  context.subscriptions.push(
    item,
    {
      dispose: () => {
        disposed = true;
        if (timer) clearTimeout(timer);
      },
    },
  );
  update();
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

async function selectInstallScope(globalFolder: vscode.WorkspaceFolder): Promise<vscode.WorkspaceFolder | undefined> {
  const choice = await vscode.window.showQuickPick([
    { label: 'Workspace', description: 'Instalar no repositório do workspace', global: false },
    { label: 'Global', description: 'Instalar na pasta pessoal do usuário', global: true },
  ], { title: 'Escolha o destino das skills' });
  if (!choice) return undefined;
  return choice.global ? globalFolder : selectWorkspaceFolder();
}

async function promptInputValue(
  title: string,
  placeHolder: string,
): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({ title, placeHolder });
  return value?.trim() || undefined;
}

async function syncAddedSource(
  folder: vscode.WorkspaceFolder,
  sourceId: string,
  sourceService: SourceService,
  sourcesTree: SourcesTreeProvider,
): Promise<void> {
  const result = await runInitialSourceSync(
    () => sourceService.syncSource(folder, sourceId).then(() => undefined),
  );
  if (result.status === 'synced') {
    sourcesTree.refresh();
    void vscode.window.showInformationMessage(
      `A fonte “${sourceId}” foi adicionada e sincronizada.`,
    );
  } else {
    const detail = result.error instanceof vscode.CancellationError
      ? 'a sincronização foi cancelada'
      : result.error instanceof Error
        ? result.error.message
        : String(result.error);
    void vscode.window.showWarningMessage(
      `A fonte “${sourceId}” foi adicionada, mas não pôde ser sincronizada: ${detail}.`,
    );
  }
}
