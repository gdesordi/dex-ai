---
name: dex-spec-manage
description: Cria e preserva briefings, refina requisitos em questionários, consolida respostas em especificações implementáveis e mantém especificações Dex sincronizadas com decisões, correções ou mudanças aprovadas, exclusivamente em `.specs/dex/nome-da-feature/`. Usar quando Codex precisar iniciar a documentação de uma feature, esclarecer requisitos ambíguos, concluir um questionário respondido, criar a primeira `.spec.md`, atualizar requisitos ou critérios de aceitação, reconciliar especificação e código ou registrar decisões posteriores nas specs gerenciadas pelo Dex.
---

# Dex Spec Manage

Gerenciar todo o ciclo de vida da especificação funcional, desde a captura do
briefing até mudanças posteriores. Produzir os artefatos em português do Brasil.

## Estrutura dos artefatos

Usar uma pasta por feature:

```text
.specs/
└── dex/
    ├── readme.md
    └── <feature>/
        ├── <feature>.briefing.md
        ├── <feature>.refinement-questionnaire.md
        ├── <feature>.refinement-questionnaire.json
        ├── <feature>.spec.md
        └── <feature>.plan.md
```

Preservar nomes já estabelecidos em `.specs/dex/`. Tratar o briefing como fonte
original, o questionário como registro de decisões e a especificação como
descrição consolidada do comportamento atual aprovado. Não usar a especificação
como changelog.

O questionário possui duas representações coordenadas: o Markdown é a fonte de
estrutura e texto das perguntas; o JSON é o contrato interativo e a fonte das
respostas gravadas pela extensão Dex. Sempre criar ou atualizar as duas
representações na mesma operação da skill.

Não criar nem atualizar o plano de implementação; esse artefato pertence a
`dex-spec-plan`.

## Limite de propriedade

Ler e escrever artefatos de especificação somente em `.specs/dex/`. Não
procurar, abrir, importar, alterar nem usar como contexto specs localizadas em
`specs/`, outras subpastas de `.specs/`, `docs/` ou qualquer outro caminho;
essas specs pertencem a outras skills. Inspecionar código, manifests, testes e
documentação comum fora desse diretório continua permitido.

Aplicar esse limite também quando o usuário fornecer diretamente um caminho
fora de `.specs/dex/`. Um arquivo `*.briefing.md`, `*.refinement-questionnaire.*`,
`*.spec.md` ou `*.plan.md` externo continua sendo uma spec alheia e não deve ser
lido nem importado. Nesse caso, informar o limite e solicitar o briefing como
texto na conversa ou iniciar uma nova feature somente com informações já
fornecidas pelo usuário.

## Iniciar uma feature

Quando a feature ainda não possuir estrutura, coletar nesta ordem:

1. nome da feature;
2. briefing.

Executar **Preparar o contexto** antes de criar qualquer arquivo.

Não solicitar os dois campos na mesma mensagem quando ambos estiverem ausentes.
Se o nome estiver ausente, perguntar somente:

```text
Qual é o nome da feature?
```

Se o nome estiver definido, mas o briefing estiver ausente, perguntar:

```text
Descreva o briefing da feature <nome da feature>. Inclua o objetivo, o comportamento esperado e qualquer restrição já conhecida.
```

Encerrar o turno somente quando faltar uma dessas entradas. Aceitar briefing em
texto livre, lista, documento anexado ou arquivo indicado pelo usuário. Quando
nome e briefing já estiverem disponíveis, criar o briefing e iniciar o
refinamento no mesmo turno, sem solicitar confirmação nem aguardar uma nova
interação.

### Normalizar o nome

Converter o nome para kebab-case ao formar caminhos e nomes de arquivo:

- usar letras minúsculas;
- remover acentos;
- substituir espaços e separadores por `-`;
- remover caracteres que não sejam letras ASCII, números ou `-`;
- consolidar hífens consecutivos;
- remover hífens no início e no fim.

Se a normalização resultar em nome vazio, solicitar outro nome. Preservar o nome
original quando ele for usado como título.

### Criar e preservar o briefing

Antes da criação, inspecionar `.specs/dex/` e verificar se a pasta normalizada
da feature já existe. Se existir, não sobrescrever artefatos; escolher a próxima
operação pelo estado encontrado.

Criar somente a pasta da feature e `<feature>.briefing.md` nesta etapa. Preservar
o briefing fornecido sem inventar requisitos, resolver ambiguidades ou
transformá-lo em especificação:

- manter títulos, listas, exemplos e blocos de código;
- fazer somente ajustes mínimos para produzir Markdown válido;
- não corrigir decisões de produto silenciosamente;
- não adicionar perguntas de refinamento ao briefing;
- ao receber um arquivo, copiar seu conteúdo integralmente sem alterar a fonte.

