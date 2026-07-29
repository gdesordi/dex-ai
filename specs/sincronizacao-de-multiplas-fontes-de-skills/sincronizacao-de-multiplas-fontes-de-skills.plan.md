# Plano de Implementação — Sincronização de múltiplas fontes de skills

## Referências

- Especificação:
  `sincronizacao-de-multiplas-fontes-de-skills.spec.md`
- Decisões de refinamento:
  `sincronizacao-de-multiplas-fontes-de-skills.refinement-questionnaire.md`
- Ativação e implementação atuais: `extension/dex/src/extension.ts`
- Manifesto e localização: `extension/dex/package.json`,
  `extension/dex/package.nls.json` e `extension/dex/package.nls.pt-br.json`
- Documentação: `extension/dex/README.md`, `extension/dex/README.dev.md` e
  `extension/dex/CHANGELOG.md`

## Estratégia

Extrair a lógica hoje concentrada em `extension/dex/src/extension.ts` para
módulos com contratos explícitos e partes puras testáveis. Implementar primeiro
o modelo de configuração e a inicialização por workspace; em seguida, o
provedor GitHub, a validação e o armazenamento isolado. Sobre essas fundações,
implementar a composição transacional e a migração legada, depois adaptar os
comandos e, por último, conectar a Tree View e concluir a documentação.

Os testes unitários devem usar o test runner nativo do Node.js, evitando
introduzir um framework de testes. Dependências de runtime devem ser adicionadas
diretamente a `extension/dex/package.json` e ao lockfile, sem depender de pacotes
transitivos já presentes em `node_modules/`.

## Fases

### Fase 1 — Contratos, configuração e inicialização por workspace

**Objetivo:** ler, validar, preservar e inicializar `.dex/sync.json` de forma
independente para cada pasta do workspace.

**Dependências:** nenhuma.

**Alterações:**

- [ ] Criar em `extension/dex/src/` os tipos compartilhados de configuração,
  fonte, estado de sincronização, metadados locais e resultado por fonte,
  incluindo a versão `1` do contrato.
- [ ] Extrair para um módulo de configuração a leitura e validação de
  `.dex/sync.json`, aplicando os defaults de `path` e `enabled` e emitindo erros
  associados ao arquivo, fonte e campo correspondentes.
- [ ] Validar IDs, URLs públicas HTTPS do GitHub, referências e caminhos POSIX,
  rejeitando caminhos absolutos e segmentos vazios, `.` ou `..` antes de
  qualquer operação remota ou gravação derivada.
- [ ] Implementar escrita de configuração que preserve campos desconhecidos da
  raiz e das fontes, sem armazenar estado transitório.
- [ ] Definir a fonte Dex padrão uma única vez e reutilizá-la na inicialização e
  na futura implementação de `dex.addDefaultSource`.
- [ ] Integrar em `extension/dex/src/extension.ts` a inicialização automática de
  `.dex/sync.json` por pasta confiável, sem download implícito, e adiar a escrita
  até `vscode.workspace.onDidGrantWorkspaceTrust` em Restricted Mode.
- [ ] Observar criação, alteração e remoção de `.dex/sync.json` por pasta e
  publicar um evento interno de atualização que a Tree View consumirá em fase
  posterior.
- [ ] Adicionar infraestrutura de testes em `extension/dex/package.json` e
  arquivos de teste TypeScript para parsing, defaults, preservação de campos,
  validação de caminhos, multi-root e inicialização condicionada à confiança.

**Validação:**

- [ ] `npm test` em `extension/dex/` — todos os testes da configuração e da
  inicialização passam.
- [ ] `npm run compile` em `extension/dex/` — os novos módulos são compilados
  sem editar manualmente `out/`.
- [ ] `npm run check` em `extension/dex/` — não existem erros de tipos.

