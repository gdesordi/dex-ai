---
name: spec-update
description: Atualiza especificações já consolidadas em `specs/nome-da-feature/` quando requisitos confirmados, decisões posteriores, correções ou mudanças de implementação alterarem o comportamento documentado. Usar quando Codex precisar manter um arquivo `.spec.md` sincronizado com uma mudança aprovada, revisar divergências entre especificação e código, atualizar critérios de aceitação e testes esperados ou registrar a substituição de uma decisão anterior sem reescrever o briefing original.
---

# Spec Update

Manter uma especificação consolidada como descrição coerente do comportamento
atual e aprovado. Produzir os artefatos em português do Brasil e preservar o
formato definido por `spec-refinement`.

## Limites da skill

Usar esta skill somente quando já existir:

```text
specs/<feature>/<feature>.spec.md
```

Se existir apenas o briefing, encaminhar o próximo passo para `spec-refinement`.
Se a feature ainda não tiver estrutura, encaminhar para `spec-create`.

Não implementar mudanças no produto, salvo pedido explícito do usuário. Não
alterar o briefing original para fazê-lo concordar retroativamente com decisões
posteriores.

## Identificar a feature e a mudança

Obter do pedido:

1. a feature cuja especificação deve ser atualizada;
2. a fonte da mudança;
3. o comportamento novo ou corrigido.

A fonte pode ser:

- uma decisão explícita do usuário;
- um questionário respondido;
- uma issue, documento ou comentário indicado pelo usuário;
- uma mudança de código ou diff;
- testes que passaram a representar o comportamento aprovado;
- uma correção editorial sem mudança funcional.

Se mais de uma feature puder corresponder ao pedido, listar as candidatas e
solicitar a escolha antes de editar.

## Preparar o contexto

Antes de atualizar:

1. Ler o `AGENTS.md` aplicável e todos os arquivos diretamente indicados por
   ele.
2. Criar `specs/` quando ainda não existir.
3. Se `specs/readme.md` não existir, copiar integralmente o arquivo
   `assets/specs-readme.md` desta skill para esse caminho.
4. Preservar `specs/readme.md` sem alterações quando ele já existir.
5. Ler `specs/readme.md` antes de continuar.
6. Ler integralmente briefing, questionário e especificação da feature.
7. Ler a fonte da mudança indicada pelo usuário.
8. Inspecionar código, manifests, traduções, testes e documentação relacionados.
9. Consultar o histórico ou diff relevante quando ele ajudar a distinguir uma
   mudança intencional de um desvio acidental.

Usar `rg` e `rg --files` para descoberta. Não assumir que o código é a fonte de
verdade apenas por ser o estado mais recente do repositório.

## Avaliar se a atualização está decidida

Atualizar diretamente somente quando o novo comportamento estiver confirmado e
for suficientemente objetivo para produzir requisitos verificáveis.

Exemplos de mudança confirmada:

- o usuário determina explicitamente o novo comportamento;
- o usuário pede para documentar uma implementação específica já aprovada;
- uma resposta do questionário substitui uma sugestão anterior;
- a mudança é puramente editorial e não altera significado.

Não fechar uma decisão quando houver dúvida material sobre escopo,
compatibilidade, dados, segurança, fluxo, erro ou critério de aceitação.

Quando houver ambiguidade material:

1. não alterar a especificação como se a decisão estivesse fechada;
2. explicar objetivamente a divergência encontrada;
3. adicionar ou atualizar a pergunta correspondente em
   `<feature>.refinement-questionnaire.md`;
4. marcar a pergunta como **Essencial** quando ela puder alterar materialmente a
   implementação;
5. sugerir `spec-refinement` para concluir a decisão.

## Hierarquia das fontes

Usar esta prioridade ao resolver conflitos:

1. decisão explícita mais recente do usuário;
2. decisão aprovada na fonte de mudança indicada;
3. questionário respondido;
4. especificação consolidada atual;
5. briefing original;
6. comportamento observado no código.

