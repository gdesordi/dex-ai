# Especificações

Esta pasta é a fonte canônica das especificações funcionais do projeto. Cada
feature possui uma subpasta própria em `specs/<feature>/`.

## Estrutura

```text
specs/
├── readme.md
└── <feature>/
    ├── <feature>.briefing.md
    ├── <feature>.refinement-questionnaire.md
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

### Especificação

`<feature>.spec.md` descreve o comportamento atual e aprovado. Deve explicitar
escopo, requisitos, regras de negócio, erros, critérios de aceitação e testes
esperados relevantes. É um documento de estado atual, não um changelog.

### Plano de implementação

`<feature>.plan.md` divide a implementação aprovada em fases executáveis, com
dependências, tarefas, validações e critérios de conclusão. Deve derivar de uma
especificação consolidada e não substitui requisitos nem decisões de produto.

## Fluxo

1. `spec-create` solicita o nome e o briefing e cria o arquivo inicial.
2. `spec-refinement` cria o questionário e, depois das respostas essenciais,
   consolida a especificação.
3. `spec-plan` cria ou atualiza o plano de implementação dividido em fases.
4. `spec-update` mantém a especificação sincronizada com mudanças posteriores
   já aprovadas.

## Regras

- Usar português do Brasil.
- Não criar questionário, especificação ou plano vazios antecipadamente.
- Preservar o briefing e as respostas já registradas.
- Não transformar suposições relevantes em requisitos confirmados.
- Manter uma única pasta por feature.
- Atualizar critérios de aceitação e testes esperados junto com mudanças
  funcionais.
- Não manter cópias concorrentes em `.spec`, `.specs` ou `docs/spec`.