**Critério de conclusão:** os cenários CA-02, CA-07, CA-08, CA-09, CA-10,
CA-16, CA-19 e CA-20 possuem implementação e cobertura automatizada nas partes
que não dependem da interface.

### Fase 2 — Provedor GitHub, validação e armazenamento isolado

**Objetivo:** sincronizar uma fonte pública do GitHub para uma cópia local
validada, identificada pelo commit resolvido e substituída de forma
transacional.

**Dependências:** Fase 1.

**Alterações:**

- [ ] Criar um provedor GitHub em `extension/dex/src/` que normalize a origem,
  resolva branch, tag ou commit, consulte a árvore da referência e diferencie
  erros de rate limit, referência inexistente, pasta inexistente, resposta
  truncada e catálogo vazio.
- [ ] Adaptar o download concorrente e cancelável existente em
  `extension/dex/src/extension.ts` para operar sobre `repository`, `ref` e
  `path`, codificando segmentos de URL e reaplicando a validação de confinamento
  antes de cada gravação.
- [ ] Criar um validador de catálogo e `SKILL.md`; selecionar um parser YAML
  mínimo mantido como dependência direta e atualizar
  `extension/dex/package.json` e `extension/dex/package-lock.json`.
- [ ] Validar que cada skill de primeiro nível contém `SKILL.md`, possui
  frontmatter com `name` e `description` e usa no frontmatter o mesmo nome do
  diretório; preservar recursos auxiliares e separar `dex.json` e
  `changelog.md` como metadados do catálogo.
- [ ] Criar uma camada de armazenamento sob `context.globalStorageUri` que
  derive uma chave estável para a pasta do workspace, isole cada `source.id` e
  mantenha áreas ativa e temporária sem colisões entre workspaces.
- [ ] Persistir metadados da cópia ativa com origem, referência solicitada,
  commit resolvido, versão SemVer opcional, horário, resultado e quantidade de
  skills.
- [ ] Substituir a cópia ativa somente depois de download e validação completos;
  em falha ou cancelamento, limpar a área temporária e preservar a última cópia
  válida.
- [ ] Implementar consulta remota de atualização por commit sem baixar os
  arquivos do catálogo.
- [ ] Cobrir com testes o provedor usando respostas HTTP simuladas e o
  armazenamento usando URIs temporárias, sem depender da rede real.

**Validação:**

- [ ] `npm test` em `extension/dex/` — passam os testes de download, validação,
  confinamento, metadados, falhas HTTP e troca transacional.
- [ ] `npm run compile` em `extension/dex/` — o provedor e o armazenamento são
  compilados.
- [ ] `npm run check` em `extension/dex/` — contratos de fonte e resultado
  permanecem consistentes.

**Critério de conclusão:** uma fonte pode ser baixada, validada, versionada pelo
commit e atualizada isoladamente sem corromper sua cópia anterior, satisfazendo
CA-03, CA-04, CA-08 e CA-12.

### Fase 3 — Composição transacional, conflitos e migração legada

**Objetivo:** compor `.agents/skills` com propriedade rastreável, preservar
arquivos não gerenciados e migrar instalações anteriores com segurança.

**Dependências:** Fase 2.

**Alterações:**

- [ ] Criar em `extension/dex/src/` um compositor que enumere as skills de todas
  as fontes habilitadas com cópia válida e detecte colisões pelo nome antes de
  alterar o workspace.
- [ ] Produzir um manifesto local de composição com fonte, commit e arquivos de
  cada skill gerenciada, salvando-o no armazenamento associado à pasta do
  workspace.
- [ ] Construir a nova composição em área temporária, incorporar o conteúdo não
  gerenciado da instalação atual e substituir `.agents/skills` somente após
  validação completa; preservar a composição anterior em erro, cancelamento ou
  conflito.
- [ ] Remover na composição seguinte somente arquivos atribuídos pelo manifesto
  a fontes removidas ou desabilitadas, sem apagar arquivos não gerenciados.
