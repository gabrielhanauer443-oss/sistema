#!/usr/bin/env python3
"""Gera 5 versões do story sobre a mesma foto, cada uma com fonte e layout diferentes.

Uso:
    python ferramentas/story_variacoes.py "campanhas/<pasta>"

Usa a seção `story_foto:` do briefing (foto, produto, detalhe, chamada) e `regras:`.
Sai em <pasta>/saida/variacao-1-editorial.jpg ... variacao-5-natural.jpg + variacoes-lado-a-lado.jpg.

1 editorial  Playfair Display + Inter Tight  centralizado, oferta embaixo
2 apple      Inter Tight                     minimalista, alinhado à esquerda
3 revista    DM Serif Display + DM Sans      coluna à esquerda com fio dourado
4 moldura    Bodoni Moda + Jost              moldura fina dourada, "500" gigante
5 natural    Caveat (à mão) + Inter Tight    anotações escritas à mão sobre a foto
"""
import math
import sys
from pathlib import Path

import numpy as np
import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gerar_artes import RAIZ, aplicar_tema, cor, quebrar  # noqa: E402
from gerar_story_foto import H, W, texto_espacado, tratar_foto  # noqa: E402

FONTES = Path(__file__).resolve().parent / "fontes"
BRANCO = (246, 243, 236)
CINZA = (170, 165, 155)


def F(arq, tam, var=None):
    f = ImageFont.truetype(str(FONTES / arq), tam)
    if var:
        f.set_variation_by_name(var)
    return f


def base_foto(pasta, s, topo=0, escurecer_topo=150, inicio_base=1040, largura_base=540):
    arte = Image.new("RGBA", (W, H), (8, 8, 8, 255))
    foto = tratar_foto(Image.open(pasta / "fotos" / s["foto"]), s.get("borrar"))
    fh = int(foto.height * W / foto.width)
    foto = foto.resize((W, fh), Image.LANCZOS).convert("RGBA")
    yv = np.arange(fh)
    alfa = (np.clip((fh - yv) / 520, 0, 1) ** 1.3 * 255).astype(np.uint8)
    foto.putalpha(Image.fromarray(np.repeat(alfa[:, None], W, axis=1), "L"))
    arte.alpha_composite(foto, (0, topo))
    yy = np.arange(H)
    g = np.clip(1 - yy / 380, 0, 1) ** 1.6 * escurecer_topo + np.clip((yy - inicio_base) / largura_base, 0, 1) ** 1.25 * 248
    veu = Image.new("RGBA", (W, H), (5, 5, 5, 0))
    veu.putalpha(Image.fromarray(np.repeat(np.clip(g, 0, 255).astype(np.uint8)[:, None], W, axis=1), "L"))
    arte.alpha_composite(veu)
    return arte


def monograma(arte, marca, x, y, tam=56, anchor="mm"):
    p = RAIZ / "marcas" / "south" / "monograma.png"
    if not p.exists():
        return
    mg = Image.open(p).convert("RGBA")
    mg.thumbnail((tam, tam))
    if anchor == "mm":
        x, y = x - mg.width // 2, y - mg.height // 2
    arte.alpha_composite(mg, (int(x), int(y)))


def regras_rodape(d, camp, fonte_, x=None, base=H - 250, larg=W - 180, alinhar="centro"):
    linhas = []
    for r in camp.get("regras", []):
        linhas += quebrar(d, r, fonte_, larg)
    for linha in reversed(linhas):
        if alinhar == "centro":
            d.text((W / 2, base), linha, font=fonte_, fill=CINZA, anchor="mb")
        else:
            d.text((x, base), linha, font=fonte_, fill=CINZA, anchor="lb")
        base -= fonte_.size + 8
    return base


