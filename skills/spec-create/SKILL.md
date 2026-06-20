---
name: spec-create
description: Cria a estrutura inicial de uma nova feature em `specs/nome-da-feature/`, solicitando primeiro o nome da feature e depois o briefing, que é preservado no arquivo de briefing correspondente. Usar quando Codex precisar registrar uma nova ideia, demanda ou feature antes do refinamento, iniciar uma especificação a partir de texto fornecido pelo usuário ou preparar os artefatos que serão posteriormente processados pela skill spec-manage.
---

# Spec Create

Iniciar uma nova feature coletando seu nome e briefing em etapas separadas.
Produzir os artefatos em português do Brasil e seguir a estrutura consumida por
`spec-manage`.

## Fluxo obrigatório

Coletar as informações nesta ordem:

1. nome da feature;
2. briefing.

Não solicitar os dois campos na mesma mensagem quando ambos estiverem ausentes.

### 1. Solicitar o nome

Se o usuário ainda não informou o nome, perguntar somente:

```text
Qual é o nome da feature?
```

Encerrar o turno e aguardar a resposta. Não criar arquivos antes de receber um
nome válido.

Se o nome já estiver explícito no pedido que acionou a skill, não perguntar
novamente e avançar para o briefing.

### 2. Solicitar o briefing

Depois de obter o nome, se o briefing ainda não tiver sido informado, perguntar:

```text
Descreva o briefing da feature <nome da feature>. Inclua o objetivo, o comportamento esperado e qualquer restrição já conhecida.
```

Encerrar o turno e aguardar a resposta. Aceitar texto livre, lista, documento
anexado ou caminho de arquivo indicado pelo usuário.

Se nome e briefing já estiverem explícitos no pedido, criar a estrutura sem
repetir perguntas.

## Normalizar o nome

Converter o nome para kebab-case ao formar caminhos e nomes de arquivo:

- usar letras minúsculas;
- remover acentos;
- substituir espaços e separadores por `-`;
- remover caracteres que não sejam letras ASCII, números ou `-`;
- consolidar hífens consecutivos;
- remover hífens no início e no fim.

Exemplo:

```text
Mudar License Server -> mudar-license-server
```

Se a normalização resultar em nome vazio, solicitar outro nome. Preservar o nome
original no conteúdo quando ele for usado como título pelo próprio usuário.

## Preparar o repositório

Antes de criar arquivos:

1. Ler o `AGENTS.md` aplicável e os arquivos diretamente indicados por ele.
2. Criar `specs/` quando ainda não existir.
3. Se `specs/readme.md` não existir, copiar integralmente o arquivo
   `assets/specs-readme.md` desta skill para esse caminho.
4. Preservar `specs/readme.md` sem alterações quando ele já existir.
5. Ler `specs/readme.md` antes de continuar.
6. Inspecionar `specs/` para identificar colisões e convenções existentes.
7. Verificar se `specs/<feature>/` já existe.

Se a feature já existir, não sobrescrever arquivos. Informar os caminhos
encontrados e perguntar se o usuário deseja atualizar o briefing existente ou
usar outro nome.

## Criar a estrutura inicial

Criar somente:

```text
specs/
└── <feature>/
    └── <feature>.briefing.md
```

Não criar antecipadamente:

- `<feature>.refinement-questionnaire.md`;
- `<feature>.spec.md`.

Esses arquivos pertencem, respectivamente, às etapas de questionário e
consolidação da skill `spec-manage`.

## Gravar o briefing

Preservar o briefing fornecido pelo usuário sem inventar requisitos, resolver
ambiguidades ou transformá-lo em especificação.

- Manter títulos, listas, exemplos e blocos de código recebidos.
- Fazer apenas ajustes mínimos necessários para produzir Markdown válido.
- Não corrigir decisões de produto silenciosamente.
- Não adicionar perguntas de refinamento ao arquivo.
- Se o briefing vier de um arquivo, copiar seu conteúdo integralmente sem
  alterar nem remover a fonte.

Não adicionar um título automático quando o briefing já tiver título. Quando o
texto não tiver título, adicionar:

```markdown
# <Nome original da feature>
```

seguido pelo conteúdo informado.

## Concluir

Depois de criar o briefing:

1. verificar se o arquivo está no caminho esperado;
2. verificar se o conteúdo não ficou vazio;
3. executar `git diff --check` para detectar problemas básicos de formatação;
4. informar ao usuário o arquivo criado;
5. sugerir `spec-manage` como próximo passo, sem executá-la automaticamente.

Não executar testes de código para essa mudança exclusivamente documental.
