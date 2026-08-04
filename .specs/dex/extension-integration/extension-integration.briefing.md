# extension-integration

Vamos fazer uma integração entre a especificação e o VSCode.

Na dex-spec-manage, Ao criar ou alterar um arquivo de questionário de especificação, mantenha sempre uma versão em json.
Na extensão, crie um comando para responder questionário. Esse comando vai procurar os questionários de especificação em json e pedir para o usuário escolher um via quickpick. Depois que o usuário escolhe, as questões são apresentadas para o usuário com quickpick. O usuário poderá escolher entre seguir a sugestão ou dar uma resposta diferente. AS respostas vão ser gravadas no json.
Seria bom o json ter alguma propriedade para controlar o status. Sugiro "pendente", "respondido parcialmente" e "respondido".
A skill spec-manage deve ser capax de ler as respostas no json e atualizar o .md quando solicitado.