# 1 ---------------------------------------------------------------- editorial
def v_editorial(marca, camp, pasta, ouro):
    s = camp["story_foto"]
    # cores opcionais no briefing: cor_oferta (texto grande) e cor_botao (letreiro do botão)
    cor_of = cor(s["cor_oferta"]) if s.get("cor_oferta") else ouro
    arte = base_foto(pasta, s)
    d = ImageDraw.Draw(arte)
    texto_espacado(d, (W / 2, 150), "BLACK FRIDAY  —  SOUTH IMPORT'S", F("InterTight.ttf", 20, "Medium"), BRANCO, 6, "mm")
    base = regras_rodape(d, camp, F("InterTight.ttf", 18, "Light")) - 34
    fc = F("InterTight.ttf", 22, "Medium")
    txt = s["chamada"].upper()
    larg = sum(d.textlength(c, font=fc) for c in txt) + 4 * (len(txt) - 1)
    if s.get("cor_botao"):  # letreiro: pílula cheia na cor, texto creme
        d.rounded_rectangle((W / 2 - larg / 2 - 38, base - 70, W / 2 + larg / 2 + 38, base), 35, fill=cor(s["cor_botao"]))
        texto_espacado(d, (W / 2, base - 35), txt, fc, BRANCO, 4, "mm")
        base -= 120
    else:
        d.line((W / 2 - larg / 2, base, W / 2 + larg / 2, base), fill=cor_of, width=2)
        texto_espacado(d, (W / 2, base - 22), txt, fc, cor_of, 4, "mb")
        base -= 110
    d.text((W / 2, base), "R$ 500 off*", font=F("PlayfairDisplay.ttf", 170, "Regular"), fill=cor_of, anchor="ms", features=["lnum"])
    base -= 170
    d.text((W / 2, base), f"{s['produto']}, {s['detalhe']}", font=F("PlayfairDisplay-Italic.ttf", 58, "Italic"), fill=BRANCO, anchor="ms", features=["lnum"])
    return arte


# 2 ---------------------------------------------------------------- apple
def v_apple(marca, camp, pasta, ouro):
    s = camp["story_foto"]
    arte = base_foto(pasta, s, escurecer_topo=235)
    d = ImageDraw.Draw(arte)
    x = 80
    d.text((x, 140), "Black Friday.", font=F("InterTight.ttf", 76, "SemiBold"), fill=BRANCO, anchor="lt")
    d.text((x, 228), "Na South Import's.", font=F("InterTight.ttf", 76, "SemiBold"), fill=(176, 170, 160), anchor="lt")
    base = regras_rodape(d, camp, F("InterTight.ttf", 18, "Regular"), x=x, alinhar="esq", larg=W - 160) - 36
    d.text((x, base), s["chamada"] + "  ›", font=F("InterTight.ttf", 34, "Medium"), fill=ouro, anchor="lb")
    base -= 84
    d.text((x - 6, base), "R$ 500 off.", font=F("InterTight.ttf", 150, "Bold"), fill=BRANCO, anchor="ls")
    base -= 156
    d.text((x, base), f"{s['produto']} {s['detalhe']}.", font=F("InterTight.ttf", 46, "Medium"), fill=CINZA, anchor="ls")
    return arte


# 3 ---------------------------------------------------------------- revista
def v_revista(marca, camp, pasta, ouro):
    s = camp["story_foto"]
    arte = base_foto(pasta, s, escurecer_topo=120, inicio_base=980)
    d = ImageDraw.Draw(arte)
    monograma(arte, marca, W - 110, 150, 60)
    d.text((80, 150), "South Import's", font=F("DMSerifDisplay-Italic.ttf", 40), fill=BRANCO, anchor="lm")
    x = 110
    base = regras_rodape(d, camp, F("DMSans.ttf", 18, "Light"), x=x, alinhar="esq", larg=W - 190) - 40
    fim_fio = base + 4
    d.text((x, base), s["chamada"], font=F("DMSans.ttf", 32, "Medium"), fill=ouro, anchor="lb")
    base -= 74
    d.text((x, base), f"no {s['produto']} {s['detalhe']}", font=F("DMSans.ttf", 38, "Regular"), fill=BRANCO, anchor="lb")
    base -= 60
    d.text((x - 4, base), "R$ 500 off*", font=F("DMSerifDisplay.ttf", 168), fill=BRANCO, anchor="ls", features=["lnum"])
    base -= 176
    d.text((x, base), "Black Friday", font=F("DMSerifDisplay-Italic.ttf", 84), fill=ouro, anchor="ls")
    d.line((78, base - 70, 78, fim_fio), fill=ouro, width=3)
    return arte


# 4 ---------------------------------------------------------------- moldura
def v_moldura(marca, camp, pasta, ouro):
    s = camp["story_foto"]
    arte = base_foto(pasta, s, escurecer_topo=230, inicio_base=1060)
    d = ImageDraw.Draw(arte)
    i = 44
    d.rectangle((i, i + 60, W - i, H - i - 60), outline=ouro, width=2)
    texto_espacado(d, (W / 2, 170), "SOUTH IMPORT'S", F("Jost.ttf", 22, "Regular"), ouro, 10, "mm")
    d.text((W / 2, 230), "Black Friday", font=F("BodoniModa-Italic.ttf", 58, "Italic"), fill=BRANCO, anchor="mt")
    base = regras_rodape(d, camp, F("Jost.ttf", 18, "Light"), base=H - 270, larg=W - 220) - 30
    texto_espacado(d, (W / 2, base), s["chamada"].upper(), F("Jost.ttf", 22, "Regular"), ouro, 5, "mb")
    base -= 70
    texto_espacado(d, (W / 2, base), f"{s['produto']}  ·  {s['detalhe']}".upper(), F("Jost.ttf", 26, "Light"), BRANCO, 6, "mb")
    base -= 60
    f500 = F("BodoniModa.ttf", 300, "Regular")
    w5 = d.textlength("500", font=f500, features=["lnum"])
    d.text((W / 2, base), "500", font=f500, fill=BRANCO, anchor="ms", features=["lnum"])
    d.text((W / 2 - w5 / 2 - 14, base - 190), "R$", font=F("BodoniModa.ttf", 60, "Regular"), fill=ouro, anchor="rs")
    texto_espacado(d, (W / 2 + w5 / 2 + 60, base - 20), "OFF*", F("Jost.ttf", 34, "Medium"), ouro, 6, "ms")
    return arte


