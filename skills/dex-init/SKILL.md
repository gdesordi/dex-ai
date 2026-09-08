---
name: dex-init
description: Inicializa ou padroniza a documentação básica de um projeto, garantindo AGENTS.md, README.md e CHANGELOG.md na raiz.
---

# Dex Init

Use esta skill quando for necessário preparar a documentação inicial de um
projeto ou estabelecer as regras permanentes para ela.

## Arquivos obrigatórios

Na raiz do projeto, garanta a existência de `AGENTS.md`, `README.md` e
`CHANGELOG.md`. Antes de criar qualquer um deles, verifique se já existe:
preserve o conteúdo existente e complemente-o somente quando necessário.

- Em `AGENTS.md`, inclua instruções para manter os arquivos `README.md` e
  `CHANGELOG.md` na raiz atualizados quando mudanças do projeto afetarem sua
  documentação ou histórico.
- Em `README.md`, registre informações voltadas a quem usa ou contribui com o
  projeto. Não invente comandos, requisitos ou funcionalidades: use o contexto
  e os arquivos disponíveis no repositório.
- Em `CHANGELOG.md`, use o padrão Keep a Changelog, com a seção
  `## [Não publicado]` e categorias como `Adicionado`, `Modificado`,
  `Corrigido`, `Removido` e `Segurança`, quando aplicáveis.

## Datas do changelog

As versões publicadas devem usar exclusivamente o formato mensal `YYYY-MM`:

```md
## [1.0.0] - 2026-09
```

Não use dia nas datas (`YYYY-MM-DD`). Ao ajustar um changelog existente, não
reescreva seu histórico sem que isso seja solicitado; aplique esse formato às
novas entradas e às que forem editadas no trabalho atual.

## Criação segura

Quando um arquivo obrigatório não existir, crie uma versão inicial mínima e
útil. Não sobrescreva arquivos existentes, não crie commits, tags, releases ou
publicações sem solicitação explícita e registre no changelog as mudanças
relevantes feitas no projeto.
