import * as vscode from 'vscode';
import { WorkspaceConfigManager } from './workspace-config';
import { SourceService } from './source-service';
import { SourcesTreeProvider, isSourceNode } from './sources-tree';
import { answerSpecQuestionnaire } from './spec-questionnaire-command';
import { gctSkillsSource, SyncSource } from './sync-types';
import { newlyDisabledSourceIds } from './source-composition';
import {
  calculateWorkdayProgress,
  formatWorkdayProgress,
  millisecondsUntilNextLocalMidnight,
} from './time-progress';

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Dex');
  createTimeStatusBar(context);
  const workspaceConfigManager = new WorkspaceConfigManager();
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
      const folder = await selectWorkspaceFolder();
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
      const folder = await selectWorkspaceFolder();
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
      const folder = await selectWorkspaceFolder();
      if (!folder) return;

      const sourceChoice = await vscode.window.showQuickPick(
        [
          {
            label: 'Dex AI',
            description: 'Catálogo padrão de skills do Dex',
            sourceType: 'dex' as const,
          },
          {
            label: 'GCT',
            description: 'Catálogo de skills do GCT',
            sourceType: 'gct' as const,
          },
          {
            label: 'Fonte de skills personalizada',
            description: 'Configurar outro repositório GitHub',
            sourceType: 'custom' as const,
          },
        ],
        {
          title: 'Adicionar fonte de skills',
          placeHolder: 'Escolha uma fonte',
        },
      );
      if (!sourceChoice) return;

      if (sourceChoice.sourceType === 'dex') {
        try {
          const result = await workspaceConfigManager.addDefaultSource(folder);
          sourcesTree.refresh();
          if (result.status === 'added') {
            await syncAddedSource(
              folder,
              'dex-ai',
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

      if (sourceChoice.sourceType === 'gct') {
        try {
          await workspaceConfigManager.addSource(folder, { ...gctSkillsSource });
          sourcesTree.refresh();
          await syncAddedSource(
            folder,
            gctSkillsSource.id,
            sourceService,
            sourcesTree,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          void vscode.window.showErrorMessage(
            `Não foi possível incluir a fonte GCT: ${message}`,
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
        const folder = await selectWorkspaceFolder();
        if (!folder) return;
        const updates = await sourceService.checkUpdates(folder);
        void vscode.window.showInformationMessage(
          updates.length
            ? `Atualizações disponíveis para: ${updates.join(', ')}.`
            : 'Todas as fontes de skills estão atualizadas.',
        );
      } catch (error) {
        outputChannel.show(true);
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível verificar atualizações das skills: ${message}`,
        );
      }
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
    removeSourceCommand,
    openSyncConfigCommand,
    addSourceCommand,
    syncSourcesCommand,
    checkSkillsUpdatesCommand,
    answerSpecQuestionnaireCommand,
    configChangeSubscription,
  );

  void initializeConfigObservation(
    workspaceConfigManager,
    sourceStates,
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(
      `[${new Date().toISOString()}] Falha ao observar configurações: ${message}`,
    );
  });
}

async function initializeConfigObservation(
  configs: WorkspaceConfigManager,
  states: Map<string, SyncSource[]>,
): Promise<void> {
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
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
  try {
    await sourceService.syncSource(folder, sourceId);
    sourcesTree.refresh();
    void vscode.window.showInformationMessage(
      `A fonte “${sourceId}” foi adicionada e sincronizada.`,
    );
  } catch (error) {
    const detail = error instanceof vscode.CancellationError
      ? 'a sincronização foi cancelada'
      : error instanceof Error
        ? error.message
        : String(error);
    void vscode.window.showWarningMessage(
      `A fonte “${sourceId}” foi adicionada, mas não pôde ser sincronizada: ${detail}.`,
    );
  }
}
