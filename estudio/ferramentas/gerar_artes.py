#!/usr/bin/env python3
"""Gera as artes de uma campanha a partir do briefing.yaml e das fotos da pasta.

Uso:
    python ferramentas/gerar_artes.py "campanhas/2026-11-27 black-friday-bebidas"

Para cada produto do briefing sai um feed (1080x1350, 4:5) e um story (1080x1920, 9:16)
na subpasta "saida/". Foto com fundo transparente (PNG recortado) fica melhor.
Precisa de: pip install pillow pyyaml
"""
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
FONTES = Path(__file__).resolve().parent / "fontes"
FORMATOS = {"feed": (1080, 1350), "story": (1080, 1920)}


def cor(hex_):
    hex_ = hex_.lstrip("#")
    return tuple(int(hex_[i:i + 2], 16) for i in (0, 2, 4))


def fonte(tam, peso="Bold"):
    if peso == "titulo":
        return ImageFont.truetype(str(FONTES / "Anton-Regular.ttf"), tam)
    f = ImageFont.truetype(str(FONTES / "Montserrat.ttf"), tam)
    f.set_variation_by_name(peso)
    return f


def caber(draw, texto, peso, largura_max, tam_max, tam_min=20):
    """Maior fonte em que o texto cabe na largura."""
    tam = tam_max
    while tam > tam_min:
        f = fonte(tam, peso)
        if draw.textlength(texto, font=f) <= largura_max:
            return f
        tam -= 4
    return fonte(tam_min, peso)


def quebrar(draw, texto, f, largura_max):
    linhas, atual = [], ""
    for p in texto.split():
        teste = (atual + " " + p).strip()
        if draw.textlength(teste, font=f) <= largura_max:
            atual = teste
        else:
            if atual:
                linhas.append(atual)
            atual = p
    if atual:
        linhas.append(atual)
    return linhas


def preco_br(v):
    if isinstance(v, str):
        return v
    s = f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def fundo(w, h, c1, c2):
    """Degradê vertical de c1 (topo) para c2 (base)."""
    base = Image.new("RGB", (w, h), c1)
    topo = Image.new("RGB", (w, h), c2)
    mascara = Image.linear_gradient("L").resize((w, h))
    return Image.composite(topo, base, mascara)


def colar_produto(arte, foto, caixa):
    x0, y0, x1, y1 = caixa
    foto = ImageOps.exif_transpose(foto).convert("RGBA")
    foto.thumbnail((x1 - x0, y1 - y0), Image.LANCZOS)
    px = x0 + (x1 - x0 - foto.width) // 2
    py = y0 + (y1 - y0 - foto.height) // 2
    # sombra suave embaixo do produto
    sombra = Image.new("RGBA", arte.size, (0, 0, 0, 0))
    ImageDraw.Draw(sombra).ellipse(
        (px + foto.width * 0.15, py + foto.height - 30, px + foto.width * 0.85, py + foto.height + 30),
        fill=(0, 0, 0, 120))
    arte.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(25)))
    arte.alpha_composite(foto, (px, py))


