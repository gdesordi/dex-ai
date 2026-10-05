---
name: node-app-ghcr
description: Cria ou adapta um workflow GitHub Actions para versionar aplicações com package.json, incluindo APIs e front-ends Angular e React, construir sua imagem Docker e publicá-la no GHCR por tags v iguais à versão do manifesto, incluindo um script npm para criar e enviar a tag. Usar somente em projetos com package.json; não usar para executar bumps ou publicar imediatamente.
---

# Publicação de aplicações no GHCR

## Condição de execução

Antes de qualquer alteração, confirmar que o projeto alvo contém um `package.json` próprio, fora de dependências ou arquivos gerados. Se estiver ausente, informar que a skill não se aplica e encerrar sem criar arquivos. Não criar um manifesto para contornar essa condição.

Ler as instruções do repositório e inspecionar os manifests, workflows, scripts de release, Dockerfile, `.dockerignore`, lockfiles e documentação. Em monorepos, identificar o `package.json` da aplicação solicitada, o contexto Docker e o diretório de execução do npm. Se houver várias aplicações e o alvo não puder ser inferido, pedir essa definição antes de editar.

## Resultado esperado

Criar ou adaptar `.github/workflows/publish-app.yml` e adicionar ao manifesto da aplicação o script `release:tag`, preferencialmente chamando um arquivo Node `.cjs` em `scripts/`. Preservar automações existentes e adaptar nomes quando houver conflitos, documentando o comando efetivo.

A nova versão da aplicação é a versão **já definida** no `package.json`, identificada pela tag e pela imagem. Não incrementar a versão, publicar no npm, criar GitHub Release nem implantar a aplicação como efeito adicional. Configurar os arquivos não autoriza executar o script, criar tags ou fazer push.

## Workflow GitHub Actions

- Disparar exclusivamente por `push` de tags com prefixo `v`, usando `on.push.tags: ['v*']`. O filtro seleciona eventos; a validação abaixo determina quais versões são aceitas. Não adicionar gatilhos de branch, pull request ou execução manual.
- Fazer checkout do commit da tag e ler dele o mesmo `package.json` escolhido para o script npm. Nunca comparar com o manifesto da branch padrão.
- Validar que `version` existe, é string e é uma versão SemVer válida. Exigir igualdade exata entre `GITHUB_REF_NAME` e `v${version}`. Em divergência, manifesto ausente, inválido ou versão inválida, falhar com mensagem clara e código diferente de zero.
- Passar valores do evento por variáveis de ambiente e lê-los no código; não interpolar a tag diretamente em comandos shell. Usar um parser SemVer existente ou uma validação completa, sem instalar dependências implicitamente só para essa comparação.
- Executar essa validação antes de build, login ou publicação. Em jobs separados, fazer os jobs de publicação dependerem do job validador com `needs`; não usar `always()` para contornar sua falha.
- Reutilizar os comandos de build e testes existentes quando necessários para entregar a aplicação. Se o Dockerfile já compilar a aplicação, evitar duplicar a compilação fora dele. Respeitar o gerenciador, lockfile e versão Node do projeto.
- Construir o Dockerfile da aplicação e publicar com Buildx no GHCR. Usar `docker/login-action`, `docker/setup-buildx-action` e `docker/build-push-action` em versões suportadas verificadas na documentação oficial no momento da implementação; seguir a política de pinagem por SHA do repositório, quando houver.
- Autenticar em `ghcr.io` com `github.actor` e `secrets.GITHUB_TOKEN`. Conceder `contents: read` e `packages: write` ao job publicador; não exigir PAT por padrão.
- Por padrão, publicar `ghcr.io/<owner>/<repository>:v<version>`, normalizando o caminho da imagem para minúsculas. Em monorepos, preservar ou definir um nome específico para a aplicação para evitar colisões. Usar a versão validada nas tags e no label `org.opencontainers.image.version`, além de labels de origem e revisão. Não adicionar `latest` ou outras tags móveis sem convenção existente ou pedido.
- SemVer com build metadata (`+...`) não pode ser usado literalmente como tag Docker. Quando presente, manter a comparação Git exata e definir uma codificação determinística e sem colisões para a tag da imagem, documentando-a; na ausência de convenção, pedir essa decisão antes de entregar a configuração.

Identificar pelos scripts e configurações se a aplicação é uma API, um front-end estático ou uma aplicação com renderização no servidor (SSR). Não assumir que todo projeto com `package.json` usa Node em produção.

