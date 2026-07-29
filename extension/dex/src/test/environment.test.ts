import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSkillsDestination } from '../environment';

test('usa .agents/skills no Visual Studio Code', () => {
  assert.equal(
    resolveSkillsDestination('Visual Studio Code', 'vscode').relativePath,
    '.agents/skills',
  );
});

test('usa .kiro/skills quando o nome do aplicativo indica Kiro', () => {
  assert.equal(
    resolveSkillsDestination('Kiro', 'vscode').relativePath,
    '.kiro/skills',
  );
});

test('usa .kiro/skills quando o URI scheme indica Kiro', () => {
  assert.equal(
    resolveSkillsDestination('Code OSS', 'kiro').relativePath,
    '.kiro/skills',
  );
});
