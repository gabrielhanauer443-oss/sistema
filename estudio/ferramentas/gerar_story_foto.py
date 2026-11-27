#!/usr/bin/env python3
"""Story (1080x1920) editado em cima de UMA foto real: a foto vira o fundo, com a marca por cima.

Uso:
    python ferramentas/gerar_story_foto.py "campanhas/<pasta>"

Lê a seção `story_foto:` do briefing.yaml:
    story_foto:
      foto: IMG_9799.HEIC
      topo: 300                  # onde a foto começa (px); acima fica o fundo em relevo
      chapeu: "Black Friday"     # linha pequena acima da oferta
      oferta: "R$ 500 OFF"       # texto gigante
      produto: "iPhone 18 Pro Max"
      detalhe: "256 GB"
      chamada: "Confira as cores no direct"
      borrar:                    # áreas da FOTO a borrar (fração 0-1: x0, y0, x1, y1), ex.: rosto de terceiros
        - [0.30, 0.00, 0.72, 0.30]
Sai em <pasta>/saida/story-foto.jpg.
"""
import sys
from pathlib import Path

import numpy as np
import yaml
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gerar_artes import RAIZ, aplicar_tema, caber, cor, fonte, quebrar  # noqa: E402
from gerar_encarte import fundo_marca  # noqa: E402

W, H = 1080, 1920


def tratar_foto(foto, borrar):
    foto = ImageOps.exif_transpose(foto).convert("RGB")
    # borra áreas pedidas (com borda suave)
    for x0, y0, x1, y1 in borrar or []:
        fw, fh = foto.size
        caixa = (int(x0 * fw), int(y0 * fh), int(x1 * fw), int(y1 * fh))
        borrada = foto.filter(ImageFilter.GaussianBlur(fw * 0.03))
        masc = Image.new("L", foto.size, 0)
        ImageDraw.Draw(masc).ellipse(caixa, fill=255)
        masc = masc.filter(ImageFilter.GaussianBlur(fw * 0.02))
        foto = Image.composite(borrada, foto, masc)
    # tratamento "black": mais contraste, menos saturação, um pouco mais escura e quente
    foto = ImageEnhance.Contrast(foto).enhance(1.12)
    foto = ImageEnhance.Color(foto).enhance(0.9)
    foto = ImageEnhance.Brightness(foto).enhance(0.92)
    return foto


def gerar(marca, camp, pasta):
    s = camp["story_foto"]
    c = marca["cores"]
    arte = fundo_marca(marca, W, H)

    # foto ocupando a largura, derretendo no fundo em cima e embaixo
    foto = tratar_foto(Image.open(pasta / "fotos" / s["foto"]), s.get("borrar"))
    fh = int(foto.height * W / foto.width)
    foto = foto.resize((W, fh), Image.LANCZOS).convert("RGBA")
    topo = s.get("topo", 300)
    y = np.arange(fh)
    fade_cima = np.clip((y - 0) / 520, 0, 1) ** 1.4
    fade_baixo = np.clip((fh - y) / 420, 0, 1) ** 1.2
    alfa = (fade_cima * fade_baixo * 255).astype(np.uint8)
    masc = Image.fromarray(np.repeat(alfa[:, None], W, axis=1), "L")
    # vinheta lateral leve
    xs = np.linspace(-1, 1, W)
    lat = (1 - 0.35 * xs ** 4)
    masc = Image.fromarray((np.asarray(masc) * lat[None, :]).astype(np.uint8), "L")
    foto.putalpha(masc)
    arte.alpha_composite(foto, (0, topo))

    # escurece o topo e a base para o texto respirar
    grad = np.zeros((H, W), np.uint8)
    yy = np.arange(H)
    g = np.clip(1 - (yy - 0) / 900, 0, 1) ** 1.6 * 200 + np.clip((yy - 1300) / 620, 0, 1) ** 1.3 * 235
    grad[:] = np.clip(g, 0, 255)[:, None]
    preto = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    preto.putalpha(Image.fromarray(grad, "L"))
    arte.alpha_composite(preto)

    d = ImageDraw.Draw(arte)
    m = 70
    y0 = 150  # área segura do story

    logo = RAIZ / marca["logo"] if marca.get("logo") else None
    if logo and logo.exists():
        lg = Image.open(logo).convert("RGBA")
        lg.thumbnail((220, 110))
        arte.alpha_composite(lg, ((W - lg.width) // 2, y0))
        y0 += lg.height + 34

    if s.get("chapeu"):
        txt = " ".join(s["chapeu"].upper())
        f = fonte(34, "Bold")
        tw = d.textlength(txt, font=f)
        d.line((W / 2 - tw / 2 - 90, y0 + 18, W / 2 - tw / 2 - 24, y0 + 18), fill=cor(c["destaque"]), width=3)
        d.line((W / 2 + tw / 2 + 24, y0 + 18, W / 2 + tw / 2 + 90, y0 + 18), fill=cor(c["destaque"]), width=3)
        d.text((W / 2, y0), txt, font=f, fill=cor(c["destaque"]), anchor="mt")
        y0 += 56

    # oferta gigante em dourado com leve sombra
    f = caber(d, s["oferta"], "titulo", W - 2 * m, 230)
    sombra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).text((W / 2 + 4, y0 + 8), s["oferta"], font=f, fill=(0, 0, 0, 200), anchor="mt")
    arte.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(arte)
    d.text((W / 2, y0), s["oferta"], font=f, fill=cor(c["destaque"]), anchor="mt")
    y0 += f.size + 10
    if s.get("asterisco_nota"):
        d.text((W / 2, y0), s["asterisco_nota"], font=fonte(26, "SemiBold"), fill=cor(c["texto"]), anchor="mt")

    # base: produto, chamada, regras
    base = H - 230  # deixa espaço para figurinha de link
    regras = []
    for linha in camp.get("regras", []):
        regras += quebrar(d, linha, fonte(21, "Medium"), W - 2 * m)
    for linha in reversed(regras):
        d.text((W / 2, base), linha, font=fonte(21, "Medium"), fill=cor(c["texto_suave"]), anchor="mb")
        base -= 29
    base -= 22
    if s.get("chamada"):
        fc = fonte(32, "Bold")
        txt = s["chamada"].upper()
        tw = d.textlength(txt, font=fc)
        d.rounded_rectangle((W / 2 - tw / 2 - 34, base - 70, W / 2 + tw / 2 + 34, base), 35, fill=cor(c["destaque"]))
        d.text((W / 2, base - 35), txt, font=fc, fill=cor(c["texto_destaque"]), anchor="mm")
        base -= 96
    if s.get("detalhe"):
        d.text((W / 2, base), s["detalhe"], font=fonte(40, "SemiBold"), fill=cor(c["texto"]), anchor="mb")
        base -= 56
    if s.get("produto"):
        f = caber(d, s["produto"], "titulo", W - 2 * m, 120)
        d.text((W / 2, base), s["produto"], font=f, fill=cor(c["texto"]), anchor="mb")
    return arte.convert("RGB")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pasta = Path(sys.argv[1]).resolve()
    camp = yaml.safe_load((pasta / "briefing.yaml").read_text(encoding="utf-8"))
    marca = aplicar_tema(yaml.safe_load((RAIZ / "marcas" / camp["marca"] / "marca.yaml").read_text(encoding="utf-8")), camp)
    (pasta / "saida").mkdir(exist_ok=True)
    out = pasta / "saida" / "story-foto.jpg"
    gerar(marca, camp, pasta).save(out, quality=93)
    print("ok", out)


if __name__ == "__main__":
    main()
