# Changelog

Todas as mudanças relevantes da extensão Dex serão documentadas neste arquivo.

O formato segue o padrão Keep a Changelog e o projeto utiliza Versionamento
Semântico.

## [Não publicado]

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
