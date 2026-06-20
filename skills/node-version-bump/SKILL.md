---
name: node-version-bump
description: Executa bumps SemVer major, minor ou patch em projetos Node.js, incluindo pacotes únicos e monorepos. Use quando o usuário pedir bump, pump ou incremento de versão e for necessário descobrir a política do repositório, atualizar manifests e dependências internas, regenerar o lockfile, promover e resumir alterações de `[Não publicado]` no changelog, manter documentação de release consistente e validar a alteração sem criar commit, tag, publicação ou release implicitamente.
---

# Node Version Bump

## Objetivo

Executar uma mudança de versão pequena, previsível e verificável em qualquer repositório Node.js. Respeitar primeiro as instruções e ferramentas já adotadas pelo projeto; usar este fluxo como padrão quando o repositório não definir um procedimento mais específico.

Aceitar `bump major`, `bump minor` e `bump patch`. Interpretar também o erro comum `pump` como `bump` quando a intenção for inequívoca.

## Limites de segurança

- Não criar commit, tag, push, publicação em registry, GitHub Release ou deploy sem pedido explícito.
- Não executar `npm version` sem `--no-git-tag-version`; o comando pode criar commit e tag por padrão e também acionar scripts de lifecycle.
- Não inventar notas de release, correções ou funcionalidades.
- Não alterar versões de pacotes independentes apenas porque estão no mesmo monorepo.
- Não substituir números de versão indiscriminadamente em histórico de changelog, exemplos ou arquivos gerados.
- Não misturar npm, Yarn, pnpm e Bun. Usar o gerenciador detectado no repositório.
- Preservar mudanças preexistentes do usuário e limitar o diff ao escopo do bump.

## Fluxo

### 1. Ler as regras do repositório

Antes de editar:

1. Ler `AGENTS.md` e instruções equivalentes aplicáveis ao diretório, além das diretrizes apontadas por elas.
2. Inspecionar o `package.json` raiz, o campo `packageManager`, os scripts de release/versionamento e os lockfiles.
3. Detectar ferramentas configuradas, como Changesets, Lerna, Nx Release, Rush ou semantic-release.
4. Localizar workspaces pelos campos do `package.json`, por `pnpm-workspace.yaml` ou pela configuração equivalente.
5. Localizar manifests relevantes sem percorrer `node_modules`, diretórios de build, caches ou dependências vendorizadas.
6. Verificar changelogs, arquivos de changeset e documentação operacional de release.

Preferir o comando de versionamento oficial do projeto quando ele for documentado, determinístico e não provocar ações externas não solicitadas. Inspecionar o diff produzido pelo comando.

### 2. Determinar o modelo de versionamento

Classificar o projeto antes de calcular versões:

- **Pacote único:** atualizar o único pacote publicável ou o pacote raiz indicado pelas instruções.
- **Versão fixa ou sincronizada:** atualizar todos os manifests pertencentes ao grupo quando a configuração, a documentação ou o padrão consistente do repositório confirmar esse modelo.
- **Versões independentes:** atualizar somente os pacotes solicitados e os metadados realmente afetados.

Não assumir que todos os workspaces compartilham versão apenas porque atualmente possuem o mesmo número. Se o escopo ou o modelo permanecer ambíguo e a escolha puder alterar pacotes adicionais, perguntar ao usuário antes de editar.

### 3. Calcular a nova versão

Aplicar SemVer a uma versão estável `MAJOR.MINOR.PATCH`:

- `major`: `MAJOR + 1.0.0`
- `minor`: `MAJOR.MINOR + 1.0`
- `patch`: `MAJOR.MINOR.PATCH + 1`

Exemplo para `2.4.7`: major resulta em `3.0.0`, minor em `2.5.0` e patch em `2.4.8`.

Se a versão atual contiver prerelease ou build metadata, ou se o usuário pedir prerelease, seguir a política/ferramenta documentada pelo projeto. Na ausência dela, perguntar qual resultado é desejado em vez de inferir.

### 4. Atualizar manifests e dependências internas

Atualizar o campo `version` somente nos pacotes pertencentes ao escopo definido. Depois revisar referências a esses pacotes em:

- `dependencies`
- `devDependencies`
- `peerDependencies`
- `optionalDependencies`

Preservar a semântica existente dos intervalos. Por exemplo, converter `^1.4.0` em `^2.0.0` quando essa dependência interna deve acompanhar o novo major, e manter o operador usado pelo projeto. Protocolos como `workspace:*`, `workspace:^` e `workspace:~` normalmente já expressam a relação interna e devem permanecer inalterados.

Tratar peer dependencies com cuidado: um major pode exigir compatibilidade com a versão antiga, a nova ou ambas. Se a estratégia não estiver documentada, confirmar com o usuário antes de estreitar ou quebrar o intervalo.

Usar a ferramenta de edição apropriada e preservar estilo, ordenação e formatação dos manifests. Após editar, parsear todos os JSON modificados.

