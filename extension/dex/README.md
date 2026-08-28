# Dex

Dex gerencia fontes públicas de skills hospedadas no GitHub e compõe os
catálogos habilitados em cada workspace pelo Visual Studio Code ou pelo Kiro.

## Como usar

1. Abra uma pasta ou workspace confiável.
2. No Explorer, localize a seção **Fontes de skills Dex**.
3. Use o botão `+` e escolha o catálogo Dex ou uma fonte personalizada.
4. Use o botão de sincronização no cabeçalho para atualizar todas as fontes
   habilitadas.

A extensão identifica o editor automaticamente e grava a composição em:

- Visual Studio Code: `.agents/skills`;
- Kiro: `.kiro/skills`.

É necessário ter acesso à internet durante a sincronização e a verificação de
atualizações.

## Tempo do mês

No lado direito da barra de status, a Dex mostra um ícone de relógio e o
percentual de dias úteis já transcorridos no mês atual. O cálculo considera
segunda a sexta-feira, inclui o dia útil atual e não desconta feriados. Passe o
mouse sobre o indicador para ver a quantidade de dias úteis transcorridos e o
total do mês. O valor é atualizado na virada de cada dia local.

## Configuração por workspace

As fontes ficam declaradas em `.dex/sync.json` na raiz selecionada. Abrir uma
pasta sem esse arquivo não cria configuração, adiciona fontes, consulta o GitHub
ou sincroniza skills automaticamente. O arquivo é criado somente quando uma
fonte é adicionada pela extensão.

Exemplo de configuração:

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

Cada fonte define um identificador único, a URL pública do GitHub, uma branch,
tag ou commit, o caminho do catálogo no repositório e se participa das
sincronizações. Em workspaces com várias raízes, os comandos globais solicitam
qual pasta deve ser usada.

## Sincronização

O botão de sincronização no cabeçalho baixa todas as fontes habilitadas, valida
seus catálogos, atualiza a cópia local isolada de cada fonte e recompõe o destino
do workspace. Skills de mesmo nome em fontes diferentes são rejeitadas.

O botão de sincronização de uma fonte atualiza somente a fonte selecionada. O
destino é recomposto com sua nova cópia e com as cópias locais das demais fontes
habilitadas.

Ao adicionar uma fonte conhecida ou personalizada, a extensão inicia
automaticamente sua primeira sincronização. Se ela falhar ou for cancelada, a
configuração é preservada para uma nova tentativa manual.

Durante a composição, a pasta `.agents/skills` ou `.kiro/skills` permanece no
lugar e somente seu conteúdo é substituído. A extensão mantém uma cópia
temporária do conteúdo anterior para restauração em caso de falha. Como o
destino inteiro é gerenciado pela Dex, arquivos e skills adicionados manualmente
dentro dele são removidos na próxima composição.

Se o download de uma fonte falhar durante a sincronização global, a extensão
registra a falha e usa sua última cópia local válida, quando disponível, para
compor o destino. Os detalhes ficam no canal de saída **Dex**.

A verificação de atualizações é manual. Para cada repositório configurado, ela
resolve a referência remota e compara seu commit com o commit armazenado na
última sincronização, sem depender de um manifesto de versão e sem baixar o
catálogo. Mudanças de repositório, referência ou caminho também indicam que a
fonte precisa ser sincronizada.

Ao alterar uma fonte de `enabled: true` para `enabled: false`, a extensão remove
imediatamente do workspace as skills fornecidas por ela e informa quantas foram
removidas. A cópia local isolada da fonte é preservada.

## Tree View

A seção **Fontes de skills Dex** lista as fontes de cada raiz do workspace.

- O botão `+` lista primeiro os catálogos conhecidos, começando por Dex AI e
  GCT, e mantém **Fonte de skills personalizada** como última opção.
- O botão de sincronização do cabeçalho atualiza todas as fontes habilitadas.
- Os botões de cada fonte permitem sincronizá-la, abrir seu repositório ou
  removê-la.
- O menu de três pontos permite abrir `.dex/sync.json` e verificar atualizações.

Clicar em uma fonte apenas a seleciona; o repositório é aberto pelo botão
correspondente. Ao remover uma fonte, é possível preservar ou apagar sua cópia
local isolada.

## Comandos

- `Dex: Sincronizar fontes de skills`: sincroniza todas as fontes habilitadas e
  recompõe o destino.
- `Dex: Sincronizar fonte de skills`: sincroniza a fonte selecionada e recompõe
  o destino com todas as fontes habilitadas.
- `Dex: Verificar atualizações das fontes`: compara os commits locais com as
  referências remotas configuradas.
- `Dex: Adicionar fonte de skills`: permite escolher um catálogo conhecido ou
  cadastrar uma fonte personalizada em `.dex/sync.json`.
- `Dex: Abrir configuração de fontes`: abre `.dex/sync.json` para edição.
- `Dex: Abrir repositório da fonte`: abre no navegador a origem selecionada.
- `Dex: Remover fonte de skills`: remove a fonte da configuração e oferece a
  opção de apagar sua cópia local.
- `Dex: Responder questionário de especificação`: localiza questionários JSON
  mantidos pela `dex-spec-manage` em `.specs/dex/`, permite aceitar a sugestão
  ou escrever outra resposta e grava cada decisão imediatamente.

## Questionários de especificação

A skill `dex-spec-manage` mantém cada questionário em Markdown e no arquivo
`<feature>.refinement-questionnaire.json`. Ao executar o comando de resposta, a
extensão procura esses arquivos em todas as pastas do workspace, apresenta os
pendentes primeiro e também permite revisar questionários já respondidos.

O estado exibido pode ser **Pendente**, **Respondido parcialmente** ou
**Respondido**. Cancelar o fluxo preserva as respostas confirmadas até aquele
momento. Arquivos inválidos ou com versão de schema incompatível não são
alterados; os detalhes ficam no canal de saída **Dex**.

Depois de responder, solicite à `dex-spec-manage` que sincronize ou consolide a
spec para transportar as respostas do JSON ao questionário Markdown.

Os comandos acompanham o idioma do editor em inglês ou português do Brasil.
Nenhuma fonte é consultada ou sincronizada automaticamente durante a ativação.
