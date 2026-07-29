# Dex

Dex mantém uma coleção de skills disponível no Visual Studio Code e permite
adicioná-la ao workspace atual com poucos comandos.

## Como usar

Abra a Paleta de Comandos (`Ctrl+Shift+P` ou `Cmd+Shift+P`) e execute
`Dex: Configurar skills`. A extensão baixa a versão mais recente das skills e
copia os arquivos para o diretório correspondente ao editor:

- Visual Studio Code: `.agents/skills`;
- Kiro: `.kiro/skills`.

O ambiente é identificado automaticamente pelo nome e pelo URI scheme do
Extension Host.

É necessário ter um workspace aberto e acesso à internet para realizar o
download.

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
abrir `.dex/sync.json` ficam no menu de três pontos.

Cada item também possui um botão de sincronização, que baixa somente aquela
fonte e recompõe o workspace usando as cópias locais das demais.

## Comandos

- `Dex: Configurar skills`: baixa ou atualiza as skills e as adiciona ao
  workspace. Este é o comando recomendado para a configuração completa.
- `Dex: Verificar atualizações das skills`: compara a versão local com a versão
  publicada, permite consultar o changelog e oferece a atualização das skills e
  do workspace.
- `Dex: Baixar skills`: atualiza a cópia de skills armazenada localmente pela
  extensão.
- `Dex: Adicionar Skills ao Workspace`: copia as skills já baixadas para
  `.agents/skills` no VS Code ou `.kiro/skills` no Kiro.
- `Dex: Abrir pasta das skills`: abre a cópia local no gerenciador de arquivos
  do sistema.
- `Dex: Adicionar fonte Dex padrão`: inclui novamente o catálogo Dex em
  `.dex/sync.json`; se o arquivo não existir, cria a primeira configuração. O
  comando não cria duplicatas nem sobrescreve uma fonte conflitante.
- `Dex: Adicionar fonte de skills`: solicita os dados da nova fonte em Quick
  Picks e atualiza `.dex/sync.json`.
- `Dex: Abrir configuração de fontes`: abre `.dex/sync.json` para edição.
- `Dex: Abrir repositório da fonte`: abre no navegador a origem selecionada na
  Tree View.

Em workspaces com várias raízes, a extensão solicita qual pasta deve receber as
skills. Os comandos acompanham o idioma do VS Code em inglês ou português do
Brasil.

A extensão verifica novas versões automaticamente uma vez ao dia. A verificação
é silenciosa quando o catálogo já está atualizado e mostra as opções de
atualização somente quando uma versão mais recente estiver disponível.
