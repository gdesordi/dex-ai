# Ambiente, qualidade e scripts

## Ambiente reproduzível

- **MUST:** usar um único gerenciador por projeto, respeitando `packageManager`
  e o lockfile existente. Versionar o lockfile e fixar a versão do gerenciador
  no mecanismo adotado. Não misturar lockfiles ou editá-los manualmente.
- **MUST:** definir uma versão LTS suportada do Node.js em `.nvmrc` e um
  intervalo compatível em `engines.node`. Respeitar requisitos do framework e
  verificar o suporte na documentação oficial ao escolher a versão; não
  perpetuar um número fixo copiado de outro projeto.
- **MUST:** usar instalação imutável em CI: `npm ci` para npm e o equivalente
  apropriado à versão de pnpm, Yarn ou Bun adotada. Falhar em divergência do
  lockfile, em vez de regenerá-lo no pipeline.
- **MUST:** evitar dependências redundantes e adicionar somente ferramentas
  necessárias. Verificar documentação oficial das versões instaladas antes
  de gerar configurações de ESLint, TypeScript e demais ferramentas.

## Código

- **MUST:** usar TypeScript com `strict: true` no código novo. Em projetos JS
  existentes, avaliar a migração no escopo pedido; não reescrever a aplicação
  inteira implicitamente. Registrar a migração pendente quando não for viável
  e não declarar o projeto totalmente conforme.
- **MUST:** configurar ESLint e Prettier sem regras conflitantes, preservando
  integrações existentes que já atendam ao contrato. Expor verificações sem
  correção automática para CI. Não substituir ferramentas equivalentes já
  adotadas sem necessidade; justificar o desvio dessas ferramentas padrão.
- **MUST:** manter `.editorconfig` e `.gitignore` adequados. Excluir dependências,
  caches, cobertura, artefatos e segredos; preservar arquivos de configuração
  e exemplos que precisam ser versionados.

## Contrato de scripts

Implementar comandos reais no `package.json`. Adaptar os comandos abaixo ao
gerenciador, framework e organização de workspaces; preservar aliases usados
por integrações. Não criar scripts que apenas imprimem sucesso.

| Script | Contrato |
| --- | --- |
| `dev` | Desenvolvimento com recompilação ou recarga quando aplicável |
| `start` | Executar a aplicação em produção |
| `build` | Gerar os artefatos entregáveis |
| `clean` | Remover somente artefatos gerados conhecidos |
| `lint` | Validar código sem alterá-lo |
| `lint:fix` | Aplicar correções de lint |
| `format` | Formatar os arquivos do projeto |
| `format:check` | Verificar formatação sem escrever |
| `typecheck` | Verificar tipos sem depender apenas da transpilação |
| `test` | Executar testes uma vez e propagar falhas |
| `test:watch` | Executar testes continuamente no desenvolvimento |
| `test:coverage` | Executar testes com relatórios e limiares de cobertura |
| `check` | Agregar todos os gates locais de qualidade |
| `publish` | Executar o fluxo documentado de entrega, quando publicável |

**MUST:** oferecer os scripts aplicáveis. Bibliotecas podem omitir `start`;
projetos sem modo de execução interativo podem omitir `dev`. Documentar
omissões justificadas. Não inventar um destino de publicação para projeto
privado sem fluxo de entrega definido; registrar a pendência correspondente.

**MUST:** `check` executar formatação, lint, tipos, testes com cobertura,
verificação de vulnerabilidades conforme política e build, propagando qualquer
falha com código diferente de zero. Um único `test:coverage` pode atender aos
gates de testes e cobertura, evitando executar a mesma suíte duas vezes.
Reutilizar essa agregação em CI e publicação.

Separar pré-condições de release (Git limpo, versão inédita, changelog/tag) do
`check` cotidiano: o desenvolvedor precisa poder validar alterações ainda não
commitadas. O pipeline de publicação agrega essas pré-condições ao `check`;
não fazer `check` chamar `publish` nem exigir credenciais de publicação.

Em monorepos, agregar os pacotes afetados e suas dependências na ordem correta,
sem omitir falhas de workspaces. `clean` não deve apagar arquivos de usuário
nem diretórios calculados a partir de entradas não validadas.
