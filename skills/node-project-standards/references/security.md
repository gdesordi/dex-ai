# Segurança

- **MUST:** manter credenciais, tokens e segredos fora do Git e dos exemplos,
  logs, bundles e artefatos. Preservar referências a secrets do provedor;
  nunca copiar valores para scripts ou documentação.
- **MUST:** validar variáveis de ambiente necessárias na inicialização da
  aplicação, com erro útil sem revelar valores sensíveis. Não impor requisitos
  de ambiente na importação de uma biblioteca que não os utiliza.
- **MUST:** verificar vulnerabilidades com o mecanismo do gerenciador ou scanner
  existente e propagar reprovações conforme a política. Definir severidades,
  escopo (produção e desenvolvimento), tratamento de falhas de consulta e
  exceções. Sem política anterior, bloquear vulnerabilidades altas e críticas
  em ambos os escopos e documentar essa decisão inicial.
- **MUST:** uma consulta indisponível deve ser relatada como verificação
  inconclusiva e bloquear publicação, sem ser convertida em sucesso. Exceções
  devem ter justificativa, responsável e prazo; não criar exceções só para
  aprovar a tarefa.
- **SHOULD:** configurar Dependabot ou Renovate conforme o provedor, cobrindo
  o gerenciador e workflows existentes. Não instalar dois bots concorrentes.
- **MUST:** limitar permissões dos pipelines aos jobs que precisam delas.
  Impedir exposição de credenciais de entrega a código de PRs não confiáveis.
- **MUST:** não executar `npm audit fix --force` automaticamente. Avaliar
  correções e compatibilidade, regenerar o lockfile pelo gerenciador e validar
  mudanças no escopo autorizado.
