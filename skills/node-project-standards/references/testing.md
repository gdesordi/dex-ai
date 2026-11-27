# Testes e cobertura

- **MUST:** implementar testes unitários de comportamento relevante e
  determinísticos, com isolamento de estado e limpeza de recursos. Não adicionar
  testes que apenas reproduzem a implementação para elevar percentuais.
- **SHOULD:** adicionar integração para limites reais entre componentes e smoke
  tests para inicialização ou uso do artefato, conforme o tipo do projeto.
  Bibliotecas podem testar a importação do pacote; CLIs, uma execução local.
- **MUST:** `test` executar uma rodada finita em CI. Reservar watch ao comando
  de desenvolvimento, sem ocultar falhas com opções que aceitam ausência de
  testes quando deveria haver testes.
- **MUST:** `test:coverage` exibir percentuais no terminal e produzir relatórios
  HTML e LCOV. Configurar coleta incluindo código de produção não importado
  pelos testes, para não esconder módulos sem cobertura.
- **MUST:** verificar separadamente statements, lines, functions e branches.
  Para novos projetos sem política, usar mínimo de **80% em cada métrica**.
  Preservar limiares existentes mais exigentes. Não reduzir nenhum limiar
  existente para contornar uma falha.
- **MUST:** em adequações com cobertura insuficiente, melhorar testes no escopo
  autorizado. Se o trabalho necessário ultrapassar esse escopo, manter o gate
  e informar o bloqueio com os percentuais observados; não declarar aprovação
  nem adotar implicitamente um limiar inferior ao padrão.
- **MUST:** excluir somente arquivos justificadamente não testáveis, como
  declarações de tipos e código gerado, registrando a razão. Não excluir regras
  de negócio, integrações ou entradas da aplicação apenas por serem difíceis
  de testar.

Validar que a configuração realmente reprova cobertura abaixo do limiar e
falhas de teste, usando fixture isolada ou execução controlada, sem alterar
testes do usuário. Não publicar relatórios que possam conter segredos.
