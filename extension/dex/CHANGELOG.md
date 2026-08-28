# Changelog

Todas as mudanças relevantes da extensão Dex serão documentadas neste arquivo.

O formato segue o padrão Keep a Changelog e o projeto utiliza Versionamento
Semântico.

## [Não publicado]

## [2.3.0] - 2026-08-28

### Adicionado

- Testes unitários para fontes conhecidas, comparação de revisões e resultado
  da sincronização inicial após o cadastro.

### Modificado

- A verificação de atualizações passa a usar exclusivamente o commit Git
  resolvido de cada fonte, juntamente com repositório, referência e caminho,
  sem depender de `skills/dex.json` ou de uma versão declarada pelo catálogo.
- O cadastro de fontes passa a solicitar identificador, repositório, referência
  e caminho sem exibir valores de exemplo como opções selecionáveis.
- `Dex: Adicionar fonte de skills` passa a listar catálogos conhecidos, com Dex
  como primeira opção e a fonte personalizada como última; o comando separado
  `dex.addDefaultSource` foi removido.
- O catálogo GCT (`sordi-totvs/gct-resources`, pasta `skills`) passa a estar
  disponível entre as fontes conhecidas.
- Fontes conhecidas e personalizadas passam a ser sincronizadas automaticamente
  logo após o cadastro, preservando a configuração quando a sincronização falha
  ou é cancelada.

## [2.2.0] - 2026-08-04

### Adicionado

- Indicador na barra de status com o percentual de dias úteis transcorridos no
  mês atual, atualizado diariamente e sem desconto de feriados.

## [2.1.0] - 2026-08-04

### Modificado

- Ao desativar uma fonte em `.dex/sync.json`, suas skills são removidas
  imediatamente do workspace e uma notificação informa a quantidade removida.

### Adicionado

- Comando `Dex: Responder questionário de especificação`, com descoberta em
  `.specs/dex/`, respostas e revisão por Quick Picks, persistência incremental,
  status derivado e proteção contra contratos inválidos ou incompatíveis.

## [2.0.2] - 2026-07-30

### Corrigido

- A composição das skills passa a substituir somente diretórios gerenciados
  pelas fontes configuradas, preservando skills locais ou instaladas por outros
  meios na pasta de destino.

## [2.0.1] - 2026-07-30

### Modificado

- O README da extensão passa a documentar o fluxo atual pela Tree View, a
  configuração por workspace, o cache por fonte e a composição do conteúdo da
  pasta `skills`, sem instruções do fluxo legado.

### Corrigido

- A sincronização no Kiro agora mantém `.kiro/skills` no lugar e atualiza apenas
  seu conteúdo, evitando falhas `EPERM` ao tentar renomear a pasta observada.

## [2.0.0] - 2026-07-30

### Modificado

- A ativação passa a inicializar somente a Tree View e seus observadores, sem
  consultar automaticamente o catálogo Dex no GitHub.
- O comando global da Tree View passa a se chamar `dex.syncSources`.
- Sincronizações e verificações passam a registrar no canal `Dex` cada etapa,
  commits resolvidos e causas específicas de falha no GitHub.

### Removido

- Fluxo legado de download global, cópia manual para o workspace, configuração
  em etapa única e verificação periódica do catálogo Dex.

## [1.1.3] - 2026-07-30

### Modificado

- O script `npm run publish` passa a publicar a extensão no Visual Studio
  Marketplace e no Open VSX Registry.

## [1.1.2] - 2026-07-29

### Adicionado

- Sincronização de múltiplas fontes públicas do GitHub, configuradas por
  workspace em `.dex/sync.json`, com validação de catálogos, armazenamento
  isolado e detecção de colisões entre skills.
- Tree View no Explorer para cadastrar fontes por Quick Picks, sincronizar todas
  ou apenas uma fonte, abrir repositórios e remover configurações.
- Comando para restaurar a fonte Dex padrão sem criar duplicatas nem
  sobrescrever conflitos.
- Detecção automática do Kiro, que instala skills em `.kiro/skills`, mantendo
  `.agents/skills` no Visual Studio Code.
- Testes automatizados para configuração, catálogo, ambiente e provedor GitHub.

### Modificado

- `.dex/sync.json` passa a ser criado somente quando o usuário cadastra uma
  fonte, sem alterações automáticas durante a ativação.
- Ações principais ficam em botões do header e dos itens, enquanto restaurar a
  fonte Dex e abrir a configuração ficam no menu de três pontos.
- A abertura do repositório passa a ocorrer apenas pelo botão inline, não pelo
  clique no item da Tree View.

## [1.0.0] - 2026-06-19

### Adicionado

- Verificação de atualizações do catálogo por meio do `skillsVersion` em
  `dex.json`.
- Ações para visualizar o changelog, atualizar as skills ou ignorar uma nova
  versão.
- Confirmação opcional para sincronizar o workspace após uma atualização.
- Verificação automática diária de novas versões, silenciosa quando o catálogo
  local já está atualizado.

### Removido

- Comando de diagnóstico `Dex: Abrir`.

## [0.0.1] - 2026-06-19

### Adicionado

- Download e atualização das skills do repositório Dex.
- Abertura da pasta local das skills no gerenciador de arquivos do sistema.
- Cópia das skills para `.agents/skills` no workspace.
- Configuração completa das skills em uma única operação.
- Seleção de destino para workspaces com várias raízes.
- Progresso e cancelamento durante o download.
- Localização dos comandos em inglês e português do Brasil.
- Logotipo vetorial da extensão.

### Corrigido

- Cópia recursiva dos arquivos para o workspace.
- Continuação automática da configuração sem aguardar o fechamento da
  notificação de download.
