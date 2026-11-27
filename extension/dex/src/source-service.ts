import * as vscode from 'vscode';
import * as os from 'node:os';
import { validateCatalog } from './catalog-validator';
import { GitHubSourceError, GitHubSourceProvider } from './github-source';
import { SourceStorage } from './source-storage';
import { SyncSource, SourceSyncResult } from './sync-types';
import { WorkspaceConfigManager } from './workspace-config';
import { globalRootDirectory, resolveSkillsDestination } from './environment';
import { managedEntriesToReplace, unmanagedEntryConflicts } from './source-composition';
import { isSourceRevisionCurrent, sourceRevisionKey } from './source-revision';

export class SourceService {
  private readonly provider = new GitHubSourceProvider();
  private readonly workspaceOperations = new Map<string, Promise<void>>();
  readonly storage: SourceStorage;

  constructor(
    context: vscode.ExtensionContext,
    private readonly configs: WorkspaceConfigManager,
    private readonly output: vscode.OutputChannel,
  ) {
    this.storage = new SourceStorage(context.globalStorageUri);
  }

  async syncAll(folder: vscode.WorkspaceFolder): Promise<SourceSyncResult[]> {
    return this.runExclusive(folder, () => this.syncAllUnlocked(folder));
  }

  private async syncAllUnlocked(
    folder: vscode.WorkspaceFolder,
  ): Promise<SourceSyncResult[]> {
    const { config } = await this.configs.read(folder);
    const enabled = config.sources.filter((source) => source.enabled);
    const previouslyManaged = await this.collectManagedEntryNames(
      folder,
      config.sources,
      'skills',
    );
    const previouslyManagedAgents = await this.collectManagedEntryNames(
      folder,
      config.sources,
      'agents',
    );
    this.log(
      `Sincronização iniciada para “${folder.name}”: ${enabled.length} de ${config.sources.length} fonte(s) habilitada(s).`,
    );
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
              this.logError(source, error);
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
    this.log(`Compondo o destino de “${folder.name}” com ${enabled.length} fonte(s).`);
    try {
      await this.compose(folder, enabled, previouslyManaged, previouslyManagedAgents);
    } catch (error) {
      this.log(`Falha ao compor o destino: ${errorMessage(error)}`);
      throw error;
    }
    this.log(`Sincronização de “${folder.name}” concluída.`);
    return results;
  }

  async syncSource(
    folder: vscode.WorkspaceFolder,
    sourceId: string,
  ): Promise<SourceSyncResult> {
    return this.runExclusive(folder, () =>
      this.syncSourceUnlocked(folder, sourceId),
    );
  }

