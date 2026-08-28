import * as vscode from 'vscode';
import { SyncSource } from './sync-types';
import { WorkspaceConfigManager } from './workspace-config';

export type SourcesTreeNode =
  | { kind: 'folder'; folder: vscode.WorkspaceFolder }
  | {
      kind: 'source';
      folder: vscode.WorkspaceFolder;
      source: SyncSource;
    };

export class SourcesTreeProvider
  implements vscode.TreeDataProvider<SourcesTreeNode>, vscode.Disposable
{
  private readonly emitter =
    new vscode.EventEmitter<SourcesTreeNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;
  private readonly subscription: vscode.Disposable;

  constructor(private readonly configs: WorkspaceConfigManager) {
    this.subscription = configs.onDidChange(() => this.refresh());
  }
  dispose(): void { this.subscription.dispose(); this.emitter.dispose(); }
  refresh(): void { this.emitter.fire(undefined); }

  getTreeItem(node: SourcesTreeNode): vscode.TreeItem {
    if (node.kind === 'folder') {
      return new vscode.TreeItem(node.folder.name, vscode.TreeItemCollapsibleState.Expanded);
    }
    const item = new vscode.TreeItem(node.source.id, vscode.TreeItemCollapsibleState.None);
    const state = node.source.enabled ? 'ativa' : 'inativa';
    item.description = node.source.enabled
      ? `${state} · ${node.source.ref} · ${node.source.path}`
      : state;
    item.tooltip = `Fonte ${state}\n${node.source.repository}\nref: ${node.source.ref}\npath: ${node.source.path}`;
    item.contextValue = node.source.enabled
      ? 'dexSourceEnabled'
      : 'dexSourceDisabled';
    item.iconPath = new vscode.ThemeIcon(
      node.source.enabled ? 'pass-filled' : 'circle-slash',
      new vscode.ThemeColor(
        node.source.enabled ? 'charts.green' : 'disabledForeground',
      ),
    );
    return item;
  }

  async getChildren(node?: SourcesTreeNode): Promise<SourcesTreeNode[]> {
    if (!node) return (vscode.workspace.workspaceFolders ?? []).map((folder) => ({ kind: 'folder', folder }));
    if (node.kind === 'source') return [];
    try {
      const { config } = await this.configs.read(node.folder);
      return config.sources.map((source) => ({ kind: 'source', folder: node.folder, source }));
    } catch { return []; }
  }
}

export function isSourceNode(
  value: unknown,
): value is Extract<SourcesTreeNode, { kind: 'source' }> {
  return typeof value === 'object' && value !== null && (value as { kind?: unknown }).kind === 'source';
}
