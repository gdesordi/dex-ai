# Especificação — extension-integration

## Objetivo e contexto

Integrar os questionários de refinamento mantidos pela skill distribuída
`dex-spec-manage` à extensão Dex para Visual Studio Code. A skill deve manter
uma representação JSON de cada questionário em Markdown, e a extensão deve
permitir que o usuário localize e responda esses questionários por Quick Picks.

O JSON funciona como contrato de integração e estado interativo. O Markdown
continua sendo o registro legível das decisões e deve ser atualizado pela
`dex-spec-manage` quando o usuário solicitar sincronização, atualização ou
consolidação da especificação.

## Referências

- Briefing: `specs/extension-integration/extension-integration.briefing.md`.
- Questionário respondido:
  `specs/extension-integration/extension-integration.refinement-questionnaire.md`.
- Skill distribuída: `skills/dex-spec-manage/SKILL.md`.
- Extensão: `extension/dex/src/extension.ts` e `extension/dex/package.json`.
- Artefatos Dex gerenciados pela skill: `.specs/dex/<feature>/` no workspace do
  usuário.

## Escopo

### Incluído

- Manutenção, pela `dex-spec-manage`, de questionários equivalentes em Markdown
  e JSON.
- Definição e validação da primeira versão do contrato JSON.
- Comando da extensão para descobrir, selecionar, responder e revisar
  questionários JSON.
- Persistência incremental das respostas e atualização automática do status.
- Importação das respostas do JSON para o Markdown pela `dex-spec-manage`.
- Localização do título do novo comando em inglês e português do Brasil.
- Documentação, changelogs e testes correspondentes da skill e da extensão.

### Excluído

- Edição direta de briefings, especificações ou planos pela extensão.
- Consolidação automática da `.spec.md` imediatamente após o preenchimento no
  VS Code.
- Descoberta de questionários fora de `.specs/dex/`.
- Alteração de questionários pertencentes a outras skills ou outros diretórios
  de especificação.
- Criação de commit, tag, release ou publicação.

## Modelo de dados JSON

Cada questionário deve possuir o arquivo
`.specs/dex/<feature>/<feature>.refinement-questionnaire.json`, ao lado de sua
representação `.md`.

O contrato inicial deve possuir esta estrutura lógica:

```json
{
  "schemaVersion": 1,
  "feature": "nome-da-feature",
  "title": "Questionário de Refinamento — nome-da-feature",
  "status": "pending",
  "questions": [
    {
      "id": "1.1",
      "section": "Assunto",
      "text": "Texto da pergunta",
      "essential": true,
      "suggestion": "Sugestão objetiva",
      "answer": null
    }
  ]
}
```

### Campos do questionário

- `schemaVersion`: inteiro que identifica a versão do contrato; a primeira
  versão deve ser `1`.
- `feature`: nome normalizado da feature em kebab-case.
- `title`: título legível do questionário.
- `status`: um dos valores `pending`, `partially-answered` ou `answered`.
- `questions`: lista ordenada de questões.

### Campos da questão

- `id`: identificador hierárquico preservado entre Markdown e JSON.
- `section`: título do agrupamento temático.
- `text`: decisão solicitada ao usuário.
- `essential`: indica se a resposta afeta materialmente a implementação.
- `suggestion`: sugestão aprovada ou rejeitada pelo usuário.
- `answer`: `null` enquanto não respondida ou uma string não vazia após a
  resposta.

Selecionar a sugestão pela extensão deve persistir `manter sugestão` em
`answer`, preservando a convenção já consumida pela `dex-spec-manage`. Uma
resposta diferente deve ser persistida como texto livre informado pelo usuário.

## Requisitos funcionais

### RF-01 — Geração e manutenção do JSON pela skill

A `dex-spec-manage` deve criar ou atualizar o JSON correspondente sempre que
criar ou alterar um questionário de refinamento em Markdown. A operação deve
preservar respostas existentes associadas ao mesmo `id` quando a questão
continuar presente.

A skill não deve criar o JSON para artefatos fora de `.specs/dex/` nem acessar
questionários pertencentes a outros diretórios de especificação.

### RF-02 — Equivalência estrutural

A ordem, os identificadores, as seções, os textos, a classificação essencial e
as sugestões das questões no JSON devem refletir o questionário Markdown após
cada operação da skill.

Questões removidas do Markdown devem ser removidas do JSON. Questões novas
devem iniciar com `answer: null`. Alterações de texto em uma questão com o mesmo
`id` não devem apagar automaticamente sua resposta existente.

### RF-03 — Importação das respostas pela skill

Quando o usuário pedir para atualizar, sincronizar ou consolidar uma spec, a
`dex-spec-manage` deve ler primeiro o JSON correspondente e importar suas
respostas para as linhas `Resposta:` do Markdown.

Na consolidação, a skill deve realizar essa importação antes de decidir se as
questões essenciais estão respondidas. O valor `manter sugestão` deve ser
resolvido conforme a sugestão registrada para a mesma questão.

