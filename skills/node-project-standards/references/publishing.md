# Publicação

## Contrato do fluxo

**MUST:** configurar o processo para o destino efetivo: registry npm, imagem,
release de arquivos ou outro mecanismo já adotado. Preservar `private: true`
quando aplicável. Não habilitar publicação npm de aplicações privadas por
conveniência e não inventar credenciais ou destinos.

Implementar estas etapas, interrompendo em qualquer falha com saída diferente
de zero e sem usar condições que ignorem gates anteriores:

1. Validar repositório, commit e árvore limpa, incluindo arquivos não rastreados.
   No CI, validar o checkout do commit/tag entregue; artefatos gerados após a
   validação inicial podem existir sem autorizar alterações em fontes.
2. Validar versão, changelog e tag conforme [versionamento](versioning.md).
   Antes de criar uma tag autorizada, conferir inexistência local e remota;
   ao publicar a partir de tag existente, conferir seu commit e conteúdo.
3. Confirmar que a versão ainda não existe no destino. Falhar em erros de
   consulta e não sobrescrever artefatos. Revalidar imediatamente antes da
   escrita e utilizar a proteção de unicidade do destino ou coordenação
   equivalente para evitar corrida entre publicadores.
4. Instalar dependências a partir do lockfile, com o Node e gerenciador definidos.
5. Executar `check`: formatação, lint, tipos, testes, cobertura,
   vulnerabilidades conforme política e build.
6. Preparar o artefato e verificar seu conteúdo e uso básico. Para pacote npm,
   inspecionar o tarball gerado por `npm pack`, incluindo exports, tipos,
   arquivos distribuídos e ausência de segredos. Usar equivalente para imagens
   ou outros destinos. Registrar hash ou digest.
7. Publicar somente o artefato validado, sem recompilar com outras entradas.
   Se houver jobs separados, transferir o artefato por mecanismo íntegro e
   conferir hash/digest antes da publicação.

**MUST:** gates precisam ocorrer antes da primeira ação de publicação. Em
destinos múltiplos não há atomicidade implícita: documentar ordem, falhas
parciais e recuperação. Não repetir escritas ou desfazer tags automaticamente.

## Script `publish` e lifecycle npm

**MUST:** oferecer o comando `publish` aplicável, preferencialmente delegando
ao orquestrador de release existente. Documentar claramente como invocá-lo
(por exemplo, `npm run publish`) e diferenciar esse comando de `npm publish`.

O npm também trata `scripts.publish` como lifecycle da publicação. Não criar
`"publish": "npm publish"` nem fluxo indireto que volte a chamar a si mesmo.
Inspecionar `prepublishOnly`, `prepack`, `prepare`, `publish` e `postpublish`
antes de integrar o comando.

Para npm, uma implementação possível é o comando orquestrador validar os gates,
gerar e testar o tarball e publicar esse arquivo com lifecycle desabilitado na
etapa final, após realizar explicitamente toda preparação necessária. Verificar
esse comportamento na documentação da versão npm utilizada. Não usar
`--ignore-scripts` como atalho para ignorar verificações ou preparação.

Garantir também que a invocação direta suportada pelo projeto não publique
antes dos gates: restringir a credencial de escrita ao workflow validado ou
implementar uma proteção anterior à publicação. Um hook `publish`, executado
depois do envio, não serve como gate. Projetos que entregam por CI podem ter
`publish` delegando ao fluxo autorizado ou exibindo instruções e encerrando
com falha para publicação local não suportada, sem simular entrega bem-sucedida.

## Validação sem publicação

**MUST:** testar pré-condições com fixtures ou destino simulado: Git sujo,
versão inválida, changelog/tag divergentes, versão já existente, consulta
indisponível e gate reprovado devem impedir a etapa de escrita. Testar a rota
válida com publicador simulado e conferir que recebe o mesmo artefato validado.
Verificar ausência de recursão entre scripts e lifecycle. Não executar push,
release, deploy ou publicação real como teste da padronização.
