import assert from 'node:assert/strict';
import test from 'node:test';
import { CatalogValidationError, validateCatalog } from '../catalog-validator';

test('valida skills sem exigir manifesto de versão do catálogo', () => {
  const catalog = validateCatalog(
    'catalog',
    files({
      'alpha/SKILL.md': '---\nname: alpha\ndescription: Primeira skill\n---\n',
      'alpha/reference.md': '# Referência',
      'changelog.md': '# Mudanças',
    }),
  );
  assert.deepEqual(catalog, {
    skills: [
      { name: 'alpha', files: ['alpha/SKILL.md', 'alpha/reference.md'] },
    ],
    warnings: [],
  });
});

test('ignora diretório auxiliar sem SKILL.md quando há skills válidas', () => {
  const catalog = validateCatalog(
    'catalog',
    files({
      'alpha/SKILL.md': '---\nname: alpha\ndescription: Texto\n---\n',
      'references/guide.md': '# Guia',
    }),
  );

  assert.deepEqual(catalog.skills, [
    { name: 'alpha', files: ['alpha/SKILL.md'] },
  ]);
  assert.deepEqual(catalog.warnings, [
    'o diretório “references” foi ignorado porque não contém SKILL.md',
  ]);
});

test('rejeita catálogo sem nenhuma skill válida', () => {
  assert.throws(
    () => validateCatalog('catalog', files({ 'references/guide.md': 'texto' })),
    /nenhuma skill válida com SKILL.md/,
  );
});

test('rejeita name diferente do diretório e description ausente', () => {
  assert.throws(
    () =>
      validateCatalog(
        'catalog',
        files({
          'alpha/SKILL.md': '---\nname: beta\ndescription: Texto\n---\n',
        }),
      ),
    /esperado “alpha”/,
  );
  assert.throws(
    () =>
      validateCatalog(
        'catalog',
        files({ 'alpha/SKILL.md': '---\nname: alpha\n---\n' }),
      ),
    (error: unknown) =>
      error instanceof CatalogValidationError && /description/.test(error.message),
  );
});

function files(entries: Record<string, string>): Map<string, Uint8Array> {
  return new Map(
    Object.entries(entries).map(([path, contents]) => [
      path,
      new TextEncoder().encode(contents),
    ]),
  );
}
