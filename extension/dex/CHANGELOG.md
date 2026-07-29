# Changelog

Todas as mudanças relevantes da extensão Dex serão documentadas neste arquivo.

O formato segue o padrão Keep a Changelog e o projeto utiliza Versionamento
Semântico.

## [Não publicado]

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
