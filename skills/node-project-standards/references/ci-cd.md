# CI/CD

- **MUST:** usar GitHub Actions ou o provedor existente, preservando workflows
  úteis. Executar instalação pelo lockfile e o mesmo `check` em todos os PRs
  para branches de integração e antes de publicar.
- **MUST:** usar Node compatível com `.nvmrc` e `engines`. Para bibliotecas
  com múltiplas versões suportadas, **SHOULD** validar uma matriz coerente.
- **MUST:** jobs de entrega dependerem de todos os gates por `needs` ou
  equivalente. Não permitir publicação após falha, cancelamento ou gate pulado.
  Evitar `continue-on-error`, `|| true` e `always()` na rota de entrega.
- **MUST:** não usar filtros de caminhos que deixem mudanças relevantes sem
  validação ou checks obrigatórios permanentemente pendentes. Conferir nomes
  estáveis dos checks exigidos pela proteção da branch.
- **SHOULD:** automatizar a geração de releases pelo fluxo de versionamento
  adotado, sem publicar ou criar release durante esta configuração. Reutilizar
  os artefatos validados conforme [publicação](publishing.md).
- **MUST:** aplicar permissões mínimas por job e disponibilizar credenciais de
  entrega somente após os gates, sem executar código não confiável com elas.
  Consultar documentação oficial atual ao escolher versões e interfaces de
  actions; respeitar a política de pinagem do projeto.
- **SHOULD:** proteger a branch principal e exigir os checks antes de merge.
  Inspecionar regras existentes quando houver acesso. A configuração remota
  exige autorização específica; criar YAML local não ativa branch protection.
  Sem acesso ou autorização, documentar checks necessários e informar essa
  pendência sem declarar a branch protegida.

Validar sintaxe, diretórios de execução, dependências entre jobs e propagação
de falhas. Distinguir verificações locais da primeira execução real no provedor;
não prometer que o workflow passou sem observar sua execução.
