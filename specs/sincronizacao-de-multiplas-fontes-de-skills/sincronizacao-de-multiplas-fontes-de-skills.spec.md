# Especificação — Sincronização de múltiplas fontes de skills

## Objetivo e contexto

A extensão Dex atualmente baixa um único catálogo de skills, definido por URLs
fixas do repositório `gdesordi/dex-ai`, armazena-o em
`context.globalStorageUri/skills` e o copia para `.agents/skills`.

Esta feature deve permitir que cada projeto declare múltiplas fontes de skills
em `.dex/sync.json`, mantenha essas fontes sincronizadas e as gerencie por uma
Tree View do VS Code. A configuração deve ser compartilhável pelo repositório do
projeto, enquanto estado transitório e conteúdo baixado devem permanecer fora
do controle de versão.

## Referências

- Briefing: `sincronizacao-de-multiplas-fontes-de-skills.briefing.md`.
- Decisões de refinamento:
  `sincronizacao-de-multiplas-fontes-de-skills.refinement-questionnaire.md`.
- Implementação atual: `extension/dex/src/extension.ts`.
- Manifesto da extensão: `extension/dex/package.json`.
- Catálogo Dex: `skills/`.

## Escopo

### Incluído no MVP

- Configuração de múltiplas fontes em `.dex/sync.json`.
- Fontes hospedadas em repositórios públicos do GitHub.
- Uma pasta de catálogo por fonte.
- Referência explícita a branch, tag ou commit.
- Tree View para visualizar e gerenciar fontes.
- Sincronização manual individual ou de todas as fontes habilitadas.
- Armazenamento isolado por fonte e composição em `.agents/skills`.
- Validação da configuração, dos caminhos e das skills.
- Detecção e rejeição de colisões entre fontes.
- Inicialização automática de novos arquivos de configuração com a fonte Dex
  padrão.
- Comando para incluir ou recriar a fonte Dex padrão.

### Excluído do MVP

- GitLab, Bitbucket e outros provedores.
- Repositórios privados e fluxo de autenticação.
- URLs de arquivos, pacotes ou diretórios locais como fontes.
- Prioridade, sobrescrita ou mesclagem de skills em conflito.
- Sincronização automática em segundo plano.
- Publicação, edição ou envio de conteúdo para os repositórios de origem.

## Modelo de configuração

O arquivo `.dex/sync.json` deve seguir este contrato:

```json
{
  "version": 1,
  "sources": [
    {
      "id": "dex-ai",
      "repository": "https://github.com/gdesordi/dex-ai",
      "ref": "main",
      "path": "skills",
      "enabled": true
    }
  ]
}
```

### Campos da raiz

- `version` deve ser um inteiro suportado pela extensão. O MVP deve aceitar
  apenas `1`.
- `sources` deve ser uma lista, podendo estar vazia.

### Campos da fonte

- `id` deve ser obrigatório, estável, único no arquivo e adequado para uso como
  nome de diretório. Deve conter somente letras ASCII minúsculas, números e
  hífens, sem hífen no início ou no fim.
- `repository` deve ser obrigatório e, no MVP, usar uma URL HTTPS de repositório
  público do GitHub no formato `https://github.com/<owner>/<repository>`.
- `ref` deve ser obrigatório e identificar uma branch, tag ou commit.
- `path` deve ser opcional, relativo à raiz do repositório e assumir `skills`
  quando omitido.
- `enabled` deve ser opcional e assumir `true` quando omitido.
- Campos desconhecidos devem ser preservados por operações de edição da
  extensão, mas ignorados pelo sincronizador do MVP.

O arquivo não deve conter tokens, senhas ou outras credenciais.

## Requisitos funcionais

### RF-01 — Descoberta da configuração

A extensão deve procurar `.dex/sync.json` na raiz do workspace selecionado. Em
workspaces com múltiplas pastas, cada pasta deve possuir configuração e estado
de sincronização independentes, e os comandos devem solicitar a pasta quando a
ação não estiver associada a um item da Tree View.

### RF-02 — Inicialização com a fonte Dex padrão

Na primeira ativação da extensão em cada pasta de workspace confiável que ainda
não possua `.dex/sync.json`, a extensão deve criar `.dex/`, criar o arquivo de
configuração e incluir automaticamente esta fonte:

```json
{
  "id": "dex-ai",
  "repository": "https://github.com/gdesordi/dex-ai",
  "ref": "main",
  "path": "skills",
  "enabled": true
}
```

A inicialização deve ocorrer por pasta em workspaces multi-root. Ela não deve
iniciar download ou composição automaticamente e não deve modificar um
`.dex/sync.json` preexistente, ainda que esse arquivo não contenha a fonte Dex.
Assim, uma fonte removida intencionalmente não deve reaparecer em ativações
posteriores.

