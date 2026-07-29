# Changelog

Todas as mudanças relevantes da extensão Dex serão documentadas neste arquivo.

O formato segue o padrão Keep a Changelog e o projeto utiliza Versionamento
Semântico.

## [Não publicado]

## [1.1.0] - 2026-07-29

### Adicionado

- Scripts npm para empacotar e publicar a extensão com `vsce`.
- Configuração versionada `.dex/sync.json`, criada com a fonte Dex padrão em
  workspaces confiáveis.
- Comando `Dex: Adicionar fonte Dex padrão` para restaurar a fonte sem criar
  duplicatas ou sobrescrever conflitos.
- Contratos e fundações para fontes públicas do GitHub, validação de catálogos e
  armazenamento isolado por workspace.
- Testes automatizados para configuração, catálogo e provedor GitHub.
- Tree View no Explorer para visualizar fontes configuradas.
- Sincronização de múltiplas fontes públicas do GitHub com detecção de colisões
  entre nomes de skills.

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
