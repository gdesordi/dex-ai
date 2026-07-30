# Dex

Dex gerencia fontes de skills públicas do GitHub e sincroniza seus catálogos
com o workspace atual pelo Visual Studio Code.

## Como usar

Abra a seção **Fontes de skills Dex** no Explorer. Adicione uma fonte pelo botão
`+` ou inclua a fonte Dex padrão pelo menu de três pontos e use o botão de
sincronização para baixar as fontes habilitadas. Os catálogos são compostos no
diretório correspondente ao editor:

- Visual Studio Code: `.agents/skills`;
- Kiro: `.kiro/skills`.

O ambiente é identificado automaticamente pelo nome e pelo URI scheme do
Extension Host.

É necessário ter um workspace aberto e acesso à internet para sincronizar as
fontes.

Ao abrir uma pasta sem `.dex/sync.json`, a extensão não cria arquivos nem inclui
fontes automaticamente. A configuração só é criada quando você adiciona uma
fonte pelo botão `+` ou inclui a fonte Dex padrão pelo menu de três pontos.

Outros catálogos públicos do GitHub podem ser adicionados a `sources`:

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

A seção **Fontes de skills Dex** do Explorer lista as fontes configuradas. A
sincronização rejeita skills de mesmo nome vindas de fontes diferentes. Use os
botões inline de cada fonte para abrir seu repositório ou removê-la. Clicar no
item apenas o seleciona e não abre o navegador.

No header da view, o botão `+` inicia um cadastro guiado com exemplos para ID,
URL do GitHub, branch/tag/commit e pasta do catálogo. O botão de sincronização
atualiza todas as fontes habilitadas. As ações de incluir a fonte Dex padrão e
abrir `.dex/sync.json` e verificar atualizações ficam no menu de três pontos.

Cada item também possui um botão de sincronização, que baixa somente aquela
fonte e recompõe o workspace usando as cópias locais das demais.

## Comandos

- `Dex: Sincronizar fontes de skills`: baixa todas as fontes habilitadas e
  recompõe `.agents/skills` no VS Code ou `.kiro/skills` no Kiro.
- `Dex: Verificar atualizações das fontes`: compara os commits locais com as
  referências remotas das fontes habilitadas.
- `Dex: Adicionar fonte Dex padrão`: inclui novamente o catálogo Dex em
  `.dex/sync.json`; se o arquivo não existir, cria a primeira configuração. O
  comando não cria duplicatas nem sobrescreve uma fonte conflitante.
- `Dex: Adicionar fonte de skills`: solicita os dados da nova fonte em Quick
  Picks e atualiza `.dex/sync.json`.
- `Dex: Abrir configuração de fontes`: abre `.dex/sync.json` para edição.
- `Dex: Abrir repositório da fonte`: abre no navegador a origem selecionada na
  Tree View.
- `Dex: Sincronizar fonte de skills`: atualiza somente a fonte selecionada e
  recompõe o destino com as demais cópias locais habilitadas.
- `Dex: Remover fonte de skills`: remove a fonte da configuração e permite
  apagar também sua cópia local.

Em workspaces com várias raízes, a extensão solicita qual pasta deve receber as
skills. Os comandos acompanham o idioma do VS Code em inglês ou português do
Brasil.

A extensão não consulta nem sincroniza fontes automaticamente durante a
ativação.
