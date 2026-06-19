import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand('dex.open', () => {
    void vscode.window.showInformationMessage('Dex está pronto para começar.');
  });

  context.subscriptions.push(openCommand);
}

export function deactivate(): void {}
