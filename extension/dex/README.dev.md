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
- `npm run publish`: publica a versão atual no Visual Studio Marketplace; exige
  autenticação prévia com `vsce login <publisher>` ou a variável `VSCE_PAT`.

## Estrutura

- `src/extension.ts`: ativação e registro dos comandos.
- `src/sync-types.ts`: contratos da configuração e dos estados de fontes.
- `src/sync-config.ts`: parsing e validação de `.dex/sync.json`.
- `src/workspace-config.ts`: inicialização e observação da configuração por
  workspace.
- `src/github-source.ts`: resolução e download de fontes públicas do GitHub.
- `src/catalog-validator.ts`: validação das skills e de seus frontmatters.
- `src/source-storage.ts`: armazenamento isolado e transacional por fonte.
- `src/source-service.ts`: sincronização em lote e composição do workspace.
- `src/sources-tree.ts`: provider da Tree View de fontes.
- `src/test/`: testes executados pelo test runner nativo do Node.js.
- `media/`: recursos visuais da extensão.
- `package.json`: manifesto, comandos e scripts.
- `package.nls.json`: textos padrão em inglês.
- `package.nls.pt-br.json`: textos em português do Brasil.
- `.vscode/`: tarefas e configuração do Extension Host.
- `out/`: JavaScript gerado pela compilação; não deve ser versionado.

## Armazenamento das skills

O comando de download grava os arquivos em
`context.globalStorageUri/skills`. A cópia para o workspace é feita de forma
recursiva em `.agents/skills`, preservando os demais arquivos do workspace.

A última verificação automática de atualização é persistida em
`context.globalState` pela chave `dex.skills.lastUpdateCheckAt`. A extensão é
ativada em `onStartupFinished` e um timer avalia a cada hora se o intervalo de
24 horas já foi atingido.

A configuração declarativa fica em `.dex/sync.json`. A extensão cria a fonte
`dex-ai` automaticamente quando o arquivo não existe e o workspace é confiável.
Em Restricted Mode, mantém a configuração padrão apenas em memória até receber
o evento `vscode.workspace.onDidGrantWorkspaceTrust`.

## Localização

Textos do manifesto usam chaves no formato `%chave%`. Ao adicionar ou alterar
um comando, mantenha a mesma chave nos dois catálogos `package.nls.json` e
`package.nls.pt-br.json`.

## Verificação manual

1. Inicie o Extension Development Host com `F5`.
2. Abra um workspace de teste.
3. Execute `Dex: Configurar skills`.
4. Confirme que `.agents/skills` contém os arquivos baixados.
5. Execute `Dex: Abrir pasta das skills` e confirme que o diretório correto foi
   aberto no sistema.