- **APIs e aplicações SSR:** usar o build e o comando de produção reais, incluindo os artefatos e dependências necessários no estágio final. Não servir uma aplicação SSR como arquivos estáticos.
- **Front-ends estáticos Angular e React:** executar o build de produção e servir os artefatos com um servidor HTTP apropriado, como Nginx, em uma imagem multi-stage. Descobrir o diretório de saída nas configurações e no build real; não fixar `dist`, `build` ou subpastas sem verificar. Configurar fallback para `index.html` quando a aplicação usar roteamento SPA, preservando caminhos de assets. Não usar servidores de desenvolvimento como `ng serve` ou o servidor dev do Vite em produção.
- Respeitar a estratégia existente de configuração do front-end em build ou runtime. Documentar variáveis necessárias sem incorporar segredos ao bundle, aos argumentos de build ou à imagem.

Se não existir Dockerfile, criar um adequado aos scripts reais da aplicação, com instalação a partir do lockfile, build quando aplicável e comando real de inicialização. Não inventar porta ou arquivo de entrada. Criar ou ajustar `.dockerignore` para excluir credenciais, `.git`, dependências locais e arquivos desnecessários sem excluir entradas do build. Se faltarem informações essenciais de execução, solicitar somente essas informações.

## Script npm de tag

Implementar `npm run release:tag` sem comandos específicos de um shell, usando Node e `spawnSync`/`execFileSync` com arrays de argumentos para invocar Git. O script deve:

1. Resolver o caminho do manifesto em relação ao próprio script, independentemente do diretório atual, e aplicar a mesma validação de versão do workflow.
2. Confirmar que está em um repositório Git, que há um commit `HEAD`, que o manifesto pertence ao repositório e que a árvore de trabalho está limpa, incluindo arquivos não rastreados. Verificar que a versão do manifesto em `HEAD` coincide com a versão lida, para não marcar uma versão ainda não commitada.
3. Usar o remoto adotado pelo projeto, normalmente `origin`, e falhar se ele não estiver configurado ou se a consulta remota falhar. Resolver o upstream da branch atual e confirmar que o `HEAD` local já foi enviado ao remoto. Falhar se não houver upstream, se não for possível consultar o remoto ou se houver commits locais à frente do upstream. Fazer essa verificação antes de criar a tag, para impedir que ela aponte para alterações ainda não enviadas. Verificar também que `v${version}` não existe localmente nem no remoto. Não sobrescrever nem excluir tags existentes.
4. Criar uma tag anotada `v${version}` no `HEAD` e enviar somente essa tag, com refspec explícito `refs/tags/<tag>:refs/tags/<tag>`. Não usar `--tags`, `--force`, nem enviar branches automaticamente.
5. Propagar falhas do Git com saída diferente de zero. Se o push falhar após criar a tag local, informar que ela permanece local e mostrar o comando para reenviar somente essa tag. Não desfazer nem repetir a operação automaticamente.

O script não deve alterar o `package.json`, executar `npm version`, criar commits ou construir/publicar a imagem localmente. O push da tag aciona o workflow remoto.

## Documentação e validação

Atualizar o README e o changelog conforme as regras do projeto. Explicar o fluxo: ajustar a versão pelo procedimento existente, commitar e enviar o código/configuração, executar `npm run release:tag` e acompanhar o Actions. Documentar o endereço da imagem e os requisitos de acesso ao GHCR; pacotes existentes precisam permitir escrita pelo repositório. Não prometer que publicar a imagem torna o pacote público.

Antes de concluir:

- Validar JSON e YAML e executar as verificações exigidas pelo repositório. Conferir o gatilho, os caminhos da aplicação e a dependência da publicação em relação à validação.
- Testar o validador com versão/tag iguais, divergentes, manifesto sem versão e versão inválida; confirmar que falhas impedem a publicação.
- Testar o script em um repositório temporário com remoto Git bare local: sucesso envia somente a tag correta; árvore suja, tag já existente e versão inválida falham sem push. Simular falha de push e confirmar a mensagem e permanência da tag local. Não testar contra o remoto real.
- Validar o build Docker quando o ambiente permitir; se não for possível, relatar essa limitação. Não publicar imagens como teste.
- Revisar o diff e executar `git diff --check`. Informar os arquivos criados, o comando npm e a imagem configurada, separando verificações locais de execução remota ainda não realizada.

Referências oficiais para consultar durante a implementação: [publicação de imagens com Actions](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images), [GHCR e permissões](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) e [Buildx build-push-action](https://github.com/docker/build-push-action).
