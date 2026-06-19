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
- `npm run vscode:prepublish`: prepara a extensão para empacotamento.

## Estrutura

- `src/extension.ts`: ativação, comandos, download e cópia das skills.
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
