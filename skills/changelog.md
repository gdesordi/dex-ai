# Changelog

Todas as mudanças relevantes do conjunto de skills Dex serão documentadas
neste arquivo.

O formato segue o padrão Keep a Changelog e as versões seguem o Versionamento
Semântico. A versão oficial das skills é controlada pela propriedade
`skillsVersion` do arquivo `dex.json` e deve corresponder à versão publicada mais
recente deste changelog.

## [Não publicado]

Mudanças ainda não incluídas em uma versão devem ser registradas nesta seção.

## [3.1.2] - 2026-08-04

### Corrigido

- `dex-spec-manage` passa a importar automaticamente para o Markdown as
  respostas existentes no JSON antes de avaliar pendências ou prosseguir com
  consolidação, planejamento de tarefas ou implementação.

## [3.1.1] - 2026-08-04

### Corrigido

- `dex-spec-manage` e `dex-spec-plan` passam a rejeitar explicitamente qualquer
  artefato de especificação fora de `.specs/dex/`, inclusive briefings indicados
  por caminho, evitando importação ou descoberta acidental em `specs/` e outros
  diretórios.

## [3.1.0] - 2026-08-04

### Adicionado

- `dex-spec-manage` passa a manter uma representação JSON versionada dos
  questionários, preservar respostas por ID, calcular o estado do preenchimento
  e importar respostas da extensão Dex para o Markdown com detecção de
  conflitos.

## [3.0.0] - 2026-08-04

### Modificado

- `dex-spec-manage` passa a criar e preservar o briefing inicial antes de
  selecionar a operação adequada ao estado da feature.
- Quando nome e briefing já estão definidos, `dex-spec-manage` cria a estrutura
  inicial e começa o refinamento no mesmo turno, sem aguardar nova interação.
- `dex-spec-plan` passa a encaminhar também features ainda não iniciadas para
  `dex-spec-manage`.

### Removido

- `dex-spec-create`, incorporada integralmente a `dex-spec-manage`.

## [2.0.0] - 2026-08-04

### Modificado

- As skills `spec-create`, `spec-manage` e `spec-plan` passam a se chamar,
  respectivamente, `dex-spec-create`, `dex-spec-manage` e `dex-spec-plan`.
- As três skills passam a gerenciar specs exclusivamente em `.specs/dex/`, sem
  ler nem escrever artefatos de especificação mantidos em outros caminhos.
- `.specs/dex/readme.md` passa a declarar a propriedade exclusiva desse
  diretório e é criado automaticamente quando estiver ausente.

## [1.3.0] - 2026-06-20

### Modificado

- `node-version-bump` passa a promover e resumir as alterações registradas em
  `[Não publicado]` na seção da nova versão, preservando categorias e evitando
  notas sem suporte.

## [1.2.0] - 2026-06-20

### Adicionado

- `spec-manage`: refinamento, consolidação inicial e atualização posterior de
  especificações em um único fluxo orientado pelo estado dos artefatos.

### Modificado

- `spec-create` e `spec-plan` passam a encaminhar refinamentos e mudanças de
  especificação para `spec-manage`.
- Alterações em uma especificação com plano existente passam a avisar que o
  plano pode precisar de reconciliação por `spec-plan`.

### Removido

- `spec-refinement` e `spec-update`, substituídas por `spec-manage`.

## [1.1.0] - 2026-06-19

### Adicionado

- `spec-plan`: criação de planos de implementação divididos em fases a partir
  de especificações consolidadas.

### Modificado

- Skills `spec-*` passam a criar `specs/readme.md` a partir do template
  distribuído quando a pasta de especificações ainda não possuir esse arquivo.

## [1.0.0] - 2026-06-19

### Adicionado

- `spec-create`: criação da estrutura inicial de uma feature a partir de nome e
  briefing.
- `spec-refinement`: refinamento de briefings em questionários de decisão e
  especificações implementáveis.
- `spec-update`: atualização de especificações consolidadas após mudanças de
  requisitos, decisões ou implementação.
