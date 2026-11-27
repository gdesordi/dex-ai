# Versionamento e releases

- **MUST:** adotar SemVer e identificar o manifesto ou grupo de manifests que
  representa cada entrega. Em monorepos, preservar versionamento independente
  ou sincronizado conforme a política existente.
- **MUST:** manter `CHANGELOG.md` no padrão Keep a Changelog, com seção
  `Unreleased` ou seu equivalente existente `[Não publicado]`. Não duplicar
  seções equivalentes. Registrar mudanças relevantes e preservar o histórico.
  Respeitar o formato de datas do projeto.
- **MUST:** adotar Conventional Commits para novos commits, documentando a
  convenção em AGENTS ou no guia de contribuição. Não reescrever commits
  existentes nem criar commits durante a padronização.
- **MUST:** usar tags `v<versão>`, como `v1.0.0`, para entregas de um pacote ou
  grupo sincronizado. Se pacotes independentes exigirem namespaces já adotados,
  preservar essa convenção e documentar a exceção; não forçar versões iguais.
- **MUST:** antes da publicação, conferir SemVer válido e igualdade entre a
  versão do manifesto, a seção de release do changelog e a tag correspondente.
  Validar no commit entregue, não na branch padrão nem apenas por regex parcial.
  Usar o parser SemVer existente quando disponível.
- **MUST:** impedir sobrescrita de tags e versões publicadas. Consultar o
  destino real com o nome e a versão do pacote/artefato; uma falha de rede ou
  autenticação não comprova que uma versão está disponível.

A padronização configura essa política; não executa bump nem promove notas
para uma release fictícia. Preservar ferramentas existentes de versionamento
e geração de notas quando atendam ao contrato. Não adicionar uma segunda
automação que concorra com elas.
