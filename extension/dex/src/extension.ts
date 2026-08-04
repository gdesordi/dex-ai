import * as vscode from 'vscode';
import { WorkspaceConfigManager } from './workspace-config';
import { SourceService } from './source-service';
import { SourcesTreeProvider, isSourceNode } from './sources-tree';
import { answerSpecQuestionnaire } from './spec-questionnaire-command';
import { SyncSource } from './sync-types';
import { newlyDisabledSourceIds } from './source-composition';

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Dex');
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

      const id = await promptQuickPickValue(
        'Adicionar fonte — Identificador',
        'Digite um ID único em kebab-case',
        ['company-skills', 'team-skills'],
      );
      if (!id) return;
      const repository = await promptQuickPickValue(
        'Adicionar fonte — Repositório',
        'Digite a URL pública do GitHub',
        ['https://github.com/owner/skills-repository'],
      );
      if (!repository) return;
      const ref = await promptQuickPickValue(
        'Adicionar fonte — Referência',
        'Digite uma branch, tag ou commit',
        ['main', 'develop', 'v1.0.0'],
      );
      if (!ref) return;
      const sourcePath = await promptQuickPickValue(
        'Adicionar fonte — Pasta',
        'Digite o caminho relativo do catálogo no repositório',
        ['skills', 'catalog/skills'],
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
        void vscode.window.showInformationMessage(
          `A fonte “${id}” foi adicionada a ${folder.name}/.dex/sync.json.`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível adicionar a fonte: ${message}`,
        );
      }
    },
  );

  const addDefaultSourceCommand = vscode.commands.registerCommand(
    'dex.addDefaultSource',
    async () => {
      const workspaceFolder = await selectWorkspaceFolder();
      if (!workspaceFolder) {
        void vscode.window.showErrorMessage(
          'Abra uma pasta ou workspace antes de incluir a fonte Dex.',
        );
        return;
      }

      try {
        const result = await workspaceConfigManager.addDefaultSource(
          workspaceFolder,
        );
        if (result.status === 'added') {
          void vscode.window.showInformationMessage(
            `A fonte dex-ai foi adicionada a ${workspaceFolder.name}/.dex/sync.json.`,
          );
          return;
        }
        if (result.status === 'already-configured') {
          void vscode.window.showInformationMessage(
            'A fonte dex-ai já está configurada.',
          );
          return;
        }
        if (result.status === 'catalog-already-configured') {
          void vscode.window.showInformationMessage(
            `O catálogo Dex já está configurado pela fonte “${result.sourceId}”.`,
          );
          return;
        }
        void vscode.window.showErrorMessage(
          'O identificador dex-ai já pertence a uma fonte com outros valores.',
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Não foi possível incluir a fonte Dex: ${message}`,
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
    addDefaultSourceCommand,
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

async function promptQuickPickValue(
  title: string,
  placeHolder: string,
  examples: string[],
): Promise<string | undefined> {
  const picker = vscode.window.createQuickPick();
  picker.title = title;
  picker.placeholder = placeHolder;
  picker.items = examples.map((example) => ({
    label: example,
    description: 'Exemplo',
  }));
  picker.matchOnDescription = true;

  return new Promise<string | undefined>((resolve) => {
    let settled = false;
    const finish = (value: string | undefined): void => {
      if (settled) return;
      settled = true;
      picker.dispose();
      resolve(value);
    };
    picker.onDidAccept(() => {
      const typed = picker.value.trim();
      const selected = picker.activeItems[0]?.label;
      finish(typed || selected);
    });
    picker.onDidHide(() => finish(undefined));
    picker.show();
  });
}
