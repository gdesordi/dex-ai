---
name: spec-manage
description: Refina briefings em questionários, consolida respostas em especificações implementáveis e mantém especificações existentes sincronizadas com decisões, correções ou mudanças aprovadas. Usar quando Codex precisar esclarecer requisitos ambíguos, concluir um questionário respondido, criar a primeira `.spec.md`, atualizar requisitos ou critérios de aceitação, reconciliar especificação e código ou registrar decisões posteriores em `specs/nome-da-feature/`.
---

# Spec Manage

Gerenciar o ciclo de vida da especificação funcional, desde o refinamento do
briefing até mudanças posteriores. Produzir os artefatos em português do Brasil.

## Estrutura dos artefatos

Usar uma pasta por feature:

```text
specs/
└── <feature>/
    ├── <feature>.briefing.md
    ├── <feature>.refinement-questionnaire.md
    ├── <feature>.spec.md
    └── <feature>.plan.md
```

Preservar nomes já estabelecidos em `specs/`. Tratar o briefing como fonte
original, o questionário como registro de decisões e a especificação como
descrição consolidada do comportamento atual aprovado. Não usar a especificação
como changelog.

Se a feature ainda não tiver estrutura, encaminhar para `spec-create`. Não criar
nem atualizar o plano de implementação; esse artefato pertence a `spec-plan`.

## Preparar o contexto

Antes de escrever:

1. Ler o `AGENTS.md` aplicável e os arquivos diretamente indicados por ele.
2. Criar `specs/` quando ainda não existir.
3. Se `specs/readme.md` não existir, copiar integralmente
   `assets/specs-readme.md` para esse caminho.
4. Preservar `specs/readme.md` sem alterações quando ele já existir e lê-lo.
5. Ler integralmente briefing, questionário, especificação e plano existentes.
6. Ler a fonte da mudança indicada pelo usuário, quando houver.
7. Inspecionar código, manifests, contratos, traduções, testes e documentação
   relacionados à feature.
8. Consultar histórico ou diff quando ajudarem a distinguir decisão aprovada de
   desvio acidental.

Usar `rg` e `rg --files` para descoberta. Não transformar detalhes incidentais
do código em requisitos de produto nem assumir que o código é a fonte de verdade
apenas por ser o estado mais recente.

Quando a fonte inicial estiver fora de `specs/`, copiar seu conteúdo sem
alterações para `<feature>.briefing.md`. Não remover nem modificar a fonte
original, salvo pedido explícito.

## Escolher a operação pelo estado

Executar somente uma operação por vez. Não escolher a operação apenas pelo verbo
usado no pedido; inspecionar os artefatos existentes.

### 1. Refinar decisões abertas

Usar quando não existir `.spec.md` e ainda houver decisões essenciais sem
resposta, ou quando uma mudança posterior introduzir ambiguidade material.

1. Extrair fatos confirmados, contradições, lacunas e termos vagos.
2. Confrontar as fontes com o comportamento e as convenções do projeto.
3. Criar ou atualizar `<feature>.refinement-questionnaire.md`.
4. Não criar nem alterar a especificação como se a decisão estivesse fechada.
5. Informar quais respostas essenciais impedem a consolidação.

### 2. Consolidar a primeira especificação

Usar quando não existir `.spec.md` e todas as perguntas essenciais estiverem
respondidas. Um pedido para “atualizar a spec” depois de responder o questionário
deve entrar nesta operação, mesmo que a especificação ainda não exista.

1. Resolver cada requisito conforme as respostas, inclusive `manter sugestão`.
2. Criar `<feature>.spec.md`.
3. Remover pendências resolvidas.
4. Preservar o questionário respondido como registro das decisões.
5. Manter como pendência apenas questão nova e realmente bloqueante, explicando
   por que surgiu.

### 3. Atualizar uma especificação consolidada

Usar quando `.spec.md` já existir e houver comportamento novo, corrigido ou
explicitamente confirmado.

Fontes possíveis incluem decisão do usuário, questionário respondido, issue,
documento, comentário, implementação aprovada, testes representativos ou
correção editorial.

Para cada mudança confirmada:

1. localizar todas as seções afetadas;
2. substituir requisitos obsoletos em vez de apenas acrescentar exceções;
3. revisar escopo, requisitos, regras, erros e falhas parciais;
4. atualizar critérios de aceitação e testes esperados;
5. revisar decisões técnicas somente quando necessário;
6. remover contradições e pendências resolvidas.