### RF-04 — Detecção de divergências

Quando JSON e Markdown possuírem respostas diferentes e não vazias para o mesmo
`id`, a skill não deve sobrescrever silenciosamente nenhum dos valores. Ela deve
apresentar o conflito ao usuário e aguardar a escolha de qual resposta
prevalece.

Não há conflito quando somente o JSON possui resposta: nesse caso, a resposta
deve ser copiada para o Markdown quando a sincronização for solicitada.

### RF-05 — Registro do comando

A extensão deve registrar um comando para responder questionários de
especificação. O identificador técnico sugerido é
`dex.answerSpecQuestionnaire`; o título deve usar uma chave `%...%` existente em
`extension/dex/package.nls.json` e
`extension/dex/package.nls.pt-br.json`.

O comando deve estar disponível pela Paleta de Comandos. Sua implementação deve
ser registrada por `extension/dex/src/extension.ts`, podendo delegar descoberta,
validação e persistência a módulos específicos.

### RF-06 — Descoberta de questionários

Ao ser executado, o comando deve procurar por
`.specs/dex/*/*.refinement-questionnaire.json` em todas as pastas abertas no
workspace. Não deve procurar fora de `.specs/dex/`.

O primeiro Quick Pick deve exibir todos os questionários válidos, inclusive os
que estejam com status `answered`. Cada opção deve identificar a pasta do
workspace, a feature e o status localizado. A ordenação deve priorizar
`pending`, depois `partially-answered` e por fim `answered`, mantendo ordenação
determinística dentro de cada grupo.

### RF-07 — Apresentação das questões

Após a escolha do questionário, o comando deve apresentar primeiro somente as
questões com `answer: null`. Para cada questão, o usuário deve poder:

- escolher “Manter sugestão”;
- escolher “Dar outra resposta” e informar texto livre em um Quick Pick
  editável.

O texto da pergunta, a sugestão e o progresso no questionário devem estar
visíveis durante a decisão. Uma resposta livre vazia não deve ser confirmada.

### RF-08 — Revisão de respostas

Ao concluir as questões pendentes, o comando deve oferecer a revisão de todas
as questões. Se o questionário já estiver com status `answered`, o comando deve
iniciar diretamente no modo de revisão.

Durante a revisão, respostas existentes devem ser apresentadas como valor atual
e o usuário deve poder substituí-las pela sugestão ou por outro texto.

### RF-09 — Persistência incremental e cancelamento

Cada resposta confirmada deve ser gravada no JSON antes de avançar para a
próxima questão. Se o usuário cancelar a escolha de questionário, uma pergunta,
a entrada de texto ou a revisão, o fluxo deve terminar sem descartar respostas
já confirmadas na sessão.

O arquivo deve permanecer em JSON válido mesmo quando a gravação falhar ou o
fluxo for interrompido. A extensão não deve modificar a representação Markdown.

### RF-10 — Atualização de status

O status deve ser recalculado e persistido após cada resposta confirmada:

- `pending`: nenhuma questão possui resposta;
- `partially-answered`: pelo menos uma, mas não todas, possui resposta;
- `answered`: todas as questões possuem resposta.

Todas as questões, essenciais ou não, participam do cálculo. A extensão deve
exibir os rótulos localizados “Pendente”, “Respondido parcialmente” e
“Respondido” em português do Brasil, com equivalentes em inglês.

## Regras de negócio

- RN-01: o Markdown é a fonte da estrutura e do texto das perguntas; o JSON é o
  contrato interativo e a fonte das respostas fornecidas pela extensão.
- RN-02: a `dex-spec-manage` é a única responsável por converter respostas do
  JSON em registros no Markdown e por consolidar a especificação.
- RN-03: respostas devem ser correlacionadas por `id`, nunca apenas pela posição
  na lista.
- RN-04: os três estados devem ser derivados das respostas e não podem depender
  de edição manual independente.
- RN-05: um questionário respondido continua selecionável e editável.
- RN-06: a skill e a extensão não devem sobrescrever contratos com
  `schemaVersion` que não suportem.
- RN-07: a skill deve continuar preservando o briefing e o histórico de
  decisões conforme suas regras atuais.

## Tratamento de erros

### JSON inválido ou incompatível

A extensão deve validar todos os campos obrigatórios, seus tipos, os valores de
`status`, a unicidade dos IDs e `schemaVersion` antes de disponibilizar um
questionário. Arquivos inválidos ou incompatíveis devem ser omitidos do Quick
Pick normal.

Quando houver arquivos omitidos, a extensão deve informar ao usuário a
quantidade ignorada e registrar no canal de saída Dex o caminho e a causa de
cada rejeição. Ela nunca deve sobrescrever esses arquivos.

A `dex-spec-manage` também deve recusar a importação ou atualização de JSON
inválido ou com versão incompatível e explicar a pendência sem alterar o arquivo
problemático.