- [ ] Implementar a migração inicial comparando byte a byte
  `.agents/skills` com `context.globalStorageUri/skills`, atribuindo à fonte
  `dex-ai` apenas arquivos legados idênticos e preservando adicionais,
  modificados ou sem correspondência.
- [ ] Gravar o primeiro manifesto somente após composição bem-sucedida e impedir
  que a inferência legada seja repetida nas composições seguintes.
- [ ] Implementar a decisão de falha parcial: usar a cópia anterior validada da
  fonte que falhou quando todas as fontes habilitadas possuírem cópia válida;
  bloquear a composição se alguma nunca tiver sido sincronizada.
- [ ] Expor no resultado da composição os commits efetivamente utilizados, o
  estado misto, conflitos e motivos de bloqueio para comandos e Tree View.
- [ ] Adicionar testes para colisões, conteúdo não gerenciado, desativação,
  remoção, migração legada, falha parcial e atomicidade da composição.

**Validação:**

- [ ] `npm test` em `extension/dex/` — passam os testes do compositor e da
  migração, inclusive cenários de falha e cancelamento.
- [ ] `npm run compile` em `extension/dex/` — o compositor é compilado.
- [ ] `npm run check` em `extension/dex/` — o manifesto e os resultados de
  composição estão tipados sem inconsistências.

**Critério de conclusão:** a composição satisfaz CA-01, CA-05, CA-06, CA-21 e
CA-22 e nunca substitui a última instalação válida por um conjunto incompleto ou
conflitante.

### Fase 4 — Orquestração e compatibilidade dos comandos

**Objetivo:** adaptar os comandos atuais ao conjunto de fontes e implementar as
operações de configuração e sincronização exigidas pelo MVP.

**Dependências:** Fase 3.

**Alterações:**

- [ ] Criar um serviço de orquestração por pasta do workspace que serialize
  operações concorrentes, sincronize uma fonte ou todas as habilitadas, tente
  todas as fontes no lote e produza resumo com sucesso, falha, conflito,
  desabilitação e uso de cópia anterior.
- [ ] Refatorar `dex.downloadSkills`, `dex.addSkillsToWorkspace`,
  `dex.configureSkills`, `dex.checkSkillsUpdates` e `dex.openSkillsFolder` em
  `extension/dex/src/extension.ts` para consumir os novos serviços e manter o
  comportamento multi-root.
- [ ] Implementar `dex.addDefaultSource` de forma idempotente, criando o arquivo
  quando ausente, preservando campos e fontes existentes e rejeitando ID ou
  catálogo duplicado conforme RF-05.
- [ ] Implementar comandos para adicionar, ativar, desativar e remover uma
  fonte, abrir o repositório, abrir `.dex/sync.json` e exibir detalhes do último
  erro ou conflito.
- [ ] Na remoção, atualizar primeiro a configuração, oferecer preservação do
  cache como escolha padrão e apagar a cópia local somente após confirmação;
  tratar falha de limpeza sem restaurar a fonte.
- [ ] Garantir que alterações de configuração e remoções não iniciem
  sincronização ou composição automaticamente.
- [ ] Reconciliar a verificação periódica existente com múltiplas fontes para
  que ela apenas consulte atualizações e não sincronize conteúdo sem ação do
  usuário.
- [ ] Registrar todos os novos comandos em `extension/dex/package.json` e criar
  chaves correspondentes nos dois arquivos NLS.
- [ ] Adicionar testes de orquestração e comandos para seleção de workspace,
  idempotência, conflitos de ID, falhas parciais, remoção e compatibilidade dos
  comandos anteriores.

**Validação:**

- [ ] `npm test` em `extension/dex/` — passam os testes dos comandos e da
  orquestração.
- [ ] `npm run compile` em `extension/dex/` — todos os comandos registrados
  resolvem para implementações compiladas.
- [ ] `npm run check` em `extension/dex/` — a ativação e os serviços não possuem
  erros de tipos.

