# Questionário de Refinamento — default-sources-as-json

## Como responder

Responda abaixo de cada pergunta, mantendo a numeração. Respostas curtas são
suficientes. Quando a sugestão estiver adequada, responda `manter sugestão`.
Itens marcados como **Essencial** afetam diretamente a implementação.

## Catálogo remoto

### 1.1 — Quais dados o JSON remoto deve controlar?

Hoje `default-sources.ts` define os dados de conexão das cinco fontes, enquanto
`known-sources.ts` define rótulos, descrições e a ordem do seletor. Para atualizar
realmente a lista sem publicar a extensão, o JSON pode conter também esses dados
de apresentação, em vez de apenas `SyncSource`.

**Essencial.** Sugestão: o JSON deve conter uma lista ordenada de fontes conhecidas
com `id`, `label`, `description`, `repository`, `ref`, `path`, `agentsPath`
opcional e `enabled`; a opção de fonte personalizada continua local e última.

Resposta:
manter sugestão

### 1.2 — Qual será a origem estável do arquivo?

Uma URL `raw` em `main` permite atualização imediata, mas uma alteração inválida
ou indisponibilidade não pode impedir a ativação da extensão.

**Essencial.** Sugestão: versionar `extension/dex/default-sources.json` neste
repositório e buscá-lo pela URL raw do GitHub na branch `main`.

Resposta:
manter sugestão

## Disponibilidade e efeito das atualizações

### 2.1 — Como a extensão deve agir se a consulta, o download ou a validação do JSON falhar?

Na ativação, pode ainda não haver rede, e um catálogo remoto não confiável não
deve substituir uma lista válida.

**Essencial.** Sugestão: usar uma lista embutida como fallback da instalação;
somente aplicar a resposta remota após validação integral; registrar a falha no
canal Dex sem notificação intrusiva. A extensão não deve gravar o catálogo remoto
no workspace.

Resposta:
manter sugestão

### 2.2 — Que comportamentos devem refletir o catálogo carregado nesta ativação?

As fontes conhecidas são usadas na configuração inicial e no seletor “Adicionar
fonte de skills”. Configurações `.dex/sync.json` existentes são escolhas do
usuário e não devem ser reescritas silenciosamente.

**Essencial.** Sugestão: aplicar o catálogo remoto ao seletor e à criação de uma
nova fonte padrão; preservar integralmente fontes já registradas em
`.dex/sync.json`, inclusive quando deixarem de constar do catálogo.

Resposta:
manter sugestão

## Segurança e atualização

### 3.1 — O catálogo deve ser reutilizado entre ativações?

Um cache local permite usar a última lista válida offline, mas introduz política
de armazenamento e invalidação. A lista embutida já garante funcionamento sem
rede.

Sugestão: não criar cache adicional nesta primeira versão; consultar a origem a
cada ativação e usar o fallback embutido quando necessário.

Resposta:
manter sugestão
