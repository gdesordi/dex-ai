# Dex

Dex mantém uma coleção de skills disponível no Visual Studio Code e permite
adicioná-la ao workspace atual com poucos comandos.

## Como usar

Abra a Paleta de Comandos (`Ctrl+Shift+P` ou `Cmd+Shift+P`) e execute
`Dex: Configurar skills`. A extensão baixa a versão mais recente das skills e
copia os arquivos para `.agents/skills` no workspace escolhido.

É necessário ter um workspace aberto e acesso à internet para realizar o
download.

## Comandos

- `Dex: Configurar skills`: baixa ou atualiza as skills e as adiciona ao
  workspace. Este é o comando recomendado para a configuração completa.
- `Dex: Baixar skills`: atualiza a cópia de skills armazenada localmente pela
  extensão.
- `Dex: Adicionar Skills ao Workspace`: copia as skills já baixadas para
  `.agents/skills`.
- `Dex: Abrir pasta das skills`: abre a cópia local no gerenciador de arquivos
  do sistema.

Em workspaces com várias raízes, a extensão solicita qual pasta deve receber as
skills. Os comandos acompanham o idioma do VS Code em inglês ou português do
Brasil.

## Atualizações

Consulte o [CHANGELOG.md](CHANGELOG.md) para conhecer as mudanças de cada
versão.
