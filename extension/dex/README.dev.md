# Desenvolvimento da extensão Dex

Este documento reúne as informações necessárias para desenvolver e depurar a
extensão. A documentação voltada ao usuário está no `README.md`.

## Pré-requisitos

- Visual Studio Code 1.95 ou superior
- Node.js e npm

## Preparação

Na pasta `extension/dex`, instale as dependências:

```sh
npm install
```

## Debug

Abra a raiz do repositório no Visual Studio Code e pressione `F5`. A tarefa
`build: dex` compila o TypeScript e abre uma nova janela Extension Development
Host com a extensão carregada.

Também é possível abrir apenas `extension/dex` e usar a configuração de debug
local dessa pasta.

## Scripts

- `npm run compile`: compila `src` para `out` e gera source maps.
- `npm run watch`: recompila automaticamente durante o desenvolvimento.
- `npm run check`: valida os tipos sem gerar arquivos.
- `npm test`: compila e executa os testes automatizados.
- `npm run vscode:prepublish`: prepara a extensão para empacotamento.
- `npm run package`: compila e gera o arquivo `.vsix` da versão atual.
- `npm run publish`: publica a versão atual no Visual Studio Marketplace e, em
  seguida, no Open VSX Registry; exige autenticação com `vsce login <publisher>`
  ou `VSCE_PAT` para o Marketplace e `OVSX_PAT` para o Open VSX.

## Estrutura

- `src/extension.ts`: ativação e registro dos comandos.
- `src/sync-types.ts`: contratos da configuração e dos estados de fontes.
- `src/sync-config.ts`: parsing e validação de `.dex/sync.json`.
- `src/workspace-config.ts`: leitura, escrita e observação da configuração por
  workspace.
- `src/github-source.ts`: resolução e download de fontes públicas do GitHub.
- `src/catalog-validator.ts`: validação das skills e de seus frontmatters.
- `src/source-storage.ts`: armazenamento isolado e transacional por fonte.
- `src/source-service.ts`: sincronização em lote e composição do workspace.
- `src/sources-tree.ts`: provider da Tree View de fontes.
- `src/spec-questionnaire.ts`: contrato, parsing, serialização, status e
  ordenação dos questionários de especificação.
- `src/spec-questionnaire-command.ts`: descoberta no workspace, Quick Picks e
  persistência incremental das respostas.
- `src/time-progress.ts`: cálculo e formatação do indicador de dias úteis do
  mês na barra de status.
- `src/test/`: testes executados pelo test runner nativo do Node.js.
- `media/`: recursos visuais da extensão.
- `package.json`: manifesto, comandos e scripts.
- `package.nls.json`: textos padrão em inglês.
- `package.nls.pt-br.json`: textos em português do Brasil.
- `.vscode/`: tarefas e configuração do Extension Host.
- `out/`: JavaScript gerado pela compilação; não deve ser versionado.

## Armazenamento das skills

Cada fonte sincronizada mantém uma cópia isolada em `context.globalStorageUri`,
separada por workspace e identificador. O `SourceService` compõe as fontes
habilitadas em `.agents/skills` no VS Code ou `.kiro/skills` no Kiro. A decisão
do destino fica centralizada em `src/environment.ts` e considera
`vscode.env.appName` e `vscode.env.uriScheme`.

O metadata de cada fonte registra repositório, referência, caminho e commit Git
resolvido. A verificação de atualizações repete a resolução remota para qualquer
fonte configurada e compara esses dados, sem exigir arquivo de versão dentro do
catálogo.

Durante a composição, a extensão mantém a pasta `skills` no lugar e substitui
somente seus arquivos e subdiretórios. Uma cópia temporária do conteúdo anterior
permite restaurá-lo se a atualização falhar. Isso evita renomear a pasta
observada pelo editor, operação que pode falhar com `EPERM` no Kiro.

A extensão é ativada em `onStartupFinished` para registrar comandos, criar a
Tree View e observar as configurações dos workspaces. Nenhuma fonte é consultada
ou sincronizada automaticamente durante a ativação.

A configuração declarativa fica em `.dex/sync.json`. A ativação não cria o
arquivo nem mantém uma fonte implícita em memória. `dex.addSource` é o fluxo que
cria a primeira configuração e continua exigindo um workspace confiável para
escrita.

As ações inline da Tree View são declaradas em `view/item/context`. A remoção
atualiza primeiro `.dex/sync.json` e preserva o cache por padrão; a exclusão da
cópia local depende de uma segunda escolha explícita do usuário.

As ações globais são declaradas em `view/title`. `dex.addSource` começa por uma
lista de catálogos conhecidos, com Dex AI e GCT no início e a fonte personalizada
no fim. Somente a opção personalizada solicita os campos por caixas de entrada;
a configuração completa é normalizada e validada antes da escrita.

Somente comandos no grupo `navigation` aparecem diretamente no header. As
ações `dex.openSyncConfig` e `dex.checkSkillsUpdates` usam o grupo
`1_configuration` para permanecer no menu de três pontos.

`dex.syncSources` é a sincronização global usada no header da view.
`dex.syncSource` recebe o item como argumento, atualiza somente seu cache e
recompõe o destino com todas as fontes habilitadas.

`dex.answerSpecQuestionnaire` procura exclusivamente por
`.specs/dex/*/*.refinement-questionnaire.json` em todas as raízes abertas. O
parser exige `schemaVersion: 1`, campos obrigatórios, IDs únicos e status
coerente com as respostas. Cada resposta é gravada por substituição segura antes
de o fluxo avançar; questionários rejeitados nunca são sobrescritos.

O canal de saída `Dex` registra as etapas de consulta, download, validação,
atualização do cache e composição. Erros do GitHub distinguem repositório,
referência, pasta ou arquivo ausente, limite de API e respostas inválidas; o
canal é exibido automaticamente quando uma sincronização falha.

## Localização

Textos do manifesto usam chaves no formato `%chave%`. Ao adicionar ou alterar
um comando, mantenha a mesma chave nos dois catálogos `package.nls.json` e
`package.nls.pt-br.json`.

## Verificação manual

1. Inicie o Extension Development Host com `F5`.
2. Abra um workspace de teste.
3. Adicione uma fonte pelo botão `+`, escolhendo o catálogo Dex ou uma fonte
   personalizada.
4. Execute `Dex: Sincronizar fontes de skills` pelo header da Tree View.
5. Confirme que `.agents/skills` no VS Code ou `.kiro/skills` no Kiro contém os
   arquivos sincronizados.
6. Para validar questionários, crie um JSON conforme o contrato em
   `.specs/dex/<feature>/`, execute **Dex: Responder questionário de
   especificação** e confirme respostas, revisão, cancelamento e atualização do
   status.
