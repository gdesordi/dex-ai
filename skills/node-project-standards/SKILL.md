---
name: node-project-standards
description: Inicializa ou padroniza projetos Node.js com documentação, TypeScript, scripts, testes, cobertura, segurança e gates de CI e publicação. Use para estabelecer ou reconciliar esses padrões em aplicações, CLIs, bibliotecas e monorepos; não para executar apenas um bump ou publicar uma versão.
---

# Padrões para projetos Node.js

Padronizar o contrato de desenvolvimento e entrega, preservando o framework,
o gerenciador de pacotes e as ferramentas adequadas ao projeto. Implementar os
arquivos e validar o resultado; não encerrar somente com recomendações.

## Níveis das regras

- **MUST:** requisito obrigatório no escopo aplicável. Conflitos com instruções
  do projeto ou limitações reais devem ser informados, sem alegar conformidade.
- **SHOULD:** padrão recomendado; desvios precisam de justificativa concreta.
- **MAY:** recurso condicionado ao tipo e à necessidade do projeto.

As instruções do usuário e do repositório têm precedência. Preservar convenções
existentes não significa ignorar lacunas: complementá-las e registrar conflitos.
Não aplicar esta skill automaticamente a toda manutenção em Node.js.

## Fluxo de aplicação

1. Ler `AGENTS.md`, verificar o estado do Git e preservar mudanças preexistentes.
   Identificar se o pedido é inicialização ou adequação e qual pacote é o alvo.
   Em projetos novos, criar apenas a estrutura necessária ao pedido; se o tipo
   de produto ou o alvo do monorepo não puder ser inferido, esclarecer essa
   decisão e continuar somente o trabalho independente dela.
2. Inspecionar manifests, workspaces, lockfiles, scripts, configuração de tipos,
   testes, cobertura, lint, formatação, documentação e CI/release. Excluir
   dependências, caches e artefatos gerados dessa descoberta.
3. Classificar aplicação, CLI ou biblioteca; identificar ambientes suportados,
   artefatos entregues e destino de publicação. Não presumir npm registry:
   aplicações podem entregar imagens, arquivos estáticos ou outros artefatos.
4. Comparar o estado atual com as referências relevantes abaixo. Aplicar os
   requisitos dentro do escopo solicitado, reutilizando ferramentas e scripts
   existentes. Não trocar frameworks ou gerenciadores apenas por preferência.
5. Atualizar documentação, instruções permanentes e changelog. Executar o
   `check` resultante e as verificações exigidas pelo repositório. Validar
   publicação com simulações locais, sem realizar ações externas.
6. Revisar o diff e informar mudanças, comandos executados, resultados,
   exceções justificadas e pendências. Distinguir configuração criada de
   proteções remotas efetivamente verificadas e publicação realizada.

## Referências por tarefa

Consultar somente os temas necessários ao trabalho; em uma padronização
completa, avaliar todos:

- [Qualidade e scripts](references/code-quality.md): ambiente, TypeScript,
  ferramentas, contrato de comandos e agregação de gates.
- [Documentação](references/documentation.md): README, AGENTS, ambiente, ADRs
  e documentação de APIs.
- [Versionamento](references/versioning.md): SemVer, changelog, commits e tags.
- [Testes](references/testing.md): cobertura, limiares e verificações reais.
- [Segurança](references/security.md): segredos, vulnerabilidades e automação
  de dependências.
- [Publicação](references/publishing.md): pré-condições, lifecycle npm,
  prevenção de duplicatas e identidade do artefato.
- [CI/CD](references/ci-cd.md): gates em PRs e releases e proteção da branch.
- [Regras para agentes](references/agent-rules.md): instruções a incorporar
  no `AGENTS.md` do projeto alvo e limites de execução.

## Limite da configuração

Configurar publicação não autoriza criar commits, tags, pushes, releases,
publicações ou deploys. Não executar scripts que produzam esses efeitos para
testá-los. Não alterar configurações remotas do repositório implicitamente.
Concluir as mudanças locais autorizadas e relatar o que depende de acesso ou
ação externa, sem bloquear o restante da implementação.