def gerar(marca, camp, prod, pasta, formato):
    w, h = FORMATOS[formato]
    m = 70  # margem
    c = marca["cores"]
    arte = fundo(w, h, cor(c["fundo_topo"]), cor(c["fundo_base"])).convert("RGBA")
    d = ImageDraw.Draw(arte)

    y = m + (60 if formato == "story" else 0)  # story: espaço da barra do Instagram

    # logo ou nome da loja
    logo = marca.get("logo")
    logo_path = (RAIZ / logo) if logo else None
    if logo_path and logo_path.exists():
        lg = Image.open(logo_path).convert("RGBA")
        lg.thumbnail((360, 130))
        arte.alpha_composite(lg, ((w - lg.width) // 2, y))
        y += lg.height + 30
    else:
        f = caber(d, marca["nome"].upper(), "ExtraBold", w - 2 * m, 44)
        d.text((w // 2, y), marca["nome"].upper(), font=f, fill=cor(c["texto"]), anchor="mt")
        y += 70

    # título da campanha (ex.: BLACK FRIDAY)
    titulo = camp.get("titulo", "").upper()
    if titulo:
        f = caber(d, titulo, "titulo", w - 2 * m, 150 if formato == "story" else 130)
        d.text((w // 2, y), titulo, font=f, fill=cor(c["destaque"]), anchor="mt")
        y += f.size + 25
    sub = camp.get("subtitulo", "")
    if sub:
        f = caber(d, sub.upper(), "SemiBold", w - 2 * m, 40)
        d.text((w // 2, y), sub.upper(), font=f, fill=cor(c["texto"]), anchor="mt")
        y += 60

    # rodapé: aviso legal + contato (desenhado de baixo para cima)
    rodape_y = h - m - (120 if formato == "story" else 0)
    avisos = list(marca.get("avisos_obrigatorios", []))
    f_av = fonte(24, "Medium")
    for linha in reversed(avisos):
        d.text((w // 2, rodape_y), linha, font=f_av, fill=cor(c["texto_suave"]), anchor="mb")
        rodape_y -= 34
    extras = [camp.get("validade", ""), marca.get("contato", "")]
    f_ct = fonte(30, "SemiBold")
    for linha in reversed([e for e in extras if e]):
        d.text((w // 2, rodape_y - 6), linha, font=f_ct, fill=cor(c["texto"]), anchor="mb")
        rodape_y -= 46

    # bloco de preço
    preco_alto = 230 if prod.get("preco_de") else 180
    bloco_y1 = rodape_y - 30
    bloco_y0 = bloco_y1 - preco_alto
    nome = prod["nome"]
    f_nome = fonte(46, "Bold")
    linhas_nome = quebrar(d, nome, f_nome, w - 2 * m)[:2]
    nome_y0 = bloco_y0 - 20 - 58 * len(linhas_nome)

    # área do produto entre o topo e o nome
    foto_path = pasta / "fotos" / prod["foto"]
    if foto_path.exists():
        colar_produto(arte, Image.open(foto_path), (m, y + 10, w - m, nome_y0 - 20))
    else:
        d.rounded_rectangle((m, y + 10, w - m, nome_y0 - 20), 30, outline=cor(c["texto_suave"]), width=4)
        d.text((w // 2, (y + nome_y0) // 2), f"FOTO FALTANDO:\n{prod['foto']}", font=fonte(36),
               fill=cor(c["texto_suave"]), anchor="mm", align="center")
        print(f"  aviso: foto não encontrada: {foto_path}")

    d = ImageDraw.Draw(arte)
    ny = nome_y0
    for linha in linhas_nome:
        d.text((w // 2, ny), linha, font=f_nome, fill=cor(c["texto"]), anchor="mt")
        ny += 58

    # selo de desconto
    if prod.get("selo"):
        f_s = fonte(40, "Black")
        tw = d.textlength(prod["selo"], font=f_s)
        sx1, sy0 = w - m, y + 10
        d.rounded_rectangle((sx1 - tw - 50, sy0, sx1, sy0 + 80), 40, fill=cor(c["destaque"]))
        d.text((sx1 - (tw + 50) / 2, sy0 + 40), prod["selo"], font=f_s, fill=cor(c["texto_destaque"]), anchor="mm")

    # caixa do preço
    d.rounded_rectangle((m, bloco_y0, w - m, bloco_y1), 36, fill=cor(c["destaque"]))
    py = bloco_y0 + 25
    if prod.get("preco_de"):
        txt = "DE " + preco_br(prod["preco_de"])
        f_de = fonte(36, "SemiBold")
        d.text((w // 2, py), txt, font=f_de, fill=cor(c["texto_destaque"]), anchor="mt")
        tw = d.textlength(txt, font=f_de)
        d.line((w / 2 - tw / 2, py + 22, w / 2 + tw / 2, py + 22), fill=cor(c["texto_destaque"]), width=4)
        py += 50
    f_p = caber(d, preco_br(prod["preco_por"]), "Black", w - 2 * m - 80, 120)
    d.text((w // 2, (py + bloco_y1) // 2), preco_br(prod["preco_por"]), font=f_p,
           fill=cor(c["texto_destaque"]), anchor="mm")

    return arte.convert("RGB")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pasta = Path(sys.argv[1])
    if not pasta.is_absolute():
        pasta = (Path.cwd() / pasta)
    briefing = yaml.safe_load((pasta / "briefing.yaml").read_text(encoding="utf-8"))
    marca = yaml.safe_load((RAIZ / "marcas" / briefing["marca"] / "marca.yaml").read_text(encoding="utf-8"))
    saida = pasta / "saida"
    saida.mkdir(exist_ok=True)
    formatos = briefing.get("formatos", ["feed", "story"])
    for i, prod in enumerate(briefing["produtos"], 1):
        for fmt in formatos:
            arte = gerar(marca, briefing, prod, pasta, fmt)
            nome = f"{i:02d}-{Path(prod['foto']).stem}-{fmt}.jpg"
            arte.save(saida / nome, quality=92)
            print("ok", saida / nome)


if __name__ == "__main__":
    main()
