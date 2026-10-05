# Dex AI

Dex AI é uma extensão compatível com Visual Studio Code e Kiro que sincroniza
skills de múltiplos repositórios públicos do GitHub para o workspace atual.

## Como usar

Abra a Paleta de Comandos e execute `Dex: Configurar skills`. A extensão baixa
as fontes habilitadas e instala as skills no diretório correto:

- Visual Studio Code: `.agents/skills`;
- Kiro: `.kiro/skills`.

O arquivo `.dex/sync.json` só é criado quando você adiciona uma fonte pelo botão
`+`.

## Gerenciar fontes

A view **Fontes de skills Dex**, no Explorer, permite:

- escolher o catálogo Dex ou uma fonte personalizada pelo botão `+`;
- sincronizar todas as fontes pelo botão do header;
- sincronizar somente uma fonte pelo botão inline do item;
- abrir o repositório de uma fonte no navegador;
- remover uma fonte;
- abrir `.dex/sync.json` pelo menu de três pontos.

Durante a ativação, a extensão consulta o catálogo público de fontes conhecidas
para manter o seletor atualizado sem exigir uma nova publicação. Se a consulta
falhar ou o catálogo for inválido, a lista distribuída pela extensão é usada.
Essa consulta não altera fontes já declaradas no workspace.

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

O histórico de mudanças do projeto está em [CHANGELOG.md](CHANGELOG.md).

## Publicar aplicações no GHCR

A skill [node-app-ghcr](skills/node-app-ghcr/SKILL.md) configura, em projetos
com `package.json`, incluindo APIs e front-ends Angular e React, um workflow para construir e publicar a imagem Docker da aplicação
no GHCR ao enviar uma tag como `v1.0.0`. O workflow exige que a tag corresponda
exatamente à versão do manifesto. A skill também adiciona `npm run release:tag`
para criar e enviar essa tag, sem executar a publicação durante a configuração.

A imagem é publicada para `linux/amd64` e `linux/arm64`, com QEMU ou uma
alternativa verificada para o build das duas arquiteturas. Versões estáveis
também são promovidas para `latest`, reutilizando o digest da imagem versionada.
Essa promoção é serializada e compara versões SemVer para impedir que uma
versão antiga substitua uma mais nova; pré-releases não alteram `latest`.
Se a promoção falhar, a imagem versionada pode permanecer publicada sem a
atualização de `latest`.
