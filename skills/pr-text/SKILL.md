---
name: pr-text
description: Redige sempre em português do Brasil, em Markdown, o texto de um pull request da branch Git atual em relação a master ou main. Use quando o usuário pedir descrição, resumo ou texto para PR; se houver alterações .prw ou .tlpp, inclua ao final um resumo curto em texto puro para check-in no TFS.
---

# Texto de Pull Request

## Objetivo

Produzir um texto de pull request claro, factual e pronto para copiar e colar,
descrevendo as alterações já commitadas da branch atual em comparação com a
branch-base `master` ou `main`. Não criar pull request, commit, tag, push ou
alterar arquivos do repositório.

## Descoberta do escopo

1. Ler as instruções do repositório aplicáveis antes de inspecionar o código.
2. Identificar a branch atual e sua branch-base. Preferir a branch padrão do
   remoto quando ela for `master` ou `main`; na ausência dessa informação,
   usar nesta ordem: `master`, `main`. Se nenhuma existir localmente ou como
   referência remota disponível, informar o impedimento e pedir a branch-base.
3. Encontrar o ponto de divergência com `git merge-base <base> HEAD` e analisar
   o intervalo `<merge-base>..HEAD`. Usar os commits e o diff completo desse
   intervalo como evidência, incluindo arquivos adicionados, modificados,
   renomeados e removidos.
4. Separar alterações não commitadas da análise. Elas não pertencem ao PR da
   branch e não devem ser atribuídas a ele. Se forem relevantes para a resposta,
   avisar de forma breve que ficaram de fora.
5. Ler os trechos alterados e o contexto necessário para entender o efeito da
   mudança. Não inferir comportamento, impacto ou correção somente por nomes
   de arquivos, nomes de commits ou tickets.

## Redação

Escrever sempre em português do Brasil, inclusive se os commits, o código ou o
repositório estiverem em outro idioma. Entregar somente o Markdown final, sem
preâmbulo, análise do Git ou instruções de uso.

Usar esta estrutura quando houver informação suficiente:

```markdown
## Título

<título curto, no imperativo ou descrevendo o resultado>

## Contexto

<por que a alteração é necessária, se o diff ou os commits fornecerem evidência>

## Alterações

- <mudança e efeito observável>
- <mudança e efeito observável>

## Impacto

- <comportamento, áreas afetadas, compatibilidade ou risco conhecido>

## Validação

- <testes executados, quando forem evidenciados>
- Não executada. <motivo>, quando não houver validação verificável>
```

- Omitir `Contexto` quando não houver base confiável para explicá-lo e omitir
  `Impacto` quando não houver impacto material ou ele não puder ser confirmado.
- Agrupar detalhes de implementação por resultado para o usuário. Preferir
  frases concretas, verbos de ação e listas curtas; evitar repetir o diff,
  adjetivos promocionais, especulação e linguagem vaga como "melhorias" sem
  explicar qual melhoria ocorreu.
- Informar alterações incompatíveis, migrações, flags, configuração e riscos
  quando estiverem demonstrados no diff. Não inventar ticket, métricas,
  validação ou impacto em produção.
- Em `Validação`, distinguir claramente os comandos/testes comprovadamente
  executados dos que não foram executados. Não afirmar validação baseada apenas
  na existência de arquivos de teste.
- Se o intervalo não tiver alterações, informar sucintamente que não há
  alterações commitadas entre a branch atual e a branch-base, sem fabricar um
  texto de PR.

## Prefixo JIRA no título

Quando o diff do PR tiver ao menos um arquivo `.prw` ou `.tlpp` (sem diferenciar
maiúsculas de minúsculas), verificar se o nome da branch atual contém um código
JIRA no formato `PROJETO-1234`: uma sequência de letras maiúsculas e números,
seguida de hífen e de um número. Se encontrar um código, iniciar o título com
ele, seguido de ` - ` e do título descritivo em português. Por exemplo:

```markdown
## Título

PROJETO-1234 - Atualiza a skill de geração de texto para PR
```

Preservar o código como aparece no nome da branch. Se o diff não incluir essas
extensões ou a branch não tiver um código JIRA nesse formato, não adicionar
prefixo ao título.

## Resumo para TFS

Verificar os caminhos alterados no diff do PR, não apenas os arquivos ainda
presentes no diretório de trabalho. Se existir pelo menos um arquivo com
extensão `.prw` ou `.tlpp` (sem diferenciar maiúsculas de minúsculas), acrescentar
ao final do Markdown exatamente esta seção:

```markdown
## Resumo para check-in no TFS

<uma frase curta em texto puro que sintetize o PR>
```

A frase deve ser adequada para copiar diretamente no campo de check-in: sem
Markdown, apóstrofos, crases, listas, citações ou identificadores decorativos.
Usar apenas texto simples e pontuação comum. Ela deve resumir o resultado de
negócio ou técnico mais importante, sem exceder uma frase curta.
