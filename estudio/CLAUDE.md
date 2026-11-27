# Estúdio de campanhas do Gabriel

Esta pasta (no Google Drive do Gabriel, sincronizada no PC dele) é onde ele prepara artes de promoção para as duas lojas:

- **Hanauer Bebidas e Importados** (`marcas/hanauer/`): loja de bebidas.
- **South Import's** (`marcas/south/`, Instagram @southimports_sl): loja de iPhone e Apple.

## Como ele pede

Ele fala algo como "acessa a pasta `campanhas/2026-11-27 black-friday-bebidas`". Nesse caso:

1. Ler `briefing.yaml` da pasta e o `marca.yaml` da marca indicada.
2. Olhar as fotos em `fotos/` e descrever em 1 linha cada uma (produto, estado da foto) para conferir com ele.
3. Se faltar preço, produto ou foto, perguntar de uma vez só, numa lista curta. Nunca inventar preço, estoque ou prazo.
4. Se o briefing tiver `recorte: true`, antes rodar `python ferramentas/recortar.py "<pasta>"`: tira o fundo de cada foto e salva as garrafas em `<pasta>/recortes/`. Conferir os recortes (sobra de fundo, pedaço cortado).
5. Gerar (tudo sai em `<pasta>/saida/`, em feed 1080x1350 e story 1080x1920):
   - `python ferramentas/gerar_encarte.py "<pasta>"`: **um encarte com todos os produtos** (é o que ele mais usa).
   - `python ferramentas/gerar_destaque.py "<pasta>"`: arte exclusiva de um produto/linha (seção `destaque:` do briefing).
   - `python ferramentas/gerar_artes.py "<pasta>"`: uma arte por produto.
   - `python ferramentas/gerar_story_foto.py "<pasta>"`: story editado em cima de UMA foto real (seção `story_foto:`). Ele prefere foto real da loja a montagem com imagem genérica. `estilo: elegante` = serifa fina (Cormorant) + Inter com letras espaçadas e linhas douradas: ele achou Anton/Montserrat "muito IA" e quer subir o padrão (elegante, premium).
   - `tema: gelo` = fundo claro com relevo (promo do dia a dia); `tema: black` = fundo preto (Black Friday).
6. Abrir 1 ou 2 artes geradas e conferir: texto cortado, foto pequena demais, preço errado. Corrigir antes de entregar.
7. Escrever a legenda do post e do story em `<pasta>/legenda.txt`.

Campanha nova: copiar `campanhas/_modelo/` para `campanhas/AAAA-MM-DD nome/`.

## O que ele gosta

- Edição simples, direta e natural, feita para vender. Nada mirabolante.
- Respostas curtas e em português, porque ele muitas vezes está no celular.
- Preço grande e legível; o produto é o centro da arte.
- Hanauer: ele prefere o tema **gelo** com **garrafas recortadas** (sem o fundo da foto) sobre fundo cor gelo com o "H" e o nome HANAUER repetidos em relevo bem suave, quase transparente (força em `marcas/hanauer/marca.yaml`, `relevo.forca`). Preço em pílula azul. Visual "imersivo", não cartão com foto.
- **Black Friday** (e campanhas "black"): `tema: black` = fundo preto com o relevo da marca escuro, brilho azul atrás das garrafas e preço em pílula creme. Ele achou a versão clara sem cara de Black Friday ("mais black mesmo").
- Ele passa os preços falando, em sequência; ir montando e perguntar só o que faltar. Produto sem preço fica fora (`fora: true`), não inventar.
- Quando aparecer outra pessoa em foto ou vídeo, perguntar se deve borrar o rosto (ele costuma pedir para borrar clientes e fornecedores). O próprio Gabriel aparece em fotos da South: o rosto dele fica visível.

## Regras fixas

- **Bebida alcoólica**: toda arte e legenda da Hanauer leva "Beba com moderação" e "Venda proibida para menores de 18 anos". Não usar pessoas que pareçam menores, nem associar bebida a direção, esporte ou sucesso. Os avisos já estão em `marcas/hanauer/marca.yaml`: não remover.
- Não misturar as marcas: cores, logo e tom da South não vão em arte da Hanauer, e vice-versa.
- Item marcado `[CONFIRMAR]` ainda não foi confirmado pelo Gabriel: perguntar antes de publicar.
- Não alterar fotos originais em `fotos/`; tudo gerado vai para `saida/`.

## Requisitos

Python 3 com `pip install pillow pyyaml pillow-heif "rembg[cpu]"` (rembg faz o recorte; baixa um modelo de ~180 MB na 1ª vez). As fontes (Anton e Montserrat, licença OFL) estão em `ferramentas/fontes/`.