Enquanto o workspace não for confiável, a extensão não deve escrever a
configuração. Deve representar a fonte Dex padrão somente em memória na Tree
View e aguardar o evento de concessão de confiança. Quando o usuário conceder
confiança, deve realizar a inicialização automaticamente se o arquivo continuar
ausente.

### RF-03 — Leitura e atualização da configuração

A extensão deve observar criação, alteração e remoção de `.dex/sync.json` e
atualizar a Tree View. A ação de adicionar fonte deve criar `.dex/` e o arquivo
quando necessário. As ações de adicionar, ativar, desativar ou remover devem
editar apenas a configuração da pasta correspondente e preservar campos
desconhecidos.

### RF-04 — Tree View

A extensão deve contribuir uma Tree View de fontes de skills. Cada pasta de
workspace deve agrupar suas próprias fontes quando houver mais de uma pasta
aberta. Para cada fonte, a visualização deve apresentar, quando conhecidos:

- identificador e repositório;
- `ref` e `path` configurados;
- estado habilitado ou desabilitado;
- estado de sincronização;
- quantidade de skills válidas disponíveis localmente;
- versão ou commit sincronizado e atualização disponível, quando essas
  informações puderem ser determinadas.

Os estados mínimos devem ser: não sincronizada, sincronizando, sincronizada,
desabilitada, conflito e erro.

### RF-05 — Ações de gerenciamento

A Tree View e a paleta de comandos devem oferecer:

- adicionar fonte;
- incluir fonte Dex padrão;
- sincronizar uma fonte;
- sincronizar todas as fontes habilitadas;
- ativar ou desativar uma fonte;
- remover uma fonte da configuração;
- abrir o repositório no navegador;
- abrir `.dex/sync.json`;
- consultar detalhes do último erro ou conflito.

Remover uma fonte deve retirá-la imediatamente da configuração e, em seguida,
perguntar se o usuário também deseja apagar sua cópia local. A opção padrão deve
preservar essa cópia. A extensão somente deve apagar o cache após confirmação
explícita. Independentemente da escolha, a remoção das skills dessa fonte de
`.agents/skills` deve ocorrer apenas na próxima composição explícita.

O comando `dex.addDefaultSource` deve incluir a fonte definida em RF-02 no
`.dex/sync.json` da pasta selecionada. Se o arquivo não existir, o comando deve
criá-lo com `version: 1`. Em workspace multi-root, quando o comando não for
acionado sobre um item associado a uma pasta, deve solicitar a pasta de destino.

O comando deve ser idempotente: se já existir uma fonte com `id: "dex-ai"` e
todos os valores padrão, deve informar que ela já está configurada sem alterar o
arquivo. Se o mesmo `id` estiver associado a valores diferentes, não deve
sobrescrevê-lo e deve informar o conflito. Se a mesma combinação de
`repository`, `ref` e `path` já estiver configurada sob outro identificador, não
deve criar uma duplicata e deve informar qual fonte já representa o catálogo.

### RF-06 — Download por fonte

A sincronização deve consultar a árvore da referência configurada e baixar
somente arquivos contidos em `path`. O caminho relativo dentro do catálogo deve
ser preservado. Uma fonte não deve ser considerada sincronizada se a referência
ou pasta não existir, a listagem for truncada ou nenhum arquivo de skill válido
for encontrado.

### RF-07 — Validação das skills

Cada diretório de primeiro nível do catálogo que representar uma skill deve
conter `SKILL.md`. O arquivo deve possuir frontmatter YAML com `name` e
`description`, e `name` deve corresponder ao nome do diretório. Conteúdo auxiliar
da skill pode ser preservado. Arquivos de catálogo reconhecidos, como
`dex.json` e `changelog.md`, podem ser armazenados como metadados da fonte, mas
não devem ser instalados como skills.

Uma skill inválida deve tornar a sincronização da fonte malsucedida e manter a
última cópia válida disponível.

### RF-08 — Armazenamento isolado

O conteúdo baixado deve ser armazenado fora do workspace, separado por pasta de
workspace e `source.id`, sob `context.globalStorageUri`. Cada fonte deve possuir
uma cópia válida ativa e uma área temporária de download. Metadados locais devem
registrar ao menos a origem, referência solicitada, commit resolvido, instante
da última sincronização, resultado e quantidade de skills.

Estado local e metadados transitórios não devem ser gravados em
`.dex/sync.json`.

### RF-09 — Sincronização transacional

