# Especificação — default-sources-as-json

## Objetivo e contexto

A extensão Dex deve atualizar, durante sua ativação, as fontes conhecidas
oferecidas ao usuário sem exigir uma nova publicação da extensão. O catálogo é
mantido publicamente no repositório Dex AI e substitui somente a lista conhecida
em memória da ativação corrente.

## Referências

- Briefing: `default-sources-as-json.briefing.md`.
- Decisões: `default-sources-as-json.refinement-questionnaire.md`.
- Implementação atual: `extension/dex/src/default-sources.ts` e
  `extension/dex/src/known-sources.ts`.

## Escopo

Incluído:

- catálogo JSON versionado em `extension/dex/default-sources.json`;
- consulta do arquivo pela URL raw pública do GitHub na branch `main` durante a
  ativação;
- aplicação do catálogo validado ao seletor de fontes conhecidas e à criação da
  fonte padrão Dex;
- fallback embutido e registro de erros no canal de saída Dex.

Excluído:

- alteração automática de `.dex/sync.json` já existente;
- cache persistente do catálogo remoto;
- suporte a fontes fora do GitHub ou a autenticação para o catálogo.

## Requisitos funcionais

1. A extensão deve distribuir um catálogo embutido equivalente às fontes
   conhecidas atuais.
2. O arquivo remoto deve conter uma lista ordenada de fontes com `id`, `label`,
   `description`, `repository`, `ref`, `path`, `enabled` e `agentsPath`
   opcional.
3. Na ativação, a extensão deve consultar
   `https://raw.githubusercontent.com/gdesordi/dex-ai/main/extension/dex/default-sources.json`.
4. Somente um catálogo integralmente válido deve substituir o catálogo embutido
   em memória.
5. A opção “Fonte de skills personalizada” deve permanecer local e como último
   item do seletor.
6. O comando para adicionar o catálogo Dex deve usar a definição `dex-ai` do
   catálogo carregado e preservar as verificações contra duplicidade existentes.
7. Fontes já presentes em `.dex/sync.json` não devem ser modificadas, removidas
   ou atualizadas em consequência da consulta.

## Regras de negócio

- A ordem do array remoto determina a ordem das fontes conhecidas.
- Os identificadores devem ser únicos e atender às mesmas restrições aplicadas a
  `SyncSource`.
- O catálogo deve conter a fonte `dex-ai`, necessária para a configuração padrão.
- Falhas de rede, HTTP, leitura ou validação devem preservar o catálogo embutido
  (ou o catálogo válido já carregado) e não devem interromper a ativação.

## Tratamento de erros

Erros ao obter ou validar o catálogo devem ser escritos no canal de saída Dex,
com data e contexto. A extensão não deve mostrar notificação intrusiva nem
persistir uma resposta inválida no workspace.

## Critérios de aceitação

- CA-01: uma extensão instalada usa o catálogo embutido antes da conclusão da
  consulta remota.
- CA-02: um JSON remoto válido altera, na ativação corrente, os itens conhecidos
  exibidos ao adicionar fontes, preservando a opção personalizada por último.
- CA-03: um JSON malformado, incompleto, com fontes inválidas ou IDs duplicados
  não altera a lista embutida e gera registro no canal Dex.
- CA-04: indisponibilidade da URL remota não impede a ativação nem modifica
  `.dex/sync.json` existente.
- CA-05: ao selecionar Dex AI, a fonte adicionada corresponde à definição
  carregada para `dex-ai` e as regras de conflito continuam aplicadas.

## Testes esperados

- Validar o parser para catálogo válido, JSON inválido, esquema inválido,
  identificadores duplicados e ausência de `dex-ai`.
- Validar que a carga remota troca o catálogo apenas após resposta válida e
  preserva o fallback em erro.
- Validar a ordem das escolhas e a permanência da fonte personalizada.
- Executar `npm run compile`, `npm run check` e a suíte da extensão.

## Decisões técnicas

- O fallback é distribuído em TypeScript para permitir a primeira ativação sem
  rede e sem necessidade de cache adicional.
- O catálogo remoto usa JSON com uma versão de esquema explícita, validado antes
  de entrar no estado compartilhado da extensão.
