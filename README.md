# Dex AI

Dex AI é um catálogo versionado de skills para agentes de desenvolvimento,
acompanhado por uma extensão do Visual Studio Code que baixa, atualiza e
adiciona essas skills aos workspaces.

## Estrutura do projeto

```text
.
├── extension/dex/       Extensão Dex para Visual Studio Code
├── skills/              Catálogo distribuído pela extensão
│   ├── dex.json         Versão oficial do catálogo
│   └── changelog.md     Histórico de mudanças das skills
└── .vscode/             Configuração de build e debug da extensão
```

## Extensão Dex

A extensão disponibiliza comandos para:

- baixar ou atualizar o catálogo remoto de skills;
- abrir a pasta local usada pela extensão;
- copiar as skills para `.agents/skills` no workspace;
- configurar o workspace completo em uma única operação.

Para informações de uso, consulte o
[README da extensão](extension/dex/README.md). Para contribuir com o código,
consulte o [guia de desenvolvimento](extension/dex/README.dev.md).

### Executar em desenvolvimento

Instale as dependências:

```sh
cd extension/dex
npm install
```

Depois, abra a raiz deste repositório no Visual Studio Code e pressione `F5`.
Uma janela Extension Development Host será iniciada com a extensão carregada.

## Catálogo de skills

As skills ficam em subdiretórios de `skills/`. Cada uma possui um arquivo
`SKILL.md` com metadados e instruções para o agente. O catálogo atual inclui:

- `node-version-bump`: atualiza versões SemVer em projetos Node.js;
- `spec-create`: inicia a documentação de uma feature;
- `spec-manage`: refina, consolida e mantém especificações funcionais;
- `spec-plan`: divide a implementação de uma feature especificada em fases;

Ao executar `Dex: Configurar skills`, a extensão baixa o catálogo e o copia para
`.agents/skills` no workspace selecionado.

## Versionamento das skills

O catálogo segue Versionamento Semântico. A propriedade `skillsVersion` em
[skills/dex.json](skills/dex.json) é a fonte oficial da versão publicada. Toda
mudança relevante deve ser registrada em
[skills/changelog.md](skills/changelog.md), seguindo o padrão Keep a Changelog.

## Validação

Os comandos abaixo verificam a extensão:

```sh
cd extension/dex
npm run compile
npm run check
```

As convenções para manutenção automatizada do repositório estão descritas em
[AGENTS.md](AGENTS.md).