### 5. Atualizar changelog e documentação

Seguir a convenção existente:

- Se o projeto usa Changesets ou ferramenta equivalente, criar ou atualizar apenas o artefato esperado pelo fluxo configurado.
- Se há changelog obrigatório com uma seção `[Não publicado]`, promover seu conteúdo para a nova versão conforme o fluxo abaixo.
- Se há changelog obrigatório sem seção `[Não publicado]`, registrar conteúdo já conhecido conforme o formato existente e usar a data local quando a convenção exigir.
- Se faltarem informações para uma entrada obrigatória, pedir ao usuário o conteúdo; não fabricar mudanças de produto.
- Se a convenção permitir explicitamente uma entrada mecânica de versionamento, registrar somente essa mudança factual.
- Atualizar documentação operacional que referencia a versão corrente, como exemplos de tag ou comandos de release, apenas quando ela realmente ficar obsoleta.
- Preservar entradas históricas e exemplos que não representam a versão corrente.

Não criar changelog ou política de release novos quando o projeto não exigir isso.

#### Promover `[Não publicado]`

Quando o changelog adotar uma seção `[Não publicado]` ou equivalente:

1. Ler todo o conteúdo entre essa seção e a versão publicada seguinte.
2. Usar esse conteúdo como fonte primária das notas da nova versão.
3. Comparar as notas com o diff não commitado relacionado ao bump somente para
   detectar afirmações sem suporte, omissões evidentes ou itens já obsoletos.
4. Criar a seção da nova versão imediatamente abaixo de `[Não publicado]`,
   usando a versão calculada e a data local no formato adotado pelo projeto.
5. Mover para a nova seção todas as alterações válidas, preservando categorias
   como `Adicionado`, `Modificado`, `Corrigido`, `Removido` e `Segurança` quando
   forem usadas pelo projeto.
6. Resumir as alterações em notas curtas e factuais: agrupar itens redundantes,
   remover detalhes puramente operacionais e manter nomes, impactos e mudanças
   incompatíveis necessários para compreender a release.
7. Preservar itens distintos e informações relevantes; não reduzir várias
   mudanças a uma frase genérica nem acrescentar fatos inferidos apenas do nome
   de arquivos ou commits.
8. Recriar `[Não publicado]` vazio no mesmo formato, mantendo o texto
   introdutório padrão do projeto quando existir.

Não promover uma seção vazia como se contivesse uma release. Se não houver notas
confiáveis e a convenção exigir conteúdo, pedir ao usuário as informações
faltantes. Não incorporar automaticamente toda alteração não commitada ao
changelog: mudanças preexistentes podem estar fora do escopo do bump.

### 6. Regenerar o lockfile

Regenerar o lockfile com o gerenciador detectado e com o menor efeito funcional possível. Preferir scripts ou comandos documentados pelo projeto. Quando não houver regra específica, considerar:

- npm: `npm install --package-lock-only --ignore-scripts`
- pnpm: `pnpm install --lockfile-only --ignore-scripts`
- Yarn: usar a versão e o modo de instalação definidos pelo próprio projeto, evitando trocar o formato do lockfile.
- Bun: usar a versão e o comando definidos pelo projeto.

Não editar lockfiles manualmente salvo quando as instruções do repositório exigirem isso. Se a regeneração depender de rede ou permissão externa e falhar por restrição do ambiente, solicitar a autorização necessária e repetir o comando.

### 7. Validar

Executar validações proporcionais ao risco e às regras do projeto:

1. Parsear todos os `package.json` alterados.
2. Confirmar que cada pacote pretendido recebeu exatamente a nova versão.
3. Confirmar que pacotes independentes fora do escopo permaneceram inalterados.
4. Confirmar a consistência das dependências internas em todos os campos relevantes.
5. Confirmar que o lockfile corresponde aos manifests e ao gerenciador correto.
6. Confirmar que `[Não publicado]` foi esvaziado, que seu conteúdo válido aparece
   resumido na nova versão e que nenhuma entrada histórica foi alterada.
7. Confirmar que changelog, changesets e documentação obedecem à política existente.
8. Executar scripts específicos de validação/versionamento definidos pelo repositório quando forem seguros.
9. Executar `git diff --check` e revisar o diff completo para detectar alterações acidentais.

Não exigir uma suíte completa de testes para uma alteração puramente declarativa, salvo quando as instruções do projeto ou scripts de versionamento tornarem isso necessário.

## Resposta final

Informar de forma concisa:

- tipo do bump;
- versão anterior e nova por pacote ou grupo;
- arquivos alterados;
- lockfile e ferramenta usados;
- validações executadas e respectivos resultados;
- qualquer pendência, decisão solicitada ou ação externa que não foi executada.

Se nenhuma mudança puder ser feita com segurança, explicar exatamente qual política ou informação está faltando.