**Critério de conclusão:** os fluxos de CA-13, CA-14, CA-16, CA-17, CA-18 e
CA-23 funcionam pela paleta de comandos sem depender da Tree View.

### Fase 5 — Tree View e gerenciamento visual

**Objetivo:** disponibilizar uma visão atualizada das fontes e todas as ações de
gerenciamento no Explorer do VS Code.

**Dependências:** Fase 4.

**Alterações:**

- [ ] Criar um `TreeDataProvider` em `extension/dex/src/` que agrupe pastas em
  workspaces multi-root e liste fontes, referência, caminho, estado habilitado,
  estado de sincronização, quantidade de skills, commit ou versão e atualização
  disponível quando conhecidos.
- [ ] Representar os estados não sincronizada, sincronizando, sincronizada,
  desabilitada, desatualizada com erro, conflito e erro com ícones nativos,
  descrições e tooltips acessíveis.
- [ ] Em Restricted Mode sem configuração, exibir a fonte Dex padrão em memória
  e atualizar a árvore após a concessão de confiança e criação do arquivo.
- [ ] Conectar o observador de `.dex/sync.json`, mudanças de workspace e
  resultados das operações ao refresh seletivo da Tree View.
- [ ] Contribuir a view no Explorer e seus menus em
  `extension/dex/package.json`, incluindo ações globais e ações contextuais
  compatíveis com o estado de cada item.
- [ ] Acrescentar chaves de localização para título da view, ações, estados,
  descrições e mensagens em `package.nls.json` e `package.nls.pt-br.json` quando
  usadas pelo manifesto.
- [ ] Adicionar testes do provedor para árvore vazia, pasta única, multi-root,
  configuração inválida, Restricted Mode e todos os estados de fonte.

**Validação:**

- [ ] `npm test` em `extension/dex/` — passam os testes do provedor e dos
  contextos de menu.
- [ ] `npm run compile` em `extension/dex/` — a contribuição visual e o provider
  são compilados.
- [ ] `npm run check` em `extension/dex/` — os itens e comandos contextuais estão
  corretamente tipados.
- [ ] Iniciar o Extension Development Host com `F5` e confirmar manualmente os
  estados, refresh e ações em workspace simples e multi-root.

**Critério de conclusão:** CA-11, CA-15, CA-19 e CA-20 são verificáveis pela
interface, e todas as ações previstas em RF-05 estão disponíveis no contexto
correto.

### Fase 6 — Documentação, regressão e empacotamento local

**Objetivo:** concluir a entrega com documentação atualizada, regressão dos
fluxos antigos e validação do pacote instalável.

**Dependências:** Fase 5.

**Alterações:**

- [ ] Atualizar `extension/dex/README.md` em português do Brasil com
  `.dex/sync.json`, fonte padrão, Tree View, comandos, conflitos, sincronização
  manual, Restricted Mode e limitações do MVP.
- [ ] Atualizar `extension/dex/README.dev.md` com a nova arquitetura, layout do
  armazenamento, manifesto de composição, migração legada, suíte de testes e
  procedimento de depuração multi-root.
- [ ] Registrar a feature em `extension/dex/CHANGELOG.md` na seção
  `[Não publicado]`, seguindo Keep a Changelog.
- [ ] Executar uma verificação manual com duas fontes públicas sem colisão, duas
  fontes conflitantes, uma fonte inválida, falha parcial com e sem cache, remoção
  e recriação de `dex-ai`, conteúdo local modificado e Restricted Mode.
- [ ] Revisar mensagens e logs para que identifiquem pasta, fonte, operação,
  commit utilizado e erro sem expor credenciais.
- [ ] Gerar o `.vsix` localmente para validar o conteúdo empacotado, sem
  publicar, criar release, tag ou commit.

**Validação:**

