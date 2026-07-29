# Dex AI

Dex AI é uma extensão compatível com Visual Studio Code e Kiro que sincroniza
skills de múltiplos repositórios públicos do GitHub para o workspace atual.

## Como usar

Abra a Paleta de Comandos e execute `Dex: Configurar skills`. A extensão baixa
as fontes habilitadas e instala as skills no diretório correto:

- Visual Studio Code: `.agents/skills`;
- Kiro: `.kiro/skills`.

O arquivo `.dex/sync.json` só é criado quando você adiciona uma fonte pelo botão
`+` ou inclui a fonte Dex padrão pelo menu de três pontos.

## Gerenciar fontes

A view **Fontes de skills Dex**, no Explorer, permite:

- adicionar uma fonte pelo botão `+`;
- sincronizar todas as fontes pelo botão do header;
- sincronizar somente uma fonte pelo botão inline do item;
- abrir o repositório de uma fonte no navegador;
- remover uma fonte;
- restaurar a fonte Dex padrão ou abrir `.dex/sync.json` pelo menu de três
  pontos.

Uma fonte possui um identificador, a URL pública do GitHub, uma branch, tag ou
commit e o caminho da pasta de skills no repositório. O cadastro guiado solicita
essas informações e atualiza a Tree View automaticamente.

Em workspaces com várias raízes, cada pasta mantém fontes e sincronização
independentes. A extensão também detecta conflitos quando duas fontes fornecem
uma skill com o mesmo nome.

Para a lista completa de comandos e opções, consulte o
[README da extensão](extension/dex/README.md).

Para contribuir com o projeto, consulte o
[guia de desenvolvimento](README.dev.md).