O código pode revelar divergências, mas não substitui silenciosamente uma
decisão de produto. Se o usuário pedir explicitamente para alinhar a
especificação ao código, tratar esse pedido como decisão mais recente.

## Atualizar a especificação

Editar `<feature>.spec.md` como documento de estado atual, não como changelog.

Para cada mudança confirmada:

1. localizar todas as seções afetadas;
2. substituir requisitos obsoletos em vez de apenas acrescentar exceções;
3. remover contradições e referências que deixaram de valer;
4. atualizar escopo incluído e excluído;
5. atualizar requisitos funcionais e regras de negócio;
6. revisar cancelamentos, erros e falhas parciais;
7. atualizar critérios de aceitação numerados;
8. atualizar testes esperados na mesma proporção;
9. revisar decisões técnicas somente quando a mudança as afetar;
10. remover pendências resolvidas e manter apenas as ainda abertas.

Preservar a estrutura e a terminologia existentes quando continuarem corretas.
Renumerar critérios de aceitação somente se necessário para evitar números
duplicados ou referências quebradas.

## Registrar decisões posteriores

Quando a atualização substituir uma decisão registrada no questionário, não
apagar a resposta histórica. Acrescentar ao final do questionário:

```markdown
## Atualizações posteriores

### AT-01 — <título objetivo>

- Decisão anterior: <resumo>
- Decisão atual: <resumo>
- Origem: <pedido, issue, documento ou implementação aprovada>
```

Continuar a numeração `AT-02`, `AT-03` e assim por diante. Registrar somente
mudanças de decisão relevantes; correções ortográficas não precisam de entrada.

## Tipos comuns de atualização

### Mudança funcional confirmada

Atualizar todas as seções impactadas e registrar a decisão posterior quando ela
substituir uma resposta anterior.

### Implementação divergente

Comparar especificação, código e testes. Se não estiver explícito qual lado está
correto, não escolher silenciosamente: gerar uma pergunta de refinamento. Se o
usuário confirmar que a implementação representa o comportamento aprovado,
atualizar a especificação para refletir esse estado.

### Correção de defeito

Documentar o comportamento correto e observável, não os detalhes internos do
bug. Atualizar critérios de aceitação e testes que evitam regressão.

### Mudança técnica sem efeito observável

Não alterar requisitos funcionais. Atualizar decisões técnicas apenas se forem
necessárias para orientar futuras implementações ou operações.

### Correção editorial

Corrigir clareza, links, nomes e consistência sem criar registro de decisão
posterior.

## Preservar rastreabilidade

- Não modificar `<feature>.briefing.md`.
- Preservar respostas existentes no questionário.
- Não criar arquivos de changelog dentro da pasta da feature.
- Referenciar caminhos, comandos e contratos reais quando forem relevantes.
- Não copiar grandes trechos de código para a especificação.
- Diferenciar claramente comportamento aprovado de detalhe de implementação.

## Validar a atualização

Antes de concluir:

1. reler briefing, questionário e especificação em conjunto;
2. procurar requisitos contraditórios ou duplicados;
3. confirmar que toda mudança funcional possui critério de aceitação verificável;
4. confirmar que os testes esperados cobrem o risco alterado;
5. verificar links e caminhos citados;
6. procurar placeholders como `[TODO]` e pendências já resolvidas;
7. executar `git diff --check`;
8. revisar o diff para garantir que somente os artefatos necessários mudaram.

Executar testes de código somente quando o usuário também tiver solicitado uma
mudança de implementação. Para atualização exclusivamente documental, validar
apenas os artefatos de especificação.

## Concluir

Informar:

- a especificação atualizada;
- o questionário atualizado, quando houver nova pergunta ou decisão posterior;
- as principais mudanças consolidadas;
- qualquer decisão essencial que ainda impeça fechar a atualização.

Não declarar a especificação sincronizada enquanto houver contradição material
conhecida sem registro no questionário.
