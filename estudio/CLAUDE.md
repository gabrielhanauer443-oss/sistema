# Estúdio de campanhas do Gabriel

Esta pasta (no Google Drive do Gabriel, sincronizada no PC dele) é onde ele prepara artes de promoção para as duas lojas:

- **Hanauer Bebidas e Importados** (`marcas/hanauer/`): loja de bebidas.
- **South Import's** (`marcas/south/`, Instagram @southimports_sl): loja de iPhone e Apple.

## Como ele pede

Ele fala algo como "acessa a pasta `campanhas/2026-11-27 black-friday-bebidas`". Nesse caso:

1. Ler `briefing.yaml` da pasta e o `marca.yaml` da marca indicada.
2. Olhar as fotos em `fotos/` e descrever em 1 linha cada uma (produto, estado da foto) para conferir com ele.
3. Se faltar preço, produto ou foto, perguntar de uma vez só, numa lista curta. Nunca inventar preço, estoque ou prazo.
4. Gerar (tudo sai em `<pasta>/saida/`, em feed 1080x1350 e story 1080x1920):
   - `python ferramentas/gerar_encarte.py "<pasta>"`: **um encarte com todos os produtos** (é o que ele mais usa).
   - `python ferramentas/gerar_destaque.py "<pasta>"`: arte exclusiva de um produto/linha (seção `destaque:` do briefing).
   - `python ferramentas/gerar_artes.py "<pasta>"`: uma arte por produto.
   - `tema: gelo` no briefing = fundo cor gelo com azul da marca (o preferido dele para a Hanauer).
5. Abrir 1 ou 2 artes geradas e conferir: texto cortado, foto pequena demais, preço errado. Corrigir antes de entregar.
6. Escrever a legenda do post e do story em `<pasta>/legenda.txt`.

Campanha nova: copiar `campanhas/_modelo/` para `campanhas/AAAA-MM-DD nome/`.

## O que ele gosta

- Edição simples, direta e natural, feita para vender. Nada mirabolante.
- Respostas curtas e em português, porque ele muitas vezes está no celular.
- Preço grande e legível; o produto é o centro da arte.
- Hanauer: ele prefere o tema **gelo** (fundo claro azulado, logo e textos em azul-marinho), da 1ª página do projeto de identidade.
- Ele passa os preços falando, em sequência; ir montando e perguntar só o que faltar. Produto sem preço fica fora (`fora: true`), não inventar.
- Quando aparecer outra pessoa em foto ou vídeo, perguntar se deve borrar o rosto (ele costuma pedir para borrar clientes e fornecedores).

## Regras fixas

- **Bebida alcoólica**: toda arte e legenda da Hanauer leva "Beba com moderação" e "Venda proibida para menores de 18 anos". Não usar pessoas que pareçam menores, nem associar bebida a direção, esporte ou sucesso. Os avisos já estão em `marcas/hanauer/marca.yaml`: não remover.
- Não misturar as marcas: cores, logo e tom da South não vão em arte da Hanauer, e vice-versa.
- Item marcado `[CONFIRMAR]` ainda não foi confirmado pelo Gabriel: perguntar antes de publicar.
- Não alterar fotos originais em `fotos/`; tudo gerado vai para `saida/`.

## Requisitos

Python 3 com `pip install pillow pyyaml pillow-heif`. As fontes (Anton e Montserrat, licença OFL) estão em `ferramentas/fontes/`.