# 5 ---------------------------------------------------------------- natural
def v_natural(marca, camp, pasta, ouro):
    s = camp["story_foto"]
    arte = base_foto(pasta, s, escurecer_topo=90, inicio_base=1220, largura_base=500)
    d = ImageDraw.Draw(arte)
    # chamada escrita à mão, levemente inclinada, sobre a foto
    camada = Image.new("RGBA", (W, 420), (0, 0, 0, 0))
    dc = ImageDraw.Draw(camada)
    fh = F("Caveat.ttf", 190, "Bold")
    dc.text((W / 2 + 4, 216), "R$ 500 off!", font=fh, fill=(0, 0, 0, 170), anchor="ms")
    camada = camada.filter(ImageFilter.GaussianBlur(6))
    dc = ImageDraw.Draw(camada)
    dc.text((W / 2, 210), "R$ 500 off!", font=fh, fill=BRANCO, anchor="ms")
    # sublinhado "rabiscado" dourado
    pts = [(W / 2 - 330 + k * 22, 250 + 7 * math.sin(k * 0.9)) for k in range(31)]
    dc.line(pts, fill=ouro, width=9, joint="curve")
    camada = camada.rotate(5, resample=Image.BICUBIC, center=(W / 2, 210))
    arte.alpha_composite(camada, (0, 960))
    d = ImageDraw.Draw(arte)
    d.text((80, 150), "Black Friday na South", font=F("Caveat.ttf", 72, "Bold"), fill=BRANCO, anchor="lm")
    monograma(arte, marca, W - 100, 150, 56)
    # seta à mão apontando para as caixas
    seta = [(820, 1000), (860, 940), (880, 880), (875, 820)]
    d.line(seta, fill=ouro, width=7, joint="curve")
    d.line([(875, 820), (850, 850)], fill=ouro, width=7)
    d.line([(875, 820), (895, 856)], fill=ouro, width=7)
    base = regras_rodape(d, camp, F("InterTight.ttf", 18, "Light")) - 40
    d.text((W / 2, base), s["chamada"], font=F("Caveat.ttf", 58, "Bold"), fill=ouro, anchor="mb")
    base -= 78
    d.text((W / 2, base), f"{s['produto']} · {s['detalhe']}", font=F("InterTight.ttf", 44, "SemiBold"), fill=BRANCO, anchor="mb")
    return arte


VARIACOES = [("editorial", v_editorial), ("apple", v_apple), ("revista", v_revista),
             ("moldura", v_moldura), ("natural", v_natural)]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pasta = Path(sys.argv[1]).resolve()
    camp = yaml.safe_load((pasta / "briefing.yaml").read_text(encoding="utf-8"))
    marca = aplicar_tema(yaml.safe_load((RAIZ / "marcas" / camp["marca"] / "marca.yaml").read_text(encoding="utf-8")), camp)
    ouro = cor(marca["cores"]["destaque"])
    (pasta / "saida").mkdir(exist_ok=True)
    feitas = []
    for i, (nome, fn) in enumerate(VARIACOES, 1):
        arte = fn(marca, camp, pasta, ouro).convert("RGB")
        out = pasta / "saida" / f"variacao-{i}-{nome}.jpg"
        arte.save(out, quality=94)
        feitas.append(arte)
        print("ok", out)
    # folha de comparação
    t = 400
    folha = Image.new("RGB", (5 * t + 6 * 20, int(t * 16 / 9) + 40), (255, 255, 255))
    for i, a in enumerate(feitas):
        folha.paste(a.resize((t, int(t * 16 / 9))), (20 + i * (t + 20), 20))
    folha.save(pasta / "saida" / "variacoes-lado-a-lado.jpg", quality=90)


if __name__ == "__main__":
    main()