O download de cada fonte deve ocorrer em uma área temporária. A cópia ativa da
fonte somente deve ser substituída após download e validação completos. Erro ou
cancelamento deve remover a área temporária e preservar a última cópia válida.

Na sincronização de todas as fontes, uma falha não deve impedir a tentativa das
demais. Quando toda fonte habilitada possuir alguma cópia local válida, a
composição pode prosseguir usando a última cópia válida da fonte cuja atualização
falhou. Essa fonte deve ficar marcada como desatualizada com erro, e o resumo
deve informar que o workspace foi composto com versões provenientes de
sincronizações diferentes.

Se qualquer fonte habilitada nunca tiver sido sincronizada com sucesso, ou se o
conjunto final contiver conflitos, a composição não deve ser substituída. As
cópias válidas obtidas pelas demais fontes podem ser preservadas para uma
tentativa futura.

### RF-10 — Composição do workspace

A extensão deve compor as skills válidas de todas as fontes habilitadas em uma
área temporária e substituir `.agents/skills` somente após concluir a
composição. Arquivos existentes dentro de diretórios de skills gerenciadas pela
Dex podem ser atualizados ou removidos para refletir o estado desejado.

A extensão não deve apagar conteúdo de `.agents/skills` cuja propriedade não
possa atribuir com segurança a uma fonte gerenciada. Para distinguir esse
conteúdo, deve manter um manifesto local de composição com a relação entre cada
skill instalada, sua fonte e seus arquivos.

Na primeira composição após a migração do fluxo anterior, quando ainda não
existir o manifesto de composição, a extensão deve comparar os arquivos
presentes em `.agents/skills` com a cópia legada disponível em
`context.globalStorageUri/skills`. Somente arquivos idênticos byte a byte aos da
cópia legada devem ser assumidos como gerenciados pela fonte `dex-ai`. Arquivos
ausentes, adicionais ou modificados devem permanecer não gerenciados. Ao
concluir essa composição, a extensão deve gravar o novo manifesto e não deve
repetir a inferência nas composições seguintes.

### RF-11 — Colisões

O nome de uma skill é sua identidade para composição. Se duas fontes habilitadas
oferecerem o mesmo nome de skill, a extensão deve:

- rejeitar a nova composição;
- preservar a composição válida anterior;
- marcar as fontes envolvidas com estado de conflito;
- informar o nome da skill e todas as fontes envolvidas;
- orientar o usuário a desativar ou remover uma das fontes.

O MVP não deve escolher vencedora com base na ordem do arquivo.

### RF-12 — Verificação de atualização

A extensão deve resolver a `ref` remota para um commit e compará-la com o commit
registrado na última sincronização. A verificação manual deve indicar se existe
atualização sem alterar arquivos. Para fontes cujo catálogo possua `dex.json`
válido, a versão SemVer pode ser exibida como informação adicional, mas não deve
substituir o commit como identidade do conteúdo sincronizado.

### RF-13 — Compatibilidade dos comandos atuais

Os comandos existentes devem permanecer utilizáveis:

- `dex.configureSkills` deve criar a configuração com a fonte padrão somente se
  `.dex/sync.json` ainda não existir, sincronizar as fontes habilitadas e compor
  o workspace;
- `dex.downloadSkills` deve sincronizar todas as fontes habilitadas;
- `dex.addSkillsToWorkspace` deve compor o conteúdo já baixado;
- `dex.checkSkillsUpdates` deve verificar todas as fontes habilitadas;
- `dex.openSkillsFolder` deve abrir a raiz do armazenamento das fontes.

O novo comando `dex.addDefaultSource` deve permanecer disponível na paleta de
comandos e como ação global da Tree View.

Textos e documentação devem deixar de pressupor que existe apenas o catálogo
Dex.

## Regras de negócio

- RN-01: `source.id` deve ser único dentro de cada `.dex/sync.json`.
- RN-02: somente fontes habilitadas participam da sincronização em lote e da
  composição.
- RN-03: desabilitar uma fonte deve retirar suas skills na próxima composição,
  sem apagar sua cópia válida armazenada.
- RN-04: a ordem de `sources` não define prioridade.
- RN-05: caminhos do repositório devem ser normalizados como caminhos POSIX,
  permanecer relativos e não podem conter segmentos vazios, `.` ou `..`.
- RN-06: nomes e caminhos vindos da API remota não podem escapar das áreas de
  download, armazenamento ou composição.
- RN-07: a mesma origem pode aparecer com referências ou caminhos diferentes
  desde que use identificadores distintos e não produza colisões.
- RN-08: alterações no arquivo de configuração não devem iniciar download ou
  composição automaticamente no MVP.
