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
- Construir o Dockerfile da aplicação e publicar com Buildx no GHCR para as plataformas `linux/amd64` e `linux/arm64`, usando explicitamente `platforms: linux/amd64,linux/arm64` e `push: true` em `docker/build-push-action`. Capturar seu output `digest` para a promoção de `latest`. Isso deve produzir uma imagem multi-plataforma com manifest list/index OCI para a mesma tag, permitindo que Docker selecione automaticamente a variante x64 ou ARM64 (incluindo Apple Silicon). Não publicar somente uma arquitetura nem usar duas tags distintas como substituto.
- Preparar o builder para ambas as arquiteturas. Em um runner de arquitetura única que execute instruções da outra plataforma, configurar `docker/setup-qemu-action` antes de `docker/setup-buildx-action`. Omitir QEMU somente quando houver uma alternativa verificada com builders nativos para ambas as arquiteturas ou compilação cruzada que dispense executar binários da plataforma alvo. Conferir dependências nativas e imagens base; não fixar o estágio final em `linux/amd64`.
- Usar `docker/login-action`, `docker/setup-buildx-action`, `docker/build-push-action` e, quando necessária, `docker/setup-qemu-action` em versões suportadas verificadas na documentação oficial no momento da implementação; seguir a política de pinagem por SHA do repositório, quando houver.
- Autenticar em `ghcr.io` com `github.actor` e `secrets.GITHUB_TOKEN`. Conceder `contents: read` e `packages: write` ao job publicador; não exigir PAT por padrão.
- Por padrão, publicar `ghcr.io/<owner>/<repository>:v<version>`, normalizando o caminho da imagem para minúsculas, e promover versões estáveis para `ghcr.io/<owner>/<repository>:latest` conforme a seção abaixo. Em monorepos, preservar ou definir um nome específico para a aplicação para evitar colisões. Usar a versão validada nas tags e no label `org.opencontainers.image.version`, além de labels de origem e revisão. Não adicionar outras tags móveis sem convenção existente ou pedido.
- SemVer com build metadata (`+...`) não pode ser usado literalmente como tag Docker. Quando presente, manter a comparação Git exata e definir uma codificação determinística e sem colisões para a tag da imagem, documentando-a; na ausência de convenção, pedir essa decisão antes de entregar a configuração.

### Promoção de `latest`

`latest` deve apontar para a maior versão estável publicada por este fluxo. Considerar estável uma versão SemVer sem identificadores de pré-release; versões como `1.2.0-beta.1` ou `1.2.0-rc.1` publicam somente a imagem versionada. Respeitar uma política diferente de `latest` apenas quando explicitamente definida pelo projeto ou pelo usuário, documentando-a.

- Publicar somente a tag versionada no job de build. Criar um job de promoção separado, condicionado à versão estável validada, com `needs` dos jobs de validação e publicação. Passar o nome da imagem, a versão original validada e o digest publicado por outputs; não resolver novamente a tag versionada para escolher o artefato nem recompilar.
- Serializar o job de promoção por imagem com `concurrency.group` comum a todos os workflows que alterem seu `latest`, independente de tag Git, versão ou execução. Usar `cancel-in-progress: false` e `queue: max` para preservar promoções pendentes, conferindo o suporte na plataforma alvo. Não serializar ou cancelar os builds de versões diferentes como substituto. A fila não garante ordem SemVer: a comparação abaixo continua obrigatória. O grupo só coordena jobs no mesmo repositório; centralizar nele os escritores de `latest` ou usar uma coordenação equivalente se houver publicação por outros repositórios.
- No job de promoção, configurar Buildx e autenticação no GHCR, com `contents: read` e `packages: write`. Dentro da seção serializada, consultar o digest atual de `latest` e ler, por esse digest, o label `org.opencontainers.image.version` das configurações das plataformas da imagem. Exigir versões consistentes e estáveis entre as plataformas, ignorando manifests de atestação. Não usar tags Git, a data do build ou o manifesto da branch padrão para determinar a versão atual de `latest`.
- Promover quando `latest` ainda não existir ou a versão candidata tiver precedência SemVer maior que a atual. Comparar os componentes numericamente com parser SemVer existente ou implementação completa; não usar comparação lexicográfica, horário de término nem build metadata (`+...`) como desempate. Se a candidata for menor ou tiver precedência igual, concluir sem alterar `latest`, registrando o motivo. Isso também torna reexecuções idempotentes.
- Tratar somente uma resposta autenticada do registry que confirme manifesto ausente como primeira publicação. Falhas de autenticação, rede, leitura, label ausente ou versão inválida devem falhar o job sem alterar `latest`; não interpretar qualquer erro de consulta como ausência.
- Promover o index já publicado por digest, por exemplo com `docker buildx imagetools create --tag <imagem>:latest <imagem>@<digest>`, usando uma única origem que seja o manifest list/index multi-plataforma e sem adicionar annotations ou alterar manifests. Conferir que `latest` resolve para o digest promovido. Falhas na promoção devem ser visíveis no Actions, preservando a imagem versionada já publicada.

### Imagem da aplicação

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

Atualizar o README e o changelog conforme as regras do projeto. Explicar o fluxo: ajustar a versão pelo procedimento existente, commitar e enviar o código/configuração, executar `npm run release:tag` e acompanhar o Actions. Documentar os endereços da imagem versionada e de `latest`, a política de promoção apenas de versões estáveis com precedência maior e os requisitos de acesso ao GHCR; pacotes existentes precisam permitir escrita pelo repositório. Explicar que uma falha na promoção pode deixar a imagem versionada publicada sem atualizar `latest`. Não prometer que publicar a imagem torna o pacote público.

Antes de concluir:

- Validar JSON e YAML e executar as verificações exigidas pelo repositório. Conferir o gatilho, os caminhos da aplicação, a dependência da publicação em relação à validação, `push: true`, a preparação de QEMU ou alternativa verificada e se o build publica `linux/amd64` e `linux/arm64` sob a mesma tag.
- Testar o validador com versão/tag iguais, divergentes, manifesto sem versão e versão inválida; confirmar que falhas impedem a publicação.
- Testar a decisão de promoção com fixtures ou registry simulado, sem publicar no GHCR: `latest` ausente, candidata maior, menor, igual e pré-release; comparação `1.10.0` versus `1.9.0` e igualdade de precedência com build metadata. Simular candidata antiga terminando depois da nova e confirmar que `latest` não retrocede. Simular falhas de autenticação/rede, label ausente ou inválido e versões inconsistentes entre plataformas; confirmar que impedem a promoção. Conferir que consulta, comparação e escrita compartilham a mesma seção serializada e que a promoção usa o digest do build multi-plataforma.
- Testar o script em um repositório temporário com remoto Git bare local: sucesso envia somente a tag correta; árvore suja, tag já existente e versão inválida falham sem push. Simular falha de push e confirmar a mensagem e permanência da tag local. Não testar contra o remoto real.
- Validar o build Docker quando o ambiente permitir; se não for possível, relatar essa limitação. Não publicar imagens como teste.
- Revisar o diff e executar `git diff --check`. Informar os arquivos criados, o comando npm e a imagem configurada, separando verificações locais de execução remota ainda não realizada.

Referências oficiais para consultar durante a implementação: [publicação de imagens com Actions](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images), [GHCR e permissões](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [Buildx build-push-action](https://github.com/docker/build-push-action), [build multi-plataforma](https://docs.docker.com/build/ci/github-actions/multi-platform/), [concorrência de jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) e [promoção de manifests por digest](https://docs.docker.com/reference/cli/docker/buildx/imagetools/create/).
