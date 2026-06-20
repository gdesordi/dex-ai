# Changelog

Todas as mudanças relevantes do conjunto de skills Dex serão documentadas
neste arquivo.

O formato segue o padrão Keep a Changelog e as versões seguem o Versionamento
Semântico. A versão oficial das skills é controlada pela propriedade
`skillsVersion` do arquivo `dex.json` e deve corresponder à versão publicada mais
recente deste changelog.

## [Não publicado]

Mudanças ainda não incluídas em uma versão devem ser registradas nesta seção.

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
