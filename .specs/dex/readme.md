# Especificações Dex

Esta pasta é de uso exclusivo das skills `dex-spec-manage` e `dex-spec-plan`.
Apenas essas skills devem ler ou escrever specs neste caminho.
Cada feature possui uma subpasta própria em `.specs/dex/<feature>/`.

## Estrutura

```text
.specs/
└── dex/
    ├── readme.md
    └── <feature>/
        ├── <feature>.briefing.md
        ├── <feature>.refinement-questionnaire.md
        ├── <feature>.refinement-questionnaire.json
        ├── <feature>.spec.md
        └── <feature>.plan.md
```

O nome da feature deve usar kebab-case, com letras minúsculas, números e hífens.
Nem toda feature terá os quatro arquivos desde o início; eles surgem conforme o
fluxo avança.

## Artefatos

### Briefing

`<feature>.briefing.md` preserva a demanda original. Pode conter objetivo,
comportamento esperado, restrições, exemplos e referências ainda sem
refinamento. Não deve ser reescrito para concordar retroativamente com decisões
posteriores.

### Questionário de refinamento

`<feature>.refinement-questionnaire.md` registra ambiguidades, sugestões e
respostas. Perguntas marcadas como **Essencial** precisam ser respondidas antes
da consolidação da especificação.

`<feature>.refinement-questionnaire.json` espelha a estrutura do questionário,
mantém as respostas usadas pela integração com a extensão Dex e registra o
estado `pending`, `partially-answered` ou `answered`. A `dex-spec-manage` mantém
as duas representações sincronizadas e trata divergências antes de consolidar a
especificação.

### Especificação

`<feature>.spec.md` descreve o comportamento atual e aprovado. Deve explicitar
escopo, requisitos, regras de negócio, erros, critérios de aceitação e testes
esperados relevantes. É um documento de estado atual, não um changelog.

### Plano de implementação

`<feature>.plan.md` divide a implementação aprovada em fases executáveis, com
dependências, tarefas, validações e critérios de conclusão. Deve derivar de uma
especificação consolidada e não substitui requisitos nem decisões de produto.

## Fluxo

1. `dex-spec-manage` coleta e preserva o briefing, cria o questionário, consolida
   a primeira especificação e a mantém sincronizada com mudanças posteriores já
   aprovadas. Quando o briefing já está definido, o refinamento começa no mesmo
   turno.
2. `dex-spec-plan` cria ou atualiza o plano de implementação dividido em fases.

## Regras

- Usar português do Brasil.
- Não criar questionário, especificação ou plano vazios antecipadamente.
- Preservar o briefing e as respostas já registradas.
- Não transformar suposições relevantes em requisitos confirmados.
- Manter uma única pasta por feature.
- Atualizar critérios de aceitação e testes esperados junto com mudanças
  funcionais.
- Não ler, importar nem alterar specs mantidas fora de `.specs/dex/`.
- Não usar `specs/`, outras subpastas de `.specs/`, `docs/` ou caminhos
  equivalentes como origem alternativa de artefatos.
- Não permitir que outras skills leiam ou escrevam specs nesta pasta.
