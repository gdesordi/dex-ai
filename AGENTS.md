# Instruções para agentes

Estas regras se aplicam a todo o repositório.

## Escopo do projeto

- `extension/dex/` contém a extensão do Visual Studio Code.
- `skills/` contém o catálogo distribuído pela extensão.
- Preserve mudanças preexistentes e limite cada alteração ao pedido atual.
- Não edite `node_modules/` nem `extension/dex/out/` manualmente; `out/` é gerado
  pelo compilador TypeScript.

## Extensão

- Implemente comandos em `extension/dex/src/extension.ts` e registre-os em
  `extension/dex/package.json`.
- Todo texto de comando no manifesto deve usar uma chave `%...%` presente tanto
  em `package.nls.json` quanto em `package.nls.pt-br.json`.
- Mantenha `extension/dex/README.md` voltado ao usuário final e
  `extension/dex/README.dev.md` voltado a desenvolvimento.
- Registre mudanças relevantes em `extension/dex/CHANGELOG.md`.
- Após alterar código ou manifesto, execute em `extension/dex/`:

```sh
npm run compile
npm run check
```

## Skills

- Cada skill deve ficar em `skills/<nome>/SKILL.md`.
- O frontmatter de `SKILL.md` deve conter `name` e `description`; `name` deve
  corresponder ao nome do diretório.
- Recursos específicos do agente podem ficar em `skills/<nome>/agents/`.
- Não altere o comportamento de outra skill sem que isso faça parte do escopo.
- Preserve os arquivos `skills/dex.json` e `skills/changelog.md` na raiz do
  catálogo, pois eles também são distribuídos pela extensão.

## Versionamento do catálogo

- `skills/dex.json` é a fonte oficial da versão, no campo `skillsVersion`.
- Use Versionamento Semântico: `MAJOR.MINOR.PATCH`.
- Mudanças incompatíveis incrementam `MAJOR`; novas funcionalidades compatíveis
  incrementam `MINOR`; correções compatíveis incrementam `PATCH`.
- Mantenha `skills/changelog.md` no padrão Keep a Changelog.
- A seção de versão mais recente do changelog deve corresponder a
  `skillsVersion`.
- Não crie commit, tag, release ou publicação sem solicitação explícita.

## Documentação e estilo

- Escreva a documentação do projeto e das skills em português do Brasil, salvo
  quando um arquivo ou integração exigir outro idioma.
- Use caminhos e identificadores técnicos exatamente como aparecem no código.
- Atualize a documentação quando uma mudança alterar comandos, estrutura,
  instalação ou fluxo de uso.
