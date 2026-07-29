# Dex

Dex mantém uma coleção de skills disponível no Visual Studio Code e permite
adicioná-la ao workspace atual com poucos comandos.

## Como usar

Abra a Paleta de Comandos (`Ctrl+Shift+P` ou `Cmd+Shift+P`) e execute
`Dex: Configurar skills`. A extensão baixa a versão mais recente das skills e
copia os arquivos para `.agents/skills` no workspace escolhido.

É necessário ter um workspace aberto e acesso à internet para realizar o
download.

Ao abrir uma pasta confiável pela primeira vez, a extensão cria
`.dex/sync.json` com o catálogo Dex como fonte padrão. Em Restricted Mode, a
criação é adiada até que o workspace receba confiança. Excluir a fonte do
arquivo não faz com que ela reapareça automaticamente.

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
sincronização rejeita skills de mesmo nome vindas de fontes diferentes.

## Comandos

- `Dex: Configurar skills`: baixa ou atualiza as skills e as adiciona ao
  workspace. Este é o comando recomendado para a configuração completa.
- `Dex: Verificar atualizações das skills`: compara a versão local com a versão
  publicada, permite consultar o changelog e oferece a atualização das skills e
  do workspace.
- `Dex: Baixar skills`: atualiza a cópia de skills armazenada localmente pela
  extensão.
- `Dex: Adicionar Skills ao Workspace`: copia as skills já baixadas para
  `.agents/skills`.
- `Dex: Abrir pasta das skills`: abre a cópia local no gerenciador de arquivos
  do sistema.
- `Dex: Adicionar fonte Dex padrão`: inclui novamente o catálogo Dex em
  `.dex/sync.json` caso ele tenha sido removido. O comando não cria duplicatas
  nem sobrescreve uma fonte conflitante.
- `Dex: Abrir configuração de fontes`: abre `.dex/sync.json` para edição.
- `Dex: Abrir repositório da fonte`: abre no navegador a origem selecionada na
  Tree View.

Em workspaces com várias raízes, a extensão solicita qual pasta deve receber as
skills. Os comandos acompanham o idioma do VS Code em inglês ou português do
Brasil.

A extensão verifica novas versões automaticamente uma vez ao dia. A verificação
é silenciosa quando o catálogo já está atualizado e mostra as opções de
atualização somente quando uma versão mais recente estiver disponível.
