"""Fundo cor gelo com a marca (monograma + nome) repetida em relevo bem suave."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent


def _cor(hex_):
    hex_ = hex_.lstrip("#")
    return tuple(int(hex_[i:i + 2], 16) for i in (0, 2, 4))


def fundo_relevo(w, h, base="#EEF3F9", base2="#DCE6F2", monograma=None, nome=None,
                 passo=260, forca=1.0, cor_luz=(255, 255, 255), cor_sombra=(35, 63, 110), cor_face=(35, 63, 110)):
    """Degradê gelo + padrão da marca em relevo (sombra embaixo/direita, luz em cima/esquerda)."""
    # degradê radial suave: centro mais claro
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w * 0.75)) ** 2 + ((yy - h * 0.45) / (h * 0.75)) ** 2).clip(0, 1)
    c1, c2 = np.array(_cor(base), float), np.array(_cor(base2), float)
    fundo = (c1 * (1 - r[..., None]) + c2 * r[..., None]).astype(np.uint8)
    arte = Image.fromarray(fundo, "RGB").convert("RGBA")

    # máscara do padrão: monograma e nome em fileiras alternadas (deslocadas)
    masc = Image.new("L", (w, h), 0)
    mono = Image.open(monograma).getchannel("A") if monograma else None
    txt = Image.open(nome).getchannel("A") if nome else None
    if mono:
        mono.thumbnail((int(passo * 0.42), int(passo * 0.42)))
    if txt:
        txt.thumbnail((int(passo * 0.62), int(passo * 0.2)))
    lin = 0
    y = -passo // 2
    while y < h + passo:
        desloc = (passo // 2) * (lin % 2)
        x = -passo + desloc
        while x < w + passo:
            if mono:
                masc.paste(255, (x - mono.width // 2, y - mono.height // 2 - 14), mono)
            if txt:
                masc.paste(255, (x - txt.width // 2, y + mono.height // 2 if mono else y), txt)
            x += passo
        y += int(passo * 0.62)
        lin += 1
    masc = masc.filter(ImageFilter.GaussianBlur(1.2))

    # relevo: sombra deslocada para baixo/direita e luz para cima/esquerda
    d = 3
    sombra = ImageChops.offset(masc, d, d)
    luz = ImageChops.offset(masc, -d, -d)
    a_sombra = ImageChops.subtract(sombra, masc).filter(ImageFilter.GaussianBlur(1.5)).point(lambda v: int(v * 0.30 * forca))
    a_luz = ImageChops.subtract(luz, masc).filter(ImageFilter.GaussianBlur(1.5)).point(lambda v: int(v * 0.85 * forca))
    a_face = masc.point(lambda v: int(v * 0.05 * forca))
    camada = Image.new("RGBA", (w, h), tuple(cor_sombra) + (0,))
    camada.putalpha(a_sombra)
    arte.alpha_composite(camada)
    camada = Image.new("RGBA", (w, h), tuple(cor_luz) + (0,))
    camada.putalpha(a_luz)
    arte.alpha_composite(camada)
    camada = Image.new("RGBA", (w, h), tuple(cor_face) + (0,))
    camada.putalpha(a_face)
    arte.alpha_composite(camada)
    return arte
