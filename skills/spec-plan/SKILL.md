---
name: spec-plan
description: Cria e atualiza planos de implementação divididos em fases a partir de especificações consolidadas, gravando o resultado em `specs/nome-da-feature/nome-da-feature.plan.md`. Usar quando Codex precisar decompor uma feature especificada em etapas executáveis, ordenar dependências, indicar arquivos e componentes afetados, planejar testes e validações ou preparar um roteiro técnico antes de iniciar a implementação.
---

# Spec Plan

Transformar uma especificação consolidada em um roteiro técnico executável,
dividido em fases verificáveis. Produzir o plano em português do Brasil.

## Confirmar a entrada

Usar esta skill somente quando existir:

```text
specs/<feature>/<feature>.spec.md
```

Se a feature ainda não tiver estrutura, encaminhar para `spec-create`. Se
existirem apenas briefing ou questionário, ou se a especificação tiver uma
pendência material capaz de mudar a implementação, encaminhar para
`spec-refinement` antes de planejar.

Quando mais de uma feature puder corresponder ao pedido, listar as candidatas e
solicitar a escolha antes de editar arquivos.

## Preparar o contexto

Antes de escrever:

1. Ler o `AGENTS.md` aplicável e os arquivos indicados por ele.
2. Criar `specs/` quando ainda não existir.
3. Se `specs/readme.md` não existir, copiar integralmente o arquivo
   `assets/specs-readme.md` desta skill para esse caminho.
4. Preservar `specs/readme.md` sem alterações quando ele já existir.
5. Ler `specs/readme.md` antes de continuar.
6. Ler integralmente briefing, questionário e especificação da feature.
7. Ler o plano existente, quando houver, preservando tarefas já concluídas.
8. Inspecionar código, manifests, contratos, traduções, migrações, testes e
   documentação relacionados.
9. Identificar comandos reais de build, teste, lint e validação do projeto.
10. Mapear dependências entre componentes e restrições de compatibilidade,
   segurança, dados e implantação.

Usar `rg` e `rg --files` para descoberta. Basear o plano em caminhos, símbolos e
comandos existentes sempre que puderem ser confirmados. Não inventar arquivos,
APIs ou ferramentas como se já fizessem parte do projeto.

## Definir as fases

Dividir o trabalho em fases que produzam avanços coerentes e verificáveis. Cada
fase deve:

- ter objetivo e resultado observável;
- declarar dependências de fases anteriores;
- agrupar alterações que precisam evoluir juntas;
- conter tarefas pequenas o bastante para execução sem nova decomposição;
- incluir testes e validações proporcionais ao risco da própria fase;
- terminar com um critério de conclusão objetivo.

Ordenar fundações antes de consumidores: contratos e modelos antes de integrações,
integrações antes de interface, e implementação antes de documentação final.
Adaptar essa ordem à arquitetura real. Não criar uma fase genérica de
"preparação" quando a descoberta já puder ser incorporada à primeira fase útil.

Indicar tarefas que podem ocorrer em paralelo somente quando não modificarem os
mesmos contratos ou arquivos e não dependerem do resultado uma da outra.

## Criar o arquivo de plano

Gravar o resultado em:

```text
specs/<feature>/<feature>.plan.md
```

Preservar o nome de diretório já usado pela feature. Não criar outros artefatos
de planejamento fora dessa pasta.

Usar esta estrutura, adaptando seções opcionais à feature:

```markdown
# Plano de Implementação — <Nome da feature>

## Referências

- Especificação: `<feature>.spec.md`
- Outros documentos e contratos relevantes

## Estratégia

<Resumo da abordagem, ordem e principais decisões técnicas confirmadas.>

## Fases

### Fase 1 — <Resultado da fase>

**Objetivo:** <resultado observável>

**Dependências:** nenhuma | Fase N

**Alterações:**

- [ ] <tarefa concreta, com caminho ou componente quando conhecido>

**Validação:**

- [ ] `<comando real>` — <resultado esperado>

**Critério de conclusão:** <condição verificável>

## Paralelismo e ordem de execução

<Dependências críticas e tarefas seguramente paralelizáveis.>

## Definição de pronto

- [ ] <condição final derivada da especificação>
```

Adicionar riscos, migração, rollout, observabilidade ou rollback somente quando
forem relevantes. Referenciar critérios de aceitação da especificação nas fases
que os satisfazem, sem copiá-los integralmente.

## Escrever tarefas executáveis

Para cada tarefa:

- começar com verbo de ação;
- indicar o comportamento ou artefato produzido;
- citar caminhos e componentes confirmados;
- explicitar contratos que outra fase consumirá;
- associar testes à alteração correspondente;
- registrar documentação e localização quando afetadas.

Evitar tarefas vagas como "implementar backend", "ajustar frontend" ou "testar
tudo". Não incluir trabalho fora do escopo da especificação. Não converter uma
sugestão não aprovada em decisão obrigatória.

Se uma escolha técnica reversível não estiver definida, registrar a investigação
como primeira tarefa da fase afetada, com resultado esperado. Se a escolha puder
mudar escopo, comportamento, dados, segurança ou compatibilidade, interromper o
planejamento e encaminhar a decisão para refinamento.

## Atualizar um plano existente

Ao atualizar `<feature>.plan.md`:

1. preservar caixas `[x]` de tarefas comprovadamente concluídas;
2. reconciliar o plano com a especificação atual;
3. remover tarefas futuras que ficaram obsoletas;
4. reordenar somente o necessário para refletir novas dependências;
5. não marcar uma tarefa como concluída apenas porque o código parece existir;
6. não usar o plano como changelog de decisões.

## Validar

Antes de concluir:

1. confirmar que todas as fases derivam do escopo da especificação;
2. verificar que dependências e ordem não são circulares;
3. confirmar que cada fase possui validação e critério de conclusão;
4. conferir caminhos, comandos e referências citados;
5. procurar placeholders, tarefas duplicadas e termos vagos;
6. executar `git diff --check` e revisar o diff do plano.

Não implementar a feature durante o planejamento, salvo pedido explícito do
usuário. Para uma alteração exclusivamente documental, não executar testes do
produto.

## Concluir

Informar o caminho do plano criado ou atualizado, resumir as fases e apontar
qualquer decisão que ainda impeça o início da implementação. Não declarar o
plano pronto enquanto houver uma pendência material sem encaminhamento.