Não adicionar título automático quando o briefing já tiver título. Caso
contrário, iniciar com `# <Nome original da feature>`. Depois de gravar e validar
que o briefing não está vazio, continuar em **Escolher a operação pelo estado**.

## Preparar o contexto

Antes de escrever:

1. Ler o `AGENTS.md` aplicável e os arquivos diretamente indicados por ele.
2. Criar `.specs/dex/` quando ainda não existir.
3. Se `.specs/dex/readme.md` não existir, copiar integralmente
   `assets/specs-readme.md` para esse caminho.
4. Preservar `.specs/dex/readme.md` sem alterações quando ele já existir e lê-lo.
5. Ler integralmente briefing, questionário Markdown, questionário JSON,
   especificação e plano existentes.
6. Ler a fonte da mudança indicada pelo usuário somente quando ela não for um
   artefato de especificação fora de `.specs/dex/`.
7. Inspecionar código, manifests, contratos, traduções, testes e documentação
   relacionados à feature.
8. Consultar histórico ou diff quando ajudarem a distinguir decisão aprovada de
   desvio acidental.

Usar `rg` e `rg --files` para descoberta. Não transformar detalhes incidentais
do código em requisitos de produto nem assumir que o código é a fonte de verdade
apenas por ser o estado mais recente.

Quando a fonte inicial for um documento comum que não seja artefato de
especificação, copiar seu conteúdo sem alterações para `<feature>.briefing.md`.
Não remover nem modificar a fonte original, salvo pedido explícito. Nunca tratar
um arquivo localizado em `specs/`, outra subpasta de `.specs/`, `docs/spec/` ou
caminho equivalente como briefing importável; informar que ele está fora do
limite de propriedade desta skill sem abri-lo.

## Escolher a operação pelo estado

Depois que o briefing existir, executar somente uma das operações abaixo. A
criação inicial do briefing não impede iniciar uma delas no mesmo turno. Não
escolher a operação apenas pelo verbo usado no pedido; inspecionar os artefatos
existentes.

Antes de avaliar se o questionário está respondido, executar **Importar
respostas do JSON** sempre que o pedido depender das decisões do questionário.
Isso inclui consolidar ou atualizar a especificação, gerar ou atualizar plano ou
tarefas, e implementar a feature. Fazer essa sincronização automaticamente,
mesmo que o usuário não tenha pedido para atualizar o questionário: não declarar
que faltam respostas com base apenas no Markdown quando o JSON correspondente
existir. Depois da sincronização, escolher a operação pelo estado atualizado dos
artefatos e somente então executar ou encaminhar os próximos passos solicitados.

### 1. Refinar decisões abertas

Usar quando não existir `.spec.md` e ainda houver decisões essenciais sem
resposta, ou quando uma mudança posterior introduzir ambiguidade material.

1. Extrair fatos confirmados, contradições, lacunas e termos vagos.
2. Confrontar as fontes com o comportamento e as convenções do projeto.
3. Criar ou atualizar `<feature>.refinement-questionnaire.md`.
4. Criar ou atualizar o JSON correspondente conforme **Manter o questionário
   JSON**.
5. Não criar nem alterar a especificação como se a decisão estivesse fechada.
6. Informar quais respostas essenciais impedem a consolidação.

### 2. Consolidar a primeira especificação

Usar quando não existir `.spec.md` e todas as perguntas essenciais estiverem
respondidas. Um pedido para “atualizar a spec” depois de responder o questionário
deve entrar nesta operação, mesmo que a especificação ainda não exista.

1. Sincronizar primeiro as respostas do JSON para o Markdown conforme
   **Importar respostas do JSON**.
2. Resolver cada requisito conforme as respostas, inclusive `manter sugestão`.
3. Criar `<feature>.spec.md`.
4. Remover pendências resolvidas.
5. Preservar as duas representações do questionário respondido como registro
   das decisões.
6. Manter como pendência apenas questão nova e realmente bloqueante, explicando
   por que surgiu.

### 3. Atualizar uma especificação consolidada

Usar quando `.spec.md` já existir e houver comportamento novo, corrigido ou
explicitamente confirmado.

Fontes possíveis incluem decisão do usuário, questionário respondido, issue,
documento, comentário, implementação aprovada, testes representativos ou
correção editorial.

Para cada mudança confirmada:

1. sincronizar primeiro as respostas do JSON para o Markdown quando o pedido
   envolver atualização, sincronização ou consolidação;
