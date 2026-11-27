import assert from 'node:assert/strict';
import test from 'node:test';
import { globalRootDirectory, resolveSkillsDestination } from '../environment';

test('usa .agents/skills no Visual Studio Code', () => {
  const destination = resolveSkillsDestination('Visual Studio Code', 'vscode');
  assert.equal(destination.relativePath, '.agents/skills');
  assert.equal(destination.agentFileExtension, '.md');
});

test('usa .kiro/skills quando o nome do aplicativo indica Kiro', () => {
  const destination = resolveSkillsDestination('Kiro', 'vscode');
  assert.equal(destination.relativePath, '.kiro/skills');
  assert.equal(destination.agentFileExtension, '.json');
});

test('usa .kiro/skills quando o URI scheme indica Kiro', () => {
  assert.equal(
    resolveSkillsDestination('Code OSS', 'kiro').relativePath,
    '.kiro/skills',
  );
});

test('resolve diretórios globais de skills e agentes por editor', () => {
  const vscode = resolveSkillsDestination('Visual Studio Code', 'vscode');
  const kiro = resolveSkillsDestination('Kiro', 'kiro');
  assert.equal(globalRootDirectory(vscode, 'skills'), '.agents');
  assert.equal(globalRootDirectory(vscode, 'agents'), '.copilot');
  assert.equal(globalRootDirectory(kiro, 'skills'), '.kiro');
  assert.equal(globalRootDirectory(kiro, 'agents'), '.kiro');
});
