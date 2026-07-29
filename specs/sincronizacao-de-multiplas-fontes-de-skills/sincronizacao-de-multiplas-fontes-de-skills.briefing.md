# Sincronização de múltiplas fontes de skills

Hoje essa extensão baixa as skills desse mesmo repositório, e isso funciona
super bem. Mas estou tendo necessidade de baixar skills de diversas fontes.
Pensei em criar um arquivo de configuração `.dex/sync.json` e salvar nesse
arquivo uma lista de repositórios de skills que eu quero manter sincronizada com
o meu projeto. Aí eu criaria na extensão uma tree view listando esses
repositórios, para ficar mais fácil de gerenciar.

Criar uma especificação com tudo o que foi sugerido na discussão:

- tratar o arquivo como declaração do estado desejado e a Tree View como a
  interface para gerenciar e executar esse estado;
- modelar entradas como `sources`, com identificador, repositório, referência,
  caminho e estado de ativação;
- exibir fontes, estado da sincronização e quantidade de skills na Tree View;
- oferecer ações por fonte e ações globais;
- rejeitar colisões de nomes no primeiro momento;
- separar o armazenamento interno por fonte e compor `.agents/skills`;
- manter identificadores estáveis, referências explícitas, validação de skills,
  proteção contra caminhos inseguros e atualizações transacionais;
- não armazenar credenciais no arquivo de configuração;
- preservar o comportamento atual por meio de uma fonte Dex padrão;
- limitar o MVP a repositórios públicos do GitHub, sincronização manual, uma
  pasta de skills por fonte e detecção rígida de conflitos.