### Ausência de workspace ou questionários

Se nenhuma pasta estiver aberta, o comando deve informar que é necessário abrir
um workspace. Se não houver questionários válidos, deve informar que nenhum foi
encontrado; quando existirem arquivos rejeitados, a mensagem deve distinguir
essa condição.

### Falha de leitura ou escrita

Falhas de leitura e escrita devem identificar o questionário afetado em uma
mensagem ao usuário e registrar detalhes no canal Dex. Uma falha de escrita deve
encerrar o fluxo sem avançar para outra questão nem apresentar sucesso.

### Divergência entre formatos

A skill deve tratar divergências de resposta como decisão pendente e não como
erro corrigível automaticamente. A consolidação deve permanecer bloqueada até o
usuário resolver conflitos que envolvam perguntas essenciais.

## Critérios de aceitação

- CA-01: ao criar um questionário Markdown em `.specs/dex/<feature>/`, a
  `dex-spec-manage` cria ao lado um JSON válido com `schemaVersion: 1`, todos os
  campos definidos e respostas inicialmente nulas.
- CA-02: ao alterar perguntas no Markdown por meio da skill, o JSON reflete a
  nova estrutura e preserva respostas dos IDs mantidos.
- CA-03: ao solicitar sincronização ou consolidação, respostas existentes apenas
  no JSON são copiadas para o Markdown antes da avaliação das pendências.
- CA-04: uma divergência entre respostas não vazias no JSON e no Markdown é
  apresentada ao usuário e nenhum valor é sobrescrito sem decisão.
- CA-05: o comando localiza questionários válidos em todas as raízes do
  workspace e exibe feature, raiz e status em ordem de prioridade.
- CA-06: o usuário consegue aceitar a sugestão ou gravar uma resposta livre para
  cada questão por Quick Picks.
- CA-07: cada resposta confirmada sobrevive ao cancelamento de uma etapa
  posterior e o status armazenado corresponde à quantidade de respostas.
- CA-08: questões já respondidas podem ser revisadas e alteradas, inclusive em
  questionários com status `answered`.
- CA-09: arquivos inválidos ou incompatíveis não são listados nem sobrescritos;
  a quantidade ignorada é informada e as causas são registradas no canal Dex.
- CA-10: ausência de workspace, ausência de questionários e falhas de I/O geram
  mensagens específicas sem corromper arquivos.
- CA-11: o comando aparece na Paleta de Comandos com títulos localizados em
  inglês e português do Brasil.
- CA-12: a documentação e os changelogs da skill e da extensão descrevem o novo
  contrato e o fluxo de resposta.

## Testes esperados

### Skill `dex-spec-manage`

- Criar Markdown e JSON equivalentes para um novo questionário.
- Atualizar texto, seção, sugestão e essencialidade preservando resposta por ID.
- Adicionar e remover questões, recalculando o status.
- Importar respostas do JSON para Markdown mediante solicitação.
- Resolver `manter sugestão` durante a consolidação.
- Detectar conflito entre respostas não vazias sem sobrescrever artefatos.
- Rejeitar JSON inválido ou `schemaVersion` incompatível.
- Confirmar que nenhum artefato fora de `.specs/dex/` é acessado.

### Extensão

- Validar documentos conformes e rejeitar campos ausentes, tipos incorretos,
  status desconhecido, IDs duplicados e schema incompatível.
- Descobrir questionários em workspace de raiz única e múltiplas raízes.
- Ordenar questionários por status e desambiguar features de mesmo nome.
- Persistir `manter sugestão` e respostas livres não vazias.
- Calcular as três transições de status considerando todas as questões.
- Preservar respostas confirmadas quando o usuário cancela etapas posteriores.
- Revisar e substituir respostas existentes.
- Não sobrescrever JSON inválido ou incompatível.
- Tratar ausência de workspace, ausência de resultados e falhas de leitura ou
  escrita.
- Verificar o registro, a localização e a disposição correta do comando.

## Decisões técnicas

- A primeira versão do contrato usa `schemaVersion` numérico igual a `1`.
- Os valores persistidos de status são identificadores ASCII estáveis; seus
  rótulos são localizados apenas na interface.
- A resposta “Manter sugestão” é armazenada como o marcador textual
  `manter sugestão`, compatível com o fluxo atual da skill.
- A descoberta usa o padrão limitado a um nível de feature sob `.specs/dex/`,
  sem varredura genérica do workspace.
- A persistência deve usar escrita substitutiva segura, evitando deixar conteúdo
  parcial quando ocorrer falha durante a gravação.
- O catálogo de skills deve receber o incremento SemVer compatível aplicável e
  registrar a mudança em `skills/changelog.md`; a extensão deve registrar a
  funcionalidade em `extension/dex/CHANGELOG.md`. Versionamento, commit e
  publicação continuam operações separadas.
