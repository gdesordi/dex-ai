# Questionário de Refinamento — extension-integration

## Como responder

Responda abaixo de cada pergunta, mantendo a numeração. Respostas curtas são
suficientes. Quando a sugestão estiver adequada, responda `manter sugestão`.
Itens marcados como **Essencial** afetam diretamente a implementação.

## 1. Contrato do questionário em JSON

### 1.1 — **Essencial** — Qual deve ser o nome do arquivo JSON associado ao questionário em Markdown?

O nome precisa ser previsível para que a extensão encontre apenas questionários
gerenciados pela `dex-spec-manage`.

**Sugestão:** usar o mesmo nome-base do Markdown, trocando somente a extensão:
`<feature>.refinement-questionnaire.json`, ao lado de
`<feature>.refinement-questionnaire.md` em `.specs/dex/<feature>/`.

Resposta: manter sugestão

### 1.2 — **Essencial** — Quais campos devem compor o contrato inicial do JSON?

Essa decisão define a integração entre a skill e a extensão e afeta a evolução
compatível do formato.

**Sugestão:** incluir `schemaVersion`, `feature`, `title`, `status` e
`questions`; cada questão deve conter `id`, `section`, `text`, `essential`,
`suggestion` e `answer`, sendo `answer` nulo enquanto não houver resposta.

Resposta: manter sugestão

### 1.3 — **Essencial** — Quais valores exatos devem ser persistidos em `status` e como eles são calculados?

O briefing define três estados em linguagem natural, mas ainda não determina os
identificadores do contrato nem a regra para questões não essenciais.

**Sugestão:** persistir `pending`, `partially-answered` e `answered`, exibindo na
interface os rótulos “Pendente”, “Respondido parcialmente” e “Respondido”. O
estado deve considerar todas as questões: nenhuma respondida = `pending`, parte
respondida = `partially-answered`, todas respondidas = `answered`.

Resposta: manter sugestão

## 2. Sincronização entre JSON e Markdown

### 2.1 — **Essencial** — Qual artefato prevalece quando JSON e Markdown contêm respostas divergentes?

A skill precisa manter os dois formatos sem apagar silenciosamente uma decisão
registrada por outro fluxo.

**Sugestão:** a estrutura e o texto das perguntas no Markdown são mantidos pela
skill e espelhados no JSON; respostas gravadas pela extensão no JSON prevalecem
quando o usuário solicitar atualização do Markdown. Se uma resposta já
existente no Markdown for diferente, a skill deve sinalizar o conflito e pedir
uma decisão antes de sobrescrever.

Resposta: manter sugestão

### 2.2 — **Essencial** — Quando a `dex-spec-manage` deve sincronizar respostas do JSON para o Markdown?

O briefing diz “quando solicitado”, mas não define quais pedidos ou operações
acionam essa leitura.

**Sugestão:** sincronizar quando o usuário pedir explicitamente para atualizar,
sincronizar ou consolidar a spec; na consolidação, primeiro importar as respostas
do JSON para o Markdown e só então avaliar se todas as perguntas essenciais
foram respondidas.

Resposta: manter sugestão

## 3. Descoberta e seleção na extensão

### 3.1 — **Essencial** — Em quais pastas a extensão deve procurar questionários JSON?

Workspaces do VS Code podem conter uma ou várias pastas, e a
`dex-spec-manage` limita sua propriedade a `.specs/dex/`.

**Sugestão:** procurar recursivamente por
`.specs/dex/*/*.refinement-questionnaire.json` em todas as pastas do workspace;
no Quick Pick inicial, exibir a pasta do workspace, a feature e o status para
desambiguar resultados.

Resposta: manter sugestão

### 3.2 — A seleção inicial deve incluir questionários com status `answered`?

Permitir a seleção facilita revisar respostas, enquanto ocultá-los mantém o
fluxo focado apenas no trabalho pendente.

**Sugestão:** listar todos os questionários, ordenar os pendentes primeiro e
identificar claramente o status; ao abrir um questionário respondido, permitir
revisar e alterar respostas existentes.

Resposta: manter sugestão

## 4. Fluxo de resposta

### 4.1 — **Essencial** — Como o comando deve se comportar ao cancelar uma pergunta ou o fluxo?

Sem uma regra explícita, o cancelamento pode causar perda de respostas já dadas
na sessão ou produzir um status incorreto.

**Sugestão:** oferecer em cada questão “Manter sugestão” e “Dar outra resposta”;
a segunda opção abre um Quick Pick com entrada livre. Cancelar qualquer etapa
encerra o fluxo, preserva no JSON todas as respostas confirmadas até então e
recalcula o status. Respostas anteriores devem aparecer como valor atual quando
a questão for revisitada.

Resposta: manter sugestão

### 4.2 — O comando deve apresentar todas as questões ou somente as ainda não respondidas?

Essa escolha afeta a velocidade do primeiro preenchimento e a facilidade de
revisão posterior.

**Sugestão:** apresentar primeiro somente as questões sem resposta e, ao final,
oferecer a opção de revisar todas. Se o questionário já estiver totalmente
respondido, iniciar diretamente no modo de revisão.

Resposta: manter sugestão

## 5. Compatibilidade e falhas

### 5.1 — **Essencial** — O que a extensão deve fazer ao encontrar JSON inválido ou com versão de schema incompatível?

Editar parcialmente um arquivo desconhecido pode corromper o questionário e
suas respostas.

**Sugestão:** validar o documento antes de exibi-lo; ignorar arquivos inválidos
na seleção normal, informar quantos foram ignorados e registrar os detalhes no
canal de saída Dex. Nunca sobrescrever um JSON inválido ou com `schemaVersion`
não suportada.

Resposta: manter sugestão
