# Regras permanentes para agentes

Incorporar as regras aplicáveis no `AGENTS.md` do projeto, preservando conteúdo
existente e usando os comandos reais identificados na padronização:

- **MUST:** preservar convenções e mudanças preexistentes; limitar o diff à
  tarefa e não introduzir dependências sem necessidade.
- **MUST:** nunca desabilitar gates, reduzir cobertura mínima ou remover testes
  simplesmente por estarem falhando. Corrigir a causa ou informar o bloqueio.
- **MUST:** não ignorar erros de TypeScript ou ESLint sem justificativa técnica
  específica. Não adicionar supressões amplas para concluir a tarefa.
- **MUST:** atualizar a documentação quando mudar comportamento e registrar
  mudanças relevantes no changelog conforme a política do projeto.
- **MUST:** executar `check` ao concluir implementações, além das verificações
  exigidas pelo repositório. Informar quais comandos passaram, falharam ou não
  puderam ser executados e por quê; não apresentar ausência de execução como
  aprovação.
- **MUST:** não criar commits, tags, pushes, releases, publicações ou deploys
  sem solicitação explícita. Autorização para configurar o processo não é
  autorização para executá-lo.

Registrar pendências concretas quando ambiente, acesso ou escopo impedirem uma
validação. Não modificar políticas para transformar essas pendências em sucesso.