- RN-09: a criação automática da configuração deve acontecer somente quando
  `.dex/sync.json` estiver ausente; a extensão não deve usar apenas a ausência de
  `dex-ai` como sinal para recriá-la.
- RN-10: a definição da fonte Dex padrão deve possuir uma única representação
  interna reutilizada pela inicialização e pelo comando
  `dex.addDefaultSource`.
- RN-11: nenhuma criação automática de `.dex/sync.json` deve ocorrer enquanto o
  workspace estiver em Restricted Mode.
- RN-12: uma fonte com falha na atualização somente pode participar da
  composição por meio de sua cópia anterior se essa cópia tiver sido concluída
  e validada com sucesso.
- RN-13: a ausência do manifesto de composição autoriza a inferência de
  propriedade legada uma única vez; não autoriza assumir como gerenciado todo o
  conteúdo existente em `.agents/skills`.

## Tratamento de erros

- Configuração JSON inválida deve ser indicada na Tree View e em mensagem com o
  caminho do arquivo, sem substituir cópias locais ou o workspace.
- O comando `dex.addDefaultSource` não deve substituir nem tentar corrigir
  silenciosamente uma configuração inválida ou de versão não suportada.
- Versão de configuração não suportada deve interromper ações daquela pasta e
  informar as versões aceitas.
- Campos ausentes ou inválidos devem identificar a fonte e o campo afetado.
- Falhas HTTP devem informar fonte, operação e código de resposta, evitando
  expor dados sensíveis.
- Limite da API do GitHub deve produzir orientação clara e não ser confundido
  com catálogo vazio.
- Referência ou pasta inexistente, árvore truncada, catálogo vazio e skill
  inválida devem ser erros distintos.
- Cancelamento deve preservar todas as cópias válidas anteriores.
- A sincronização em lote deve apresentar um resumo por fonte com sucessos,
  falhas, conflitos e fontes ignoradas por estarem desabilitadas.
- Quando a composição usar uma cópia anterior por falha de atualização, a
  mensagem não deve apresentar a fonte como atualizada e deve identificar o
  commit efetivamente utilizado.
- Falha ao comparar ou migrar a instalação legada deve preservar
  `.agents/skills` e não deve atribuir propriedade aos arquivos duvidosos.
- Falha ao apagar o cache de uma fonte removida não deve restaurar a fonte na
  configuração; deve ser reportada separadamente e manter o cache intacto quando
  possível.
- Detalhes técnicos devem ser registrados no canal de saída `Dex`.

## Critérios de aceitação

- CA-01: ao criar uma configuração com duas fontes públicas válidas e sem
  colisões, a Tree View lista ambas e a sincronização instala as skills das duas
  em `.agents/skills`.
- CA-02: uma fonte sem `path` usa `skills`, e uma fonte sem `enabled` é tratada
  como habilitada.
- CA-03: cada fonte é armazenada isoladamente e pode ser sincronizada sem
  substituir a cópia das demais.
- CA-04: erro ou cancelamento durante um download preserva a última cópia válida
  da fonte e a composição anterior do workspace.
- CA-05: duas fontes com uma skill de mesmo nome impedem a composição, exibem
  todas as origens em conflito e não escolhem uma vencedora implicitamente.
- CA-06: desabilitar uma fonte e executar a composição remove apenas os arquivos
  anteriormente atribuídos a ela e preserva conteúdo não gerenciado.
- CA-07: uma configuração inválida aparece como erro sem iniciar operações de
  rede ou modificar `.agents/skills`.
- CA-08: caminhos absolutos ou contendo `..` são rejeitados antes da gravação de
  qualquer arquivo remoto.
- CA-09: em workspace com múltiplas pastas, fontes, estado e composição de uma
  pasta não interferem nas demais.
- CA-10: na primeira ativação em uma pasta confiável sem `.dex/sync.json`, a
  extensão cria automaticamente uma configuração `version: 1` contendo a fonte
  Dex padrão, sem iniciar download ou composição.
- CA-11: adicionar, ativar, desativar e remover fontes pela Tree View atualiza o
  arquivo correto e preserva campos desconhecidos.
- CA-12: a verificação manual compara o commit remoto com o commit sincronizado
  e apresenta o estado de cada fonte sem baixar o catálogo.
- CA-13: uma sincronização em lote tenta todas as fontes habilitadas e apresenta
  um resumo individual, mesmo quando uma delas falha.
- CA-14: os comandos atuais continuam registrados e passam a operar sobre o
  conjunto de fontes conforme definido nesta especificação.
- CA-15: todos os novos títulos de comandos e views usam chaves de localização
  presentes em `package.nls.json` e `package.nls.pt-br.json`.
