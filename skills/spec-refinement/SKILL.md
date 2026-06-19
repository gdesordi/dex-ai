---
name: spec-refinement
description: Refina briefings, ideias e documentos iniciais de features em questionários de decisões e especificações implementáveis, organizados em `specs/nome-da-feature/`. Usar quando Codex precisar esclarecer requisitos ambíguos, preparar uma feature para implementação, importar briefings existentes, concluir um questionário de refinamento respondido ou atualizar a especificação final com decisões confirmadas.
---

# Spec Refinement

Transformar um briefing incompleto em decisões explícitas e, depois das
respostas essenciais, em uma especificação pronta para implementação. Produzir
todos os artefatos em português do Brasil.

## Estrutura dos artefatos

Usar uma pasta por feature:

```text
specs/
└── <feature>/
    ├── <feature>.briefing.md
    ├── <feature>.refinement-questionnaire.md
    └── <feature>.spec.md
```

Normalizar `<feature>` em kebab-case. Preservar nomes já estabelecidos quando a
feature já existir em `specs/`.

- `<feature>.briefing.md`: fonte original preservada, sem refinamento embutido.
- `<feature>.refinement-questionnaire.md`: perguntas, sugestões e respostas que
  registram as decisões do refinamento.
- `<feature>.spec.md`: especificação consolidada, criada somente quando todas as
  perguntas essenciais tiverem resposta.

Não criar arquivos auxiliares fora dessa estrutura.

## Preparar o contexto

Antes de escrever:

1. Ler o `AGENTS.md` aplicável e todos os arquivos diretamente indicados por
   ele.
2. Criar `specs/` quando ainda não existir.
3. Se `specs/readme.md` não existir, copiar integralmente o arquivo
   `assets/specs-readme.md` desta skill para esse caminho.
4. Preservar `specs/readme.md` sem alterações quando ele já existir.
5. Ler `specs/readme.md` antes de continuar.
6. Ler o briefing inteiro.
7. Inspecionar `specs/` para preservar convenções e refinamentos existentes.
8. Localizar o código, manifests, traduções, testes e documentação relacionados
   à feature.
9. Identificar comportamento atual, restrições técnicas e padrões reutilizáveis.

Usar `rg` e `rg --files` para descoberta. Não transformar detalhes incidentais
da implementação atual em requisitos de produto sem justificativa.

Quando a fonte estiver fora de `specs/`, copiar seu conteúdo sem alterações para
`<feature>.briefing.md`. Não remover nem modificar a fonte original, salvo pedido
explícito do usuário.

## Escolher a etapa

Executar somente uma das etapas abaixo por vez.

### Etapa 1 — Criar ou atualizar o questionário

Usar quando ainda existirem decisões essenciais sem resposta.

1. Extrair do briefing fatos confirmados, contradições, lacunas e termos vagos.
2. Confrontar o briefing com o comportamento e as convenções do projeto.
3. Criar ou atualizar `<feature>.refinement-questionnaire.md`.
4. Não criar a especificação final nesta etapa.
5. Informar ao usuário que o questionário precisa ser respondido para concluir
   o refinamento.

Se uma especificação preliminar já existir, não a tratar como final enquanto
restarem perguntas essenciais. Atualizá-la apenas na Etapa 2.

### Etapa 2 — Consolidar a especificação

Usar quando o questionário contiver resposta para todas as perguntas essenciais.

1. Ler novamente briefing, questionário respondido, diretrizes e código
   relacionado.
2. Resolver cada requisito conforme as respostas, inclusive respostas como
   `manter sugestão`.
3. Criar ou atualizar `<feature>.spec.md`.
4. Remover da especificação pendências já resolvidas.
5. Preservar o questionário respondido como registro das decisões.
6. Manter como pendência apenas uma questão nova e realmente bloqueante,
   explicando por que ela surgiu.

Não implementar a feature durante o refinamento, salvo pedido explícito do
usuário.

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
- explicar brevemente a ambiguidade quando ela não for óbvia;
- marcar **Essencial** quando a resposta alterar escopo, comportamento, dados,
  segurança, compatibilidade ou critérios de aceitação;
- oferecer uma sugestão objetiva e coerente com o projeto;
- terminar com `Resposta:` em uma linha própria.

Evitar perguntas respondidas pelo briefing, pelo código ou pelas diretrizes.
Preferir poucas perguntas de alto impacto a listas especulativas. Não ocultar
uma decisão de produto dentro de uma sugestão técnica.

## Tratar ambiguidades

Nunca converter uma suposição relevante em requisito confirmado.

Quando houver ambiguidade:

1. registrar a pergunta no questionário;
2. apresentar um default como `Sugestão:`;
3. explicar o efeito da escolha quando necessário;
4. aguardar a resposta antes de fechar a especificação.

Fazer inferências apenas para detalhes reversíveis e de baixo impacto. Identificar
essas inferências como decisões técnicas na especificação, não como fatos do
briefing.

## Escrever a especificação

Adaptar as seções ao tipo da feature, mantendo no mínimo:

1. **Objetivo e contexto** — problema, público e resultado esperado.
2. **Referências** — briefing, questionário, diretrizes e documentos relevantes.
3. **Escopo** — itens incluídos e não incluídos.
4. **Requisitos funcionais** — comportamentos observáveis e fluxos.
5. **Regras de negócio** — validações, estados, permissões e invariantes.
6. **Tratamento de erros** — cancelamentos, falhas parciais e mensagens.
7. **Critérios de aceitação** — cenários verificáveis, numerados como `CA-01`.
8. **Testes esperados** — cobertura proporcional ao risco.
9. **Decisões técnicas** — somente as necessárias para orientar a implementação.
10. **Pendências** — omitir quando todas as decisões estiverem concluídas.

Adicionar modelo de dados, interface, integrações, migração, observabilidade ou
compatibilidade somente quando forem relevantes.

Escrever requisitos de forma objetiva usando `deve` e `não deve`. Separar
decisões de produto de sugestões de implementação. Referenciar nomes e caminhos
reais encontrados no repositório quando isso ajudar quem implementará.

## Critério de conclusão

Considerar o refinamento concluído somente quando:

- todas as perguntas essenciais estiverem respondidas;
- briefing, questionário e especificação estiverem consistentes;
- o escopo incluído e excluído estiver explícito;
- fluxos principais, cancelamentos e erros estiverem definidos;
- critérios de aceitação forem verificáveis;
- não houver pendência conhecida capaz de mudar materialmente a implementação.

Ao concluir, informar os arquivos criados ou atualizados e resumir as principais
decisões consolidadas. Para mudanças somente documentais, não executar testes de
código; validar estrutura, links, placeholders e consistência textual.