- [ ] `npm test` em `extension/dex/` — a suíte completa passa.
- [ ] `npm run compile` em `extension/dex/` — a compilação final passa.
- [ ] `npm run check` em `extension/dex/` — a verificação final de tipos passa.
- [ ] `npm run package` em `extension/dex/` — o `.vsix` é gerado e contém os
  arquivos necessários, sem inclusão manual de `out/` no controle de versão.
- [ ] `git diff --check` na raiz do repositório — não existem erros básicos de
  formatação.

**Critério de conclusão:** todos os critérios CA-01 a CA-23 estão cobertos por
teste automatizado ou roteiro manual documentado, a documentação descreve o
comportamento entregue e o pacote local é gerado com sucesso.

## Paralelismo e ordem de execução

- As fases 1 a 4 formam o caminho crítico e devem ocorrer em ordem, pois
  estabelecem contratos consumidos pelas fases seguintes.
- Dentro da Fase 2, o provedor GitHub e a camada de armazenamento podem evoluir
  em paralelo após a estabilização dos tipos da Fase 1; ambos convergem no fluxo
  transacional de sincronização.
- Na Fase 3, testes de migração podem ser preparados em paralelo ao compositor
  depois que o formato do manifesto local estiver definido.
- A documentação técnica da Fase 6 pode ser rascunhada após a Fase 4, mas a
  documentação final e o changelog devem refletir a interface concluída na Fase
  5.
- Não iniciar a Tree View antes de estabilizar estados, resultados e comandos,
  pois esses contratos determinam itens, contextos e ações disponíveis.

## Riscos e mitigação

- **Limite da API pública do GitHub:** distinguir rate limit de catálogo vazio,
  reutilizar o commit resolvido durante uma operação e evitar consultas
  duplicadas.
- **Perda de conteúdo local:** compor em área temporária, manter manifesto de
  propriedade, comparar a migração byte a byte e nunca assumir arquivos
  duvidosos como gerenciados.
- **Colisão entre workspaces:** derivar chaves estáveis das URIs completas das
  pastas e testar workspaces com nomes iguais em locais diferentes.
- **Troca não atômica em alguns sistemas de arquivos:** preservar backup ou
  estratégia de restauração até a nova composição estar instalada e cobrir a
  falha intermediária em testes.
- **Configuração editada durante uma operação:** trabalhar com um snapshot
  validado e atualizar a Tree View ao final; exigir nova operação para aplicar a
  configuração mais recente.
- **Compatibilidade com a instalação antiga:** manter a cópia legada intacta até
  concluir a primeira migração e registrar o manifesto novo.

## Definição de pronto

- [ ] `.dex/sync.json` é inicializado e gerenciado conforme confiança e
  isolamento do workspace.
- [ ] Fontes públicas do GitHub podem ser sincronizadas individualmente ou em
  lote por referência e caminho configurados.
- [ ] Downloads e composições são transacionais, canceláveis e preservam a
  última cópia válida.
- [ ] Colisões são rejeitadas sem escolher uma fonte vencedora.
- [ ] Arquivos não gerenciados e modificações legadas são preservados.
- [ ] Falhas parciais usam cache válido somente nas condições aprovadas e são
  comunicadas com o commit efetivamente utilizado.
- [ ] A Tree View representa fontes, estados e ações em workspace simples,
  multi-root e Restricted Mode.
- [ ] `dex.addDefaultSource` recria a fonte Dex sem duplicar ou sobrescrever
  configuração conflitante.
- [ ] Comandos existentes continuam funcionais sobre o conjunto de fontes.
- [ ] Textos do manifesto possuem chaves equivalentes nos dois arquivos NLS.
- [ ] Testes automatizados e verificações manuais cobrem CA-01 a CA-23.
- [ ] `npm test`, `npm run compile`, `npm run check` e `npm run package` passam.
- [ ] README do usuário, documentação de desenvolvimento e changelog estão
  atualizados.
- [ ] Nenhum commit, tag, release ou publicação foi criado implicitamente.