- CA-16: após remover `dex-ai`, reativar a extensão não recria a fonte enquanto
  o arquivo de configuração continuar existindo.
- CA-17: executar `dex.addDefaultSource` após a remoção inclui novamente a fonte
  Dex padrão na pasta selecionada e preserva as demais fontes e campos
  desconhecidos.
- CA-18: executar `dex.addDefaultSource` quando a fonte padrão ou o mesmo
  catálogo já estiver configurado não cria duplicata; um `id` conflitante não é
  sobrescrito.
- CA-19: em workspace multi-root, a inicialização cria configurações
  independentes nas pastas que ainda não as possuem, e o comando solicita a
  pasta de destino quando necessário.
- CA-20: em Restricted Mode, a fonte Dex padrão aparece em memória na Tree View,
  nenhum arquivo é criado e a inicialização ocorre automaticamente após a
  concessão de confiança, caso `.dex/sync.json` continue ausente.
- CA-21: na primeira composição de uma instalação legada, somente arquivos
  idênticos aos da cópia legada são assumidos como gerenciados; arquivos
  adicionais ou modificados são preservados como não gerenciados.
- CA-22: quando uma atualização falha e todas as fontes habilitadas possuem
  cópias válidas, a composição usa a cópia anterior da fonte afetada, identifica
  o commit utilizado e sinaliza o estado misto; uma fonte sem cópia válida
  impede a substituição da composição.
- CA-23: remover uma fonte a exclui imediatamente da configuração e preserva seu
  cache por padrão; o cache somente é apagado após confirmação, e suas skills
  permanecem no workspace até a próxima composição explícita.

## Testes esperados

### Testes unitários

- Parse, defaults e validação do schema de `.dex/sync.json`.
- Normalização e validação de IDs, URLs, referências e caminhos.
- Preservação de campos desconhecidos ao editar a configuração.
- Idempotência e detecção de conflitos ao incluir a fonte Dex padrão.
- Detecção de colisões e geração do manifesto de composição.
- Decisão de composição diante de cópia válida anterior, fonte sem cópia e
  conflito.
- Classificação de arquivos legados idênticos, modificados, adicionais e
  ausentes.
- Comparação entre commits local e remoto.
- Validação da estrutura e do frontmatter de `SKILL.md`.

### Testes de integração

- Download bem-sucedido, erro HTTP, rate limit, referência inexistente, árvore
  truncada, catálogo vazio e cancelamento.
- Troca atômica da cópia de uma fonte e da composição do workspace.
- Falha parcial na sincronização de múltiplas fontes.
- Preservação de arquivos não gerenciados em `.agents/skills`.
- Isolamento entre pastas de um workspace multi-root.
- Criação automática da configuração com a fonte Dex padrão na primeira
  ativação, sem sincronização implícita.
- Inicialização adiada em Restricted Mode e retomada após concessão de
  confiança.
- Recriação manual da fonte padrão, preservação das demais fontes e tratamento
  de configuração inválida.
- Migração da instalação legada e geração do primeiro manifesto de composição.
- Composição com a última cópia válida após falha parcial e bloqueio quando uma
  fonte nunca tiver sido sincronizada.
- Remoção de fonte com preservação ou limpeza confirmada do cache.

### Verificação da extensão

- Renderização e atualização da Tree View após alterações no arquivo.
- Disponibilidade e contexto correto das ações por item e ações globais.
- Localização em inglês e português do Brasil.
- Execução de `npm run compile` e `npm run check` em `extension/dex/` durante a
  implementação.

## Decisões técnicas

- A abstração central deve ser chamada de fonte (`source`), mesmo que o único
  tipo suportado inicialmente seja repositório público do GitHub.
- A lógica atualmente concentrada em `extension/dex/src/extension.ts` deve ser
  separada em responsabilidades de configuração, provedor GitHub, armazenamento,
  validação, composição e Tree View antes de incorporar múltiplas fontes.
- O commit resolvido deve ser a identidade técnica da sincronização; o manifesto
  `dex.json` de uma fonte é opcional.
- Downloads e composições devem usar diretórios temporários e substituição
  atômica sempre que o sistema de arquivos permitir.
- A extensão deve usar `vscode.workspace.fs` para manter compatibilidade com os
  sistemas de arquivos suportados pelo VS Code.
- A contribuição da Tree View, comandos e menus deve ser registrada em
  `extension/dex/package.json`, com textos localizados nos dois arquivos NLS.
- Mudanças de comportamento devem ser documentadas em `extension/dex/README.md`,
  `extension/dex/README.dev.md` e `extension/dex/CHANGELOG.md`.