Preservar estrutura e terminologia existentes quando continuarem corretas.
Renumerar critérios de aceitação somente para evitar duplicidade ou referências
quebradas.

## Escrever o questionário

Começar com:

```markdown
# Questionário de Refinamento — <Nome da feature>

## Como responder

Responda abaixo de cada pergunta, mantendo a numeração. Respostas curtas são
suficientes. Quando a sugestão estiver adequada, responda `manter sugestão`.
Itens marcados como **Essencial** afetam diretamente a implementação.
```

Agrupar perguntas por assunto e numerá-las hierarquicamente. Para cada pergunta:

- perguntar apenas uma decisão;
- explicar a ambiguidade quando ela não for óbvia;
- marcar **Essencial** quando a resposta alterar escopo, comportamento, dados,
  segurança, compatibilidade ou critérios de aceitação;
- oferecer uma sugestão objetiva e coerente com o projeto;
- terminar com `Resposta:` em uma linha própria.

Evitar perguntas respondidas pelas fontes ou pelo código. Preferir poucas
perguntas de alto impacto. Fazer inferências somente para detalhes reversíveis e
de baixo impacto, identificando-as como decisões técnicas na especificação.

## Avaliar mudanças posteriores

Atualizar diretamente somente quando o novo comportamento estiver confirmado e
for objetivo o bastante para produzir requisitos verificáveis. Diante de dúvida
material, registrar ou atualizar a pergunta correspondente no questionário e
aguardar a resposta.

Resolver conflitos nesta ordem:

1. decisão explícita mais recente do usuário;
2. decisão aprovada na fonte de mudança indicada;
3. questionário respondido;
4. especificação consolidada atual;
5. briefing original;
6. comportamento observado no código.

Quando uma atualização substituir uma decisão registrada no questionário,
preservar a resposta histórica e acrescentar:

```markdown
## Atualizações posteriores

### AT-01 — <título objetivo>

- Decisão anterior: <resumo>
- Decisão atual: <resumo>
- Origem: <pedido, issue, documento ou implementação aprovada>
```

Continuar a numeração existente. Não registrar correções puramente editoriais.

## Escrever a especificação

Adaptar as seções ao tipo da feature, mantendo no mínimo:

1. **Objetivo e contexto**;
2. **Referências**;
3. **Escopo** incluído e excluído;
4. **Requisitos funcionais**;
5. **Regras de negócio**;
6. **Tratamento de erros**;
7. **Critérios de aceitação**, numerados como `CA-01`;
8. **Testes esperados**;
9. **Decisões técnicas** necessárias;
10. **Pendências**, somente quando existirem.

Adicionar modelo de dados, interface, integrações, migração, observabilidade,
compatibilidade ou rollout somente quando relevantes. Escrever requisitos com
`deve` e `não deve`, separar decisões de produto de sugestões de implementação e
referenciar caminhos e contratos reais quando isso ajudar a implementação.

## Preservar rastreabilidade

- Não modificar `<feature>.briefing.md` retroativamente.
- Preservar respostas existentes no questionário.
- Não criar changelog dentro da pasta da feature.
- Não copiar grandes trechos de código para a especificação.
- Diferenciar comportamento aprovado de detalhe de implementação.
- Não implementar a feature, salvo pedido explícito do usuário.

## Tratar plano existente

Depois de criar ou alterar `<feature>.spec.md`, verificar se
`<feature>.plan.md` existe. Se existir, informar que o plano pode estar
desatualizado e sugerir `spec-plan` para reconciliá-lo. Não editar o plano
automaticamente.

## Validar e concluir

Antes de concluir:

1. reler briefing, questionário e especificação em conjunto;
2. procurar requisitos contraditórios, duplicados e placeholders;
3. confirmar que toda mudança funcional possui critério de aceitação;
4. confirmar que os testes esperados cobrem o risco alterado;
5. verificar links, caminhos e pendências;
6. executar `git diff --check` e revisar o diff.

Considerar a especificação concluída somente quando não houver decisão essencial
aberta capaz de mudar materialmente a implementação. Informar os arquivos
criados ou atualizados, as principais decisões e, quando aplicável, o plano que
pode precisar de atualização. Para mudanças apenas documentais, não executar
testes do produto.
