# Desenvolvimento do Dex AI

Este documento reúne informações para desenvolver e manter o repositório. A
documentação prática para usuários está no [README.md](README.md).

## Estrutura do projeto

```text
.
├── extension/dex/       Extensão Dex para Visual Studio Code e Kiro
├── skills/              Catálogo distribuído pela extensão
│   └── changelog.md     Histórico de mudanças das skills
├── .specs/dex/          Specs gerenciadas exclusivamente pelas skills Dex
├── specs/               Especificações gerenciadas por outros fluxos
└── .vscode/             Configuração de build e debug da extensão
```

Detalhes da arquitetura e do fluxo de depuração da extensão estão em
[extension/dex/README.dev.md](extension/dex/README.dev.md).

## Configuração de fontes

Cada workspace pode declarar o estado desejado em `.dex/sync.json`. O arquivo
não é criado durante a ativação; surge somente após uma ação explícita de
cadastro:

```json
{
  "version": 1,
  "sources": [
    {
      "id": "dex-ai",
      "repository": "https://github.com/gdesordi/dex-ai",
      "ref": "main",
      "path": "skills",
      "enabled": true
    }
  ]
}
```

O contrato exige:

- `id` único em kebab-case;
- repositório público do GitHub por HTTPS;
- `ref` indicando branch, tag ou commit;
- `path` POSIX relativo à raiz do repositório;
- `enabled` para participação na sincronização global.

A extensão valida a configuração e os `SKILL.md`, resolve referências para
commits, armazena fontes separadamente e rejeita caminhos inseguros ou colisões
entre nomes de skills. Cada raiz de workspace possui configuração e
armazenamento independentes.

O destino é selecionado por `vscode.env.appName` e `vscode.env.uriScheme`:

- VS Code usa `.agents/skills`;
- Kiro usa `.kiro/skills`.

## Catálogo de skills

Cada skill fica em `skills/<nome>/SKILL.md`. O frontmatter deve conter `name` e
`description`, e `name` deve corresponder ao diretório.

O catálogo atual inclui:

- `node-version-bump`: atualiza versões SemVer em projetos Node.js;
- `dex-spec-manage`: cria, refina e mantém especificações funcionais do Dex;
- `dex-spec-plan`: cria planos a partir das especificações do Dex.

## Revisões e versionamento

O catálogo e a extensão usam identificadores independentes:

- o catálogo sincronizado é identificado pelo commit Git resolvido para a
  referência configurada;
- `extension/dex/package.json` contém a versão da extensão.

As mudanças do catálogo são registradas em
[skills/changelog.md](skills/changelog.md). A extensão registra suas mudanças
em [extension/dex/CHANGELOG.md](extension/dex/CHANGELOG.md).

Não crie commit, tag, release ou publicação sem solicitação explícita.

## Validação da extensão

Execute em `extension/dex/`:

```sh
npm install
npm run compile
npm run check
npm test
```

Para gerar um VSIX local sem publicar:

```sh
npm run package
```

As convenções para agentes e manutenção automatizada estão em
[AGENTS.md](AGENTS.md).