  private async syncSourceUnlocked(
    folder: vscode.WorkspaceFolder,
    sourceId: string,
  ): Promise<SourceSyncResult> {
    const { config } = await this.configs.read(folder);
    const source = config.sources.find((item) => item.id === sourceId);
    if (!source) {
      throw new Error(`a fonte “${sourceId}” não existe na configuração`);
    }

    this.log(`Sincronização individual iniciada para a fonte “${source.id}”.`);
    const previouslyManaged = await this.collectManagedEntryNames(
      folder,
      config.sources,
      'skills',
    );
    const previouslyManagedAgents = await this.collectManagedEntryNames(
      folder,
      config.sources,
      'agents',
    );

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
          this.logError(source, error);
          throw error;
        } finally {
          cancellation.dispose();
        }
      },
    );

    try {
      await this.compose(
        folder,
        config.sources.filter((item) => item.enabled),
        previouslyManaged,
        previouslyManagedAgents,
      );
    } catch (error) {
      this.log(`Falha ao compor o destino: ${errorMessage(error)}`);
      throw error;
    }
    this.log(`Sincronização individual de “${source.id}” concluída.`);
    return result;
  }

  async checkUpdates(folder: vscode.WorkspaceFolder): Promise<{ source: SyncSource; commit: string }[]> {
    const { config } = await this.configs.read(folder);
    const updates: { source: SyncSource; commit: string }[] = [];
    this.log(`Verificando atualizações das fontes de “${folder.name}”.`);
    for (const source of config.sources.filter((item) => item.enabled)) {
      try {
        this.log(`Fonte “${source.id}”: resolvendo ${source.repository}@${source.ref}.`);
        const [commit, metadata] = await Promise.all([
          this.provider.resolveCommit(source),
          this.storage.readMetadata(folder, source.id),
        ]);
        const installed = this.configs.isGlobal(folder) ? await this.readGlobalRevisions(folder) : undefined;
        const isCurrent = isSourceRevisionCurrent(source, metadata, commit) &&
          (!this.configs.isGlobal(folder) || installed?.[source.id] === sourceRevisionKey(source, commit));
        if (!isCurrent) {
          updates.push({ source, commit });
        }
        this.log(
          `Fonte “${source.id}”: commit remoto ${commit.slice(0, 12)}; ` +
            (metadata
              ? `commit local ${metadata.resolvedCommit.slice(0, 12)}${isCurrent ? ' (atual).' : ' (atualização disponível).'}`
              : 'sem cache local.'),
        );
      } catch (error) {
        this.logError(source, error);
        throw error;
      }
    }
    this.log(`Verificação concluída: ${updates.length} fonte(s) com atualização.`);
    return updates;
  }

  async removeSourceSkills(
    folder: vscode.WorkspaceFolder,
    sourceIds: readonly string[],
  ): Promise<number> {
    return this.runExclusive(folder, () =>
      this.removeSourceSkillsUnlocked(folder, sourceIds),
    );
  }

  private async removeSourceSkillsUnlocked(
    folder: vscode.WorkspaceFolder,
    sourceIds: readonly string[],
  ): Promise<number> {
    if (this.configs.isGlobal(folder)) return this.removeGlobalSources(folder, sourceIds);
    const { config } = await this.configs.read(folder);
    const protectedNames = await this.collectManagedEntryNames(
      folder,
      config.sources.filter((source) => source.enabled),
      'skills',
    );
    const names = await this.collectManagedEntryNames(
      folder,
      config.sources.filter((source) => sourceIds.includes(source.id)),
      'skills',
    );
    const target = resolveSkillsDestination(
      vscode.env.appName,
      vscode.env.uriScheme,
    );
    const destination = vscode.Uri.joinPath(
      this.destinationBase(folder),
      target.rootDirectory,
      target.skillsDirectory,
    );
    let removed = 0;
    for (const name of names) {
      if (protectedNames.has(name)) continue;
      const skill = vscode.Uri.joinPath(destination, name);
      if (!(await exists(skill))) continue;
      await vscode.workspace.fs.delete(skill, { recursive: true });
      removed += 1;
    }
    const protectedAgentNames = await this.collectManagedEntryNames(
      folder,
      config.sources.filter((source) => source.enabled),
      'agents',
    );
    const agentNames = await this.collectManagedEntryNames(
      folder,
      config.sources.filter((source) => sourceIds.includes(source.id)),
      'agents',
    );
    const agentsDestination = vscode.Uri.joinPath(
      this.destinationBase(folder),
      target.rootDirectory,
      target.agentsDirectory,
    );
    for (const name of agentNames) {
      if (protectedAgentNames.has(name)) continue;
      const agent = vscode.Uri.joinPath(agentsDestination, name);
      if (!(await exists(agent))) continue;
      await vscode.workspace.fs.delete(agent, { recursive: true });
      removed += 1;
    }
    this.log(`${removed} item(ns) gerenciado(s) removido(s) de “${folder.name}” após desativar ${sourceIds.length} fonte(s).`);
    return removed;
  }

  private async runExclusive<T>(
    folder: vscode.WorkspaceFolder,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = folder.uri.toString();
    const previous = this.workspaceOperations.get(key) ?? Promise.resolve();
    const result = previous.then(operation, operation);
    const tail = result.then(
      () => undefined,
      () => undefined,
    );
    this.workspaceOperations.set(key, tail);
    try {
      return await result;
    } finally {
      if (this.workspaceOperations.get(key) === tail) {
        this.workspaceOperations.delete(key);
      }
    }
  }

  private async compose(
    folder: vscode.WorkspaceFolder,
    sources: SyncSource[],
    previouslyManaged: ReadonlySet<string>,
    previouslyManagedAgents: ReadonlySet<string>,
  ): Promise<void> {
    await this.composeCatalog(folder, sources, previouslyManaged, 'skills');
    await this.composeCatalog(folder, sources, previouslyManagedAgents, 'agents');
    if (this.configs.isGlobal(folder)) {
      const revisions: Record<string, string> = {};
      for (const source of sources) {
        const metadata = await this.storage.readMetadata(folder, source.id);
        if (metadata && isSourceRevisionCurrent(source, metadata, metadata.resolvedCommit)) revisions[source.id] = sourceRevisionKey(source, metadata.resolvedCommit);
      }
      const root = this.storage.getWorkspaceRoot(folder);
      await vscode.workspace.fs.createDirectory(root);
      await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(root, 'installed-revisions.json'), new TextEncoder().encode(JSON.stringify(revisions)));
    }
  }

  private async composeCatalog(
    folder: vscode.WorkspaceFolder,
    sources: SyncSource[],
    previouslyManaged: ReadonlySet<string>,
    kind: 'skills' | 'agents',
  ): Promise<void> {
    const target = resolveSkillsDestination(
      vscode.env.appName,
      vscode.env.uriScheme,
    );
    const owners = new Map<string, string>();
    for (const source of sources) {
      if (kind === 'agents' && !source.agentsPath) continue;
      const active = await this.getActiveCatalogUri(folder, source.id, kind);
      if (!(await exists(active))) {
        throw new Error(`a fonte “${source.id}” ainda não possui uma cópia válida de ${kind}`);
      }
      for (const [name, type] of await vscode.workspace.fs.readDirectory(active)) {
        if (kind === 'skills' && !(type & vscode.FileType.Directory)) continue;
        if (
          kind === 'agents' &&
          !isCompatibleAgentFile(name, type, target.agentFileExtension)
        ) continue;
        const owner = owners.get(name);
        if (owner) throw new Error(`o item ${kind === 'skills' ? '“' + name + '”' : 'de agentes “' + name + '”'} existe nas fontes “${owner}” e “${source.id}”`);
        owners.set(name, source.id);
      }
    }

    const globalOwners = this.configs.isGlobal(folder) ? await this.readGlobalOwners(folder, kind) : undefined;
    if (owners.size === 0 && (globalOwners ? Object.keys(globalOwners).length === 0 : (kind === 'skills' || previouslyManaged.size === 0))) {
      return;
    }

    const environmentRoot = vscode.Uri.joinPath(
      this.destinationBase(folder),
      this.configs.isGlobal(folder) ? globalRootDirectory(target, kind) : target.rootDirectory,
    );
    const destination = vscode.Uri.joinPath(
      environmentRoot,
      kind === 'skills' ? target.skillsDirectory : target.agentsDirectory,
    );
    const stagingRoot = globalOwners ? this.storage.getWorkspaceRoot(folder) : environmentRoot;
    const temporary = vscode.Uri.joinPath(stagingRoot, `${kind}-dex-next`);
    const backup = vscode.Uri.joinPath(stagingRoot, `${kind}-dex-backup`);
    if (globalOwners) {
      const existing = new Set<string>();
      for (const name of owners.keys()) {
        if (await exists(vscode.Uri.joinPath(destination, name))) existing.add(name);
      }
      const conflict = unmanagedEntryConflicts(owners.keys(), new Set(Object.keys(globalOwners)), existing)[0];
      if (conflict) throw new Error(`o item global “${conflict}” já existe e não é gerenciado pela Dex`);
    }
    await remove(temporary);
    await remove(backup);
    await vscode.workspace.fs.createDirectory(temporary);
    try {
      if (!globalOwners && await exists(destination)) {
        await copyDirectory(destination, temporary);
      }
      for (const name of managedEntriesToReplace(globalOwners ? Object.keys(globalOwners) : previouslyManaged, owners.keys())) {
        await remove(vscode.Uri.joinPath(temporary, name));
      }
      for (const source of sources) {
        if (kind === 'agents' && !source.agentsPath) continue;
        await copyDirectory(
          await this.getActiveCatalogUri(folder, source.id, kind),
          temporary,
          kind === 'agents'
            ? (name, type) =>
              isCompatibleAgentFile(name, type, target.agentFileExtension)
            : undefined,
        );
      }
      await vscode.workspace.fs.createDirectory(backup);
      if (globalOwners) {
        await vscode.workspace.fs.createDirectory(destination);
        const affected = managedEntriesToReplace(Object.keys(globalOwners), owners.keys());
        for (const name of affected) {
          const from = vscode.Uri.joinPath(destination, name);
          if (await exists(from)) await vscode.workspace.fs.copy(from, vscode.Uri.joinPath(backup, name), { overwrite: false });
        }
        try {
          for (const name of affected) await remove(vscode.Uri.joinPath(destination, name));
          for (const name of owners.keys()) await vscode.workspace.fs.copy(vscode.Uri.joinPath(temporary, name), vscode.Uri.joinPath(destination, name));
          await this.writeGlobalOwners(folder, kind, Object.fromEntries(owners));
        } catch (error) {
          for (const name of affected) await remove(vscode.Uri.joinPath(destination, name));
          for (const [name] of await vscode.workspace.fs.readDirectory(backup)) await vscode.workspace.fs.copy(vscode.Uri.joinPath(backup, name), vscode.Uri.joinPath(destination, name));
          throw error;
        }
        await remove(temporary);
        await remove(backup);
        return;
      }
      if (await exists(destination)) await copyDirectory(destination, backup);
      try {
        await replaceDirectoryContents(destination, temporary);
      } catch (error) {
        await replaceDirectoryContents(destination, backup);
        throw error;
      }
      await remove(temporary);
      await remove(backup);
    } catch (error) {
      await remove(temporary);
      throw error;
    }
  }

  private async collectManagedEntryNames(
    folder: vscode.WorkspaceFolder,
    sources: SyncSource[],
    kind: 'skills' | 'agents',
  ): Promise<Set<string>> {
    const names = new Set<string>();
    for (const source of sources) {
      if (kind === 'agents' && !source.agentsPath) continue;
      const active = await this.getActiveCatalogUri(folder, source.id, kind);
      if (!(await exists(active))) continue;
      for (const [name, type] of await vscode.workspace.fs.readDirectory(active)) {
        if (kind === 'agents' || type & vscode.FileType.Directory) names.add(name);
      }
    }
    return names;
  }

  private destinationBase(folder: vscode.WorkspaceFolder): vscode.Uri {
    return this.configs.isGlobal(folder) ? vscode.Uri.file(os.homedir()) : folder.uri;
  }

  private globalOwnersUri(folder: vscode.WorkspaceFolder, kind: 'skills' | 'agents'): vscode.Uri {
    return vscode.Uri.joinPath(this.storage.getWorkspaceRoot(folder), `managed-${kind}.json`);
  }

  private async readGlobalRevisions(folder: vscode.WorkspaceFolder): Promise<Record<string, string>> {
    const uri = vscode.Uri.joinPath(this.storage.getWorkspaceRoot(folder), 'installed-revisions.json');
    if (!(await exists(uri))) return {};
    return JSON.parse(new TextDecoder().decode(await vscode.workspace.fs.readFile(uri))) as Record<string, string>;
  }

  private async readGlobalOwners(folder: vscode.WorkspaceFolder, kind: 'skills' | 'agents'): Promise<Record<string, string>> {
    const uri = this.globalOwnersUri(folder, kind);
    if (!(await exists(uri))) return {};
    const value: unknown = JSON.parse(new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)));
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([name, owner]) => !name || name === '.' || name === '..' || name.includes('/') || name.includes('\\') || typeof owner !== 'string')) {
      throw new Error('registro de itens globais inválido');
    }
    return value as Record<string, string>;
  }

  private async writeGlobalOwners(folder: vscode.WorkspaceFolder, kind: 'skills' | 'agents', owners: Record<string, string>): Promise<void> {
    const uri = this.globalOwnersUri(folder, kind);
    await vscode.workspace.fs.createDirectory(this.storage.getWorkspaceRoot(folder));
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(JSON.stringify(owners, null, 2)));
  }

  private async removeGlobalSources(folder: vscode.WorkspaceFolder, sourceIds: readonly string[]): Promise<number> {
    const target = resolveSkillsDestination(vscode.env.appName, vscode.env.uriScheme);
    let removed = 0;
    for (const kind of ['skills', 'agents'] as const) {
      const owners = await this.readGlobalOwners(folder, kind);
      const destination = vscode.Uri.joinPath(this.destinationBase(folder), globalRootDirectory(target, kind), kind === 'skills' ? target.skillsDirectory : target.agentsDirectory);
      for (const [name, owner] of Object.entries(owners)) {
        if (!sourceIds.includes(owner)) continue;
        const uri = vscode.Uri.joinPath(destination, name);
        if (await exists(uri)) { await remove(uri); removed++; }
        delete owners[name];
      }
      await this.writeGlobalOwners(folder, kind, owners);
    }
    return removed;
  }

  private async getActiveCatalogUri(
    folder: vscode.WorkspaceFolder,
    sourceId: string,
    kind: 'skills' | 'agents',
  ): Promise<vscode.Uri> {
    const nested = kind === 'skills'
      ? this.storage.getActiveSkillsUri(folder, sourceId)
      : this.storage.getActiveAgentsUri(folder, sourceId);
    if (await exists(nested)) return nested;
    return kind === 'skills' ? this.storage.getActiveUri(folder, sourceId) : nested;
  }

  private async downloadAndInstall(
    folder: vscode.WorkspaceFolder,
    source: SyncSource,
    signal: AbortSignal,
  ): Promise<SourceSyncResult> {
    this.log(
      `Fonte “${source.id}”: consultando ${source.repository}, referência “${source.ref}”, pasta “${source.path}”.`,
    );
    const catalog = await this.provider.download(source, signal);
    this.log(
      `Fonte “${source.id}”: commit ${catalog.resolvedCommit.slice(0, 12)} resolvido; ${catalog.files.size} arquivo(s) baixado(s).`,
    );
    const validated = validateCatalog(source.id, catalog.files);
    for (const warning of validated.warnings) {
      this.log(`Fonte “${source.id}”: aviso: ${warning}`);
    }
    this.log(
      `Fonte “${source.id}”: catálogo válido com ${validated.skills.length} skill(s).`,
    );
    const skillFiles = new Set(
      validated.skills.flatMap((skill) => skill.files),
    );
    const installableCatalog = {
      ...catalog,
      files: new Map(
        [...catalog.files].filter(([path]) => skillFiles.has(path)),
      ),
    };
    const agentsCatalog = source.agentsPath
      ? await this.provider.download(
          source,
          signal,
          undefined,
          source.agentsPath,
          catalog.resolvedCommit,
        )
      : undefined;
    const metadata = await this.storage.install(
      folder,
      source,
      installableCatalog,
      agentsCatalog,
      validated.skills.length,
      agentsCatalog?.files.size ?? 0,
    );
    this.log(`Fonte “${source.id}”: cache local atualizado.`);
    return { sourceId: source.id, status: 'synced', metadata };
  }

  private log(message: string): void {
    this.output.appendLine(`[${new Date().toISOString()}] ${message}`);
  }

  private logError(source: SyncSource, error: unknown): void {
    const code = error instanceof GitHubSourceError ? ` [${error.code}]` : '';
    const message = error instanceof Error ? error.message : String(error);
    this.log(`Fonte “${source.id}”: falha${code}: ${message}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isCompatibleAgentFile(
  name: string,
  type: vscode.FileType,
  extension: '.json' | '.md',
): boolean {
  return Boolean(type & vscode.FileType.File) &&
    name.toLowerCase().endsWith(extension);
}

async function copyDirectory(
  source: vscode.Uri,
  destination: vscode.Uri,
  includeFile?: (name: string, type: vscode.FileType) => boolean,
): Promise<void> {
  await vscode.workspace.fs.createDirectory(destination);
  for (const [name, type] of await vscode.workspace.fs.readDirectory(source)) {
    const from = vscode.Uri.joinPath(source, name);
    const to = vscode.Uri.joinPath(destination, name);
    if (type & vscode.FileType.Directory) await copyDirectory(from, to, includeFile);
    else if (type & vscode.FileType.File && (!includeFile || includeFile(name, type))) {
      await vscode.workspace.fs.writeFile(to, await vscode.workspace.fs.readFile(from));
    }
  }
}

async function replaceDirectoryContents(
  destination: vscode.Uri,
  source: vscode.Uri,
): Promise<void> {
  await vscode.workspace.fs.createDirectory(destination);
  for (const [name] of await vscode.workspace.fs.readDirectory(destination)) {
    await vscode.workspace.fs.delete(vscode.Uri.joinPath(destination, name), {
      recursive: true,
    });
  }
  await copyDirectory(source, destination);
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
