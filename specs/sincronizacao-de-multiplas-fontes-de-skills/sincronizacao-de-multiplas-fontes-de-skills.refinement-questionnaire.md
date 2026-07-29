# Questionário de Refinamento — Sincronização de múltiplas fontes de skills

## Como responder

Responda abaixo de cada pergunta, mantendo a numeração. Respostas curtas são
suficientes. Quando a sugestão estiver adequada, responda `manter sugestão`.
Itens marcados como **Essencial** afetam diretamente a implementação.

## Inicialização e confiança do workspace

### 1.1 — Criação automática em workspace não confiável

**Essencial.** A especificação determina que a extensão crie automaticamente
`.dex/sync.json` na primeira ativação, mas ainda não define se isso pode ocorrer
quando o VS Code estiver em Restricted Mode.

**Sugestão:** não escrever em workspaces não confiáveis. Exibir a fonte padrão
somente em memória e criar o arquivo automaticamente assim que o usuário
conceder confiança ao workspace.

Resposta: manter sugestão

## Migração do fluxo anterior

### 2.1 — Propriedade das skills já instaladas

**Essencial.** Workspaces configurados pela versão atual podem possuir skills em
`.agents/skills` sem o novo manifesto de composição. Considerá-las todas não
gerenciadas impediria que a nova versão atualizasse ou removesse com segurança
as skills legadas.

**Sugestão:** na primeira composição, comparar a instalação existente com a
cópia legada armazenada pela extensão. Assumir como gerenciados somente os
arquivos idênticos dessa cópia; preservar arquivos ausentes, adicionais ou
modificados pelo usuário como não gerenciados. Depois, gravar o novo manifesto
de composição.

Resposta:manter sugestão

## Falhas parciais

### 3.1 — Uso da última cópia válida quando uma atualização falhar

**Essencial.** A especificação permite que as outras fontes terminem o download,
mas não determina com precisão se a composição pode prosseguir usando a última
cópia válida de uma fonte cuja atualização acabou de falhar.

**Sugestão:** permitir a composição quando toda fonte habilitada possuir alguma
cópia local válida. Usar a cópia anterior da fonte que falhou, marcar seu estado
como desatualizado com erro e informar no resumo que o workspace contém versões
de sincronizações diferentes. Se qualquer fonte habilitada nunca tiver sido
sincronizada com sucesso, preservar a composição anterior.

Resposta:manter sugestão

## Remoção e armazenamento

### 4.1 — Limpeza da cópia local ao remover uma fonte

**Essencial.** A especificação exige confirmação antes de apagar a última cópia
baixada, mas não define o comportamento padrão do comando de remoção.

**Sugestão:** remover imediatamente a fonte de `.dex/sync.json` e perguntar se o
usuário também deseja apagar seu cache local. A resposta padrão deve preservar
o cache. Independentemente da escolha, retirar as skills da fonte somente na
próxima composição explícita.

Resposta: manter sugestão