2. localizar todas as seções afetadas;
3. substituir requisitos obsoletos em vez de apenas acrescentar exceções;
4. revisar escopo, requisitos, regras, erros e falhas parciais;
5. atualizar critérios de aceitação e testes esperados;
6. revisar decisões técnicas somente quando necessário;
7. remover contradições e pendências resolvidas.

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

Depois de criar ou alterar o Markdown, executar **Manter o questionário JSON**
antes de concluir a operação.

## Manter o questionário JSON

Usar o caminho
`.specs/dex/<feature>/<feature>.refinement-questionnaire.json`, ao lado do
Markdown correspondente. O contrato inicial é:

```json
{
  "schemaVersion": 1,
  "feature": "nome-da-feature",
  "title": "Questionário de Refinamento — nome-da-feature",
  "status": "pending",
  "questions": [
    {
      "id": "1.1",
      "section": "Assunto",
      "text": "Texto da pergunta",
      "essential": true,
      "suggestion": "Sugestão objetiva",
      "answer": null
    }
  ]
}
```

Regras do contrato:

- usar `schemaVersion` numérico igual a `1`;
- usar em `feature` o nome normalizado da pasta;
- preservar no array `questions` a ordem do Markdown;
- representar `id`, `section`, `text`, `essential` e `suggestion` conforme o
  Markdown;
- usar `answer: null` para questão sem resposta e uma string não vazia para
  questão respondida;
- aceitar `manter sugestão` como resposta e resolvê-la conforme a sugestão da
  mesma questão durante a consolidação;
- correlacionar respostas por `id`, nunca somente pela posição no array;
- ao atualizar a estrutura, preservar a resposta existente de todo `id` que
  continuar presente, inclusive quando texto, seção ou sugestão mudarem;
- quando o JSON ainda não existir, copiar para `answer` a resposta não vazia já
  registrada no Markdown e usar `null` somente nas questões sem resposta;
- iniciar questões novas com `answer: null` e remover do JSON questões que não
  existirem mais no Markdown;
- recusar atualização de JSON inválido ou com `schemaVersion` diferente de `1`,
  explicar a pendência e nunca sobrescrever o arquivo incompatível.

Calcular `status` considerando todas as questões, essenciais ou não:

- `pending`: nenhuma questão possui resposta;
- `partially-answered`: pelo menos uma, mas não todas, possui resposta;
- `answered`: todas as questões possuem resposta.

O status é sempre derivado das respostas. Não preservar manualmente um status
que contradiga o conteúdo de `questions`.

## Importar respostas do JSON

Quando o pedido depender das decisões do questionário, ler o JSON correspondente
e sincronizá-lo com o Markdown antes de avaliar pendências, escrever a
especificação, planejar tarefas ou iniciar a implementação. Considerar como
dependentes, no mínimo, pedidos para atualizar, sincronizar ou consolidar a spec,
gerar ou atualizar plano ou tarefas, e implementar a feature. Não exigir um
pedido explícito de sincronização.

Validar `schemaVersion`, campos obrigatórios, tipos, valores de `status`, IDs
únicos e o status derivado. Diante de JSON inválido ou incompatível, informar o
problema sem alterar o JSON nem o Markdown.

Para cada questão correlacionada por `id`:

- se somente o JSON possuir resposta, copiá-la para a linha `Resposta:` do
  Markdown;
- se JSON e Markdown possuírem a mesma resposta, preservar o valor;
- se ambos possuírem respostas diferentes e não vazias, apresentar o conflito
  e solicitar qual resposta deve prevalecer antes de sobrescrever qualquer uma;
- se a decisão do usuário escolher a resposta do Markdown, atualizar também o
  JSON para restabelecer a equivalência;
- depois de importar ou resolver conflitos, recalcular e persistir o status.

Se o JSON válido contiver todas as respostas e o Markdown ainda estiver vazio ou
incompleto, atualizar o Markdown automaticamente e continuar o fluxo solicitado
no mesmo turno. Não informar que o questionário está pendente com base no estado
anterior do Markdown.

Não consolidar a especificação enquanto existir conflito não resolvido em uma
pergunta essencial.

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
- Preservar respostas existentes nas duas representações do questionário.
- Não criar changelog dentro da pasta da feature.
- Não copiar grandes trechos de código para a especificação.
- Diferenciar comportamento aprovado de detalhe de implementação.
- Não implementar a feature, salvo pedido explícito do usuário.

## Tratar plano existente

Depois de criar ou alterar `<feature>.spec.md`, verificar se
`<feature>.plan.md` existe. Se existir, informar que o plano pode estar
desatualizado e sugerir `dex-spec-plan` para reconciliá-lo. Não editar o plano
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
