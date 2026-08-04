# Plano de Implementação — extension-integration

## Referências

- Especificação:
  `.specs/dex/extension-integration/extension-integration.spec.md`
- Skill distribuída: `skills/dex-spec-manage/SKILL.md`
- Contrato de comandos: `extension/dex/package.json`
- Ativação da extensão: `extension/dex/src/extension.ts`

## Estratégia

Definir primeiro o contrato JSON e suas regras na skill distribuída. Em seguida,
implementar na extensão um módulo testável para parsing, validação, status e
ordenação, conectá-lo ao workspace e aos Quick Picks, e finalizar com
localização, documentação, changelogs e versionamento do catálogo. A gravação
será incremental e substitutiva, por arquivo temporário no mesmo diretório.

## Fases

### Fase 1 — Contrato JSON na skill

**Objetivo:** fazer a `dex-spec-manage` manter e consumir o JSON versionado sem
ultrapassar `.specs/dex/`.

**Dependências:** nenhuma.

**Alterações:**

- [x] Atualizar `skills/dex-spec-manage/SKILL.md` com o modelo de dados, geração,
  preservação por ID, cálculo de status, importação e conflitos.
- [x] Atualizar `skills/dex-spec-manage/assets/specs-readme.md` com o novo
  artefato e sua responsabilidade.
- [x] Validar que as instruções não permitem leitura ou escrita fora de
  `.specs/dex/` e cobrem CA-01 a CA-04.

**Validação:**

- [x] `git diff --check` — os documentos não contêm erros de whitespace.
- [x] `rg -n "schemaVersion|partially-answered|refinement-questionnaire.json" skills/dex-spec-manage` — o contrato aparece na skill e no template.

**Critério de conclusão:** a skill descreve de forma executável a manutenção e
a importação do JSON, inclusive conflitos e versões incompatíveis.

### Fase 2 — Modelo e validação na extensão

**Objetivo:** disponibilizar funções puras e testadas para consumir o contrato
JSON com segurança.

**Dependências:** Fase 1.

**Alterações:**

- [x] Criar módulo em `extension/dex/src/` com tipos, parser estrito,
  serialização, cálculo de status e ordenação dos questionários.
- [x] Criar testes em `extension/dex/src/test/` para documentos válidos,
  schemas incompatíveis, campos inválidos, IDs duplicados e transições de
  status.

**Validação:**

- [x] `npm test` em `extension/dex/` — testes do contrato e regressão da suíte
  passam.

**Critério de conclusão:** JSON inválido ou incompatível é rejeitado sem mutação
e documentos válidos possuem status derivável e ordenação determinística.

### Fase 3 — Descoberta, Quick Picks e persistência

**Objetivo:** entregar o comando funcional de resposta e revisão em workspaces
de uma ou várias raízes.

**Dependências:** Fase 2.

**Alterações:**

- [x] Implementar descoberta limitada a
  `.specs/dex/*/*.refinement-questionnaire.json` em todas as raízes.
- [x] Implementar seleção ordenada, respostas por sugestão ou texto livre,
  revisão e cancelamento com persistência incremental.
- [x] Implementar gravação substitutiva segura e mensagens de falha no canal
  Dex.
- [x] Registrar `dex.answerSpecQuestionnaire` em
  `extension/dex/src/extension.ts` e `extension/dex/package.json`.
- [x] Adicionar títulos localizados em `package.nls.json` e
  `package.nls.pt-br.json`.

**Validação:**

- [x] `npm run compile` em `extension/dex/` — TypeScript compila.
- [x] `npm run check` em `extension/dex/` — tipos válidos sem emissão.
- [x] `npm test` em `extension/dex/` — suíte completa passa.

**Critério de conclusão:** o comando satisfaz CA-05 a CA-11 e nunca sobrescreve
questionários rejeitados pelo parser.

### Fase 4 — Documentação e versionamento

**Objetivo:** documentar o fluxo entregue e publicar metadados coerentes no
repositório, sem executar publicação externa.

**Dependências:** Fases 1 a 3.

**Alterações:**

- [x] Atualizar `extension/dex/README.md` e `README.dev.md` com uso, contrato e
  arquitetura do comando.
- [x] Registrar a funcionalidade em `extension/dex/CHANGELOG.md`.
- [x] Incrementar `skills/dex.json` de `3.0.0` para `3.1.0` e criar a seção
  correspondente em `skills/changelog.md`.
- [x] Marcar neste plano somente tarefas comprovadas pelas validações.

**Validação:**

- [x] Parsear `extension/dex/package.json`, `package-lock.json` e
  `skills/dex.json` como JSON.
- [x] `git diff --check` — todo o diff está formatado.
- [x] Revisar `git diff` e `git status --short` — somente arquivos no escopo
  foram alterados.

**Critério de conclusão:** CA-12 está atendido, `skillsVersion` corresponde à
seção mais recente do changelog e não houve commit, tag, release ou publicação.

## Paralelismo e ordem de execução

As fases 1 e 2 podem evoluir em paralelo depois que o formato do contrato estiver
fixado nesta especificação. A Fase 3 depende do parser da Fase 2. A documentação
final e o versionamento dependem do comportamento efetivamente validado nas
fases anteriores.

## Definição de pronto

- [x] Todos os critérios CA-01 a CA-12 estão cobertos pela implementação,
  instruções ou testes correspondentes.
- [x] `npm run compile`, `npm run check` e `npm test` passam em
  `extension/dex/`.
- [x] Skill, extensão, localização, documentação e changelogs estão coerentes.
- [x] Não há decisão essencial pendente nem alteração fora do escopo.
