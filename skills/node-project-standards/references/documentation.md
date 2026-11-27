# Documentação

- **MUST:** criar ou complementar `README.md`, `AGENTS.md` e `CHANGELOG.md` sem
  sobrescrever conteúdo existente. Escrever em português do Brasil, exceto
  onde a integração ou o projeto exigir outro idioma.
- **MUST:** no README, documentar objetivo, requisitos de ambiente, gerenciador,
  instalação pelo lockfile, comandos realmente disponíveis, desenvolvimento,
  build, execução e fluxo de publicação aplicáveis. Explicar diferenças de
  pacote, diretório e comando em monorepos.
- **MUST:** documentar variáveis de ambiente, obrigatoriedade, finalidade e
  valores padrão seguros. Quando houver configuração por ambiente, fornecer
  `.env.example` sem segredos e explicar como preparar a configuração local.
  Não inventar variáveis nem afirmar que `.env` é carregado sem implementação.
- **MUST:** no AGENTS, registrar comandos de validação e obrigações de manter
  documentação e changelog coerentes com mudanças relevantes. Incorporar as
  [regras para agentes](agent-rules.md), preservando instruções preexistentes.
- **SHOULD:** registrar decisões arquiteturais relevantes em ADRs no diretório
  já adotado ou, se ausente, em `docs/adr/`. Registrar contexto, decisão e
  consequências; não gerar ADR para cada ajuste de ferramenta.
- **MAY:** documentar APIs HTTP com OpenAPI/Swagger quando houver API aplicável.
  Preservar o mecanismo existente e validar o contrato contra a implementação;
  não introduzir servidor de documentação em bibliotecas ou CLIs sem API HTTP.

Atualizar instruções junto das mudanças de comportamento. Não documentar
sucesso de pipeline, instalação, proteção de branch ou publicação sem evidência.
