#!/usr/bin/env python3
"""Gera UM encarte com todos os produtos do briefing (grade de cartões com foto, nome e preço).

Uso:
    python ferramentas/gerar_encarte.py "campanhas/2026-11-27 black-friday-bebidas"

Sai em <pasta>/saida/encarte-feed.jpg (1080x1350) e encarte-story.jpg (1080x1920).
Produto sem preço (preco_por vazio) aparece com "R$ ?" para lembrar de preencher.
Produto com `fora: true` não entra no encarte.
"""
import math
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gerar_artes import RAIZ, aplicar_tema, caber, cor, fonte, fundo, preco_br  # noqa: E402
from textura import fundo_relevo  # noqa: E402


def fundo_marca(marca, w, h):
    """Fundo com relevo da marca (se o tema pedir) ou degradê simples."""
    c = marca["cores"]
    rel = marca.get("relevo")
    if rel:
        return fundo_relevo(w, h, c["fundo_topo"], c["fundo_base"], RAIZ / rel["monograma"],
                            RAIZ / rel["nome"] if rel.get("nome") else None, rel.get("passo", 260), rel.get("forca", 1.0))
    return fundo(w, h, cor(c["fundo_topo"]), cor(c["fundo_base"])).convert("RGBA")


def achar_recorte(pasta, foto):
    p = pasta / "recortes" / (Path(foto).stem + ".png")
    return p if p.exists() else None


def colar_recorte(arte, rec, caixa, sombra=True):
    """Cola a garrafa recortada centrada na base da caixa, com sombra de chão."""
    x0, y0, x1, y1 = caixa
    img = Image.open(rec).convert("RGBA")
    img.thumbnail((x1 - x0, y1 - y0), Image.LANCZOS)
    px = x0 + (x1 - x0 - img.width) // 2
    py = y1 - img.height
    if sombra:
        s = Image.new("RGBA", arte.size, (0, 0, 0, 0))
        ImageDraw.Draw(s).ellipse((px + img.width * 0.08, y1 - 14, px + img.width * 0.92, y1 + 14), fill=(20, 40, 80, 120))
        arte.alpha_composite(s.filter(ImageFilter.GaussianBlur(10)))
    arte.alpha_composite(img, (px, py))

FORMATOS = {"feed": (1080, 1350), "story": (1080, 1920)}


def recorte_garrafa(foto, prop):
    """Recorta a foto em volta do produto (centro), na proporção prop = largura/altura."""
    foto = ImageOps.exif_transpose(foto).convert("RGB")
    W, H = foto.size
    # o produto fica no centro, do terço de cima até o balcão
    h = int(H * 0.78)
    w = min(W, int(h * prop))
    x0 = (W - w) // 2
    y0 = int(H * 0.16)
    return foto.crop((x0, y0, x0 + w, min(H, y0 + h)))


def gerar(marca, camp, pasta, formato):
    w, h = FORMATOS[formato]
    m = 50
    c = dict(marca["cores"])
    c.setdefault("cartao", c["destaque"])
    c.setdefault("texto_cartao", c["texto_destaque"])
    arte = fundo_marca(marca, w, h)
    d = ImageDraw.Draw(arte)
    y = m + (60 if formato == "story" else 0)
    usar_recorte = camp.get("recorte", False)

    # cabeçalho: logo + título + subtítulo
    logo = RAIZ / marca["logo"] if marca.get("logo") else None
    if logo and logo.exists():
        lg = Image.open(logo).convert("RGBA")
        lg.thumbnail((260, 90) if formato == "feed" else (320, 120))
        arte.alpha_composite(lg, ((w - lg.width) // 2, y))
        y += lg.height + 12
    titulo = camp.get("titulo", "").upper()
    if titulo:
        f = caber(d, titulo, "titulo", w - 2 * m, 100 if formato == "feed" else 140)
        d.text((w // 2, y), titulo, font=f, fill=cor(c["texto"]), anchor="mt")
        y += f.size + 8
    if camp.get("subtitulo"):
        f = caber(d, camp["subtitulo"].upper(), "SemiBold", w - 2 * m, 34)
        d.text((w // 2, y), camp["subtitulo"].upper(), font=f, fill=cor(c["texto"]), anchor="mt")
        y += 52

    # rodapé
    rod = h - m - (110 if formato == "story" else 0)
    for linha in reversed(marca.get("avisos_obrigatorios", [])):
        d.text((w // 2, rod), linha, font=fonte(22, "Medium"), fill=cor(c["texto_suave"]), anchor="mb")
        rod -= 30
    for linha in reversed([e for e in (camp.get("validade", ""), marca.get("contato", "")) if e]):
        d.text((w // 2, rod - 4), linha, font=fonte(28, "SemiBold"), fill=cor(c["texto"]), anchor="mb")
        rod -= 42
    rod -= 16

    prods = [p for p in camp["produtos"] if not p.get("fora")]
    n = len(prods)
    cols = 4 if formato == "feed" else 3
    if n <= 6:
        cols = 3 if formato == "feed" else 2
    linhas = math.ceil(n / cols)
    gap = 14 if not usar_recorte else 8
    cw = (w - 2 * m - gap * (cols - 1)) / cols
    ch = (rod - y - gap * (linhas - 1)) / linhas

    for i, p in enumerate(prods):
        lin, col = divmod(i, cols)
        # última linha incompleta fica centralizada
        na_linha = min(cols, n - lin * cols)
        desloc = (cols - na_linha) * (cw + gap) / 2
        x0 = m + desloc + col * (cw + gap)
        y0 = y + lin * (ch + gap)
        x1, y1 = x0 + cw, y0 + ch
        box = [int(v) for v in (x0, y0, x1, y1)]
        bw, bh = box[2] - box[0], box[3] - box[1]

        # cartão creme
        tam_nome = 22 if formato == "feed" else 26
        tam_preco = 42 if formato == "feed" else 52
        rec = achar_recorte(pasta, p["foto"]) if usar_recorte else None
        if rec:
            area_txt = tam_nome + tam_preco + 30 + (26 if p.get("preco_de") else 0)
            colar_recorte(arte, rec, (box[0] - 4, box[1] - 6, box[2] + 4, box[3] - area_txt - 6))
            d = ImageDraw.Draw(arte)
            pad, fh = 8, bh - area_txt - 8
        else:
            # sombra leve + cartão
            sombra = Image.new("RGBA", arte.size, (0, 0, 0, 0))
            ImageDraw.Draw(sombra).rounded_rectangle((box[0], box[1] + 6, box[2], box[3] + 6), 22, fill=(20, 40, 80, 60))
            arte.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(8)))
            d = ImageDraw.Draw(arte)
            d.rounded_rectangle(box, 22, fill=cor(c["cartao"]))
            pad = 8
            tam_nome = 22 if formato == "feed" else 26
            tam_preco = 42 if formato == "feed" else 52
            area_txt = tam_nome + tam_preco + 30 + (26 if p.get("preco_de") else 0)
            fw, fh = bw - 2 * pad, bh - area_txt - pad
            foto_path = pasta / "fotos" / p["foto"]
            if foto_path.exists():
                img = recorte_garrafa(Image.open(foto_path), fw / fh).resize((fw, fh), Image.LANCZOS)
                masc = Image.new("L", (fw, fh), 0)
                ImageDraw.Draw(masc).rounded_rectangle((0, 0, fw - 1, fh - 1), 16, fill=255)
                arte.paste(img, (box[0] + pad, box[1] + pad), masc)
            else:
                print(f"  aviso: foto não encontrada: {foto_path}")
        # selo
        if p.get("selo"):
            fs = fonte(26 if formato == "feed" else 30, "Black")
            tw = d.textlength(p["selo"], font=fs)
            sx1, sy0 = box[2] - pad - 6, box[1] + pad + 6
            d.rounded_rectangle((sx1 - tw - 24, sy0, sx1, sy0 + 42), 21, fill=cor(c["texto_cartao"]))
            d.text((sx1 - (tw + 24) / 2, sy0 + 21), p["selo"], font=fs, fill=cor(c["cartao"]), anchor="mm")

        # nome + preço
        ty = box[1] + pad + fh + 8
        larg = bw - 16
        fn = caber(d, p["nome"], "Bold", larg, tam_nome, 14)
        d.text(((box[0] + box[2]) / 2, ty), p["nome"], font=fn, fill=cor(c["texto_cartao"]), anchor="mt")
        base = box[3] - 10
        preco = preco_br(p["preco_por"]) if p.get("preco_por") not in (None, "") else "R$ ?"
        if rec:  # preço numa pílula azul com texto creme
            fp = caber(d, preco, "Black", larg - 30, tam_preco - 6)
            tw = d.textlength(preco, font=fp)
            cx = (box[0] + box[2]) / 2
            d.rounded_rectangle((cx - tw / 2 - 16, base - fp.size - 14, cx + tw / 2 + 16, base + 4), 30,
                                fill=cor(c["destaque"]))
            d.text((cx, base - 4), preco, font=fp, fill=cor(c["texto_destaque"]), anchor="mb")
            base -= 8
        else:
            fp = caber(d, preco, "Black", larg, tam_preco)
            d.text(((box[0] + box[2]) / 2, base), preco, font=fp, fill=cor(c["texto_cartao"]), anchor="mb")
        if p.get("preco_de"):
            txt = preco_br(p["preco_de"])
            fd = fonte(20 if formato == "feed" else 24, "SemiBold")
            yy = base - fp.size - 6
            d.text(((box[0] + box[2]) / 2, yy), txt, font=fd, fill=cor(c["texto_cartao"]), anchor="mb")
            tw = d.textlength(txt, font=fd)
            cx = (box[0] + box[2]) / 2
            d.line((cx - tw / 2, yy - fd.size * 0.4, cx + tw / 2, yy - fd.size * 0.4), fill=cor(c["texto_cartao"]), width=3)

    return arte.convert("RGB")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pasta = Path(sys.argv[1]).resolve()
    camp = yaml.safe_load((pasta / "briefing.yaml").read_text(encoding="utf-8"))
    marca = yaml.safe_load((RAIZ / "marcas" / camp["marca"] / "marca.yaml").read_text(encoding="utf-8"))
    marca = aplicar_tema(marca, camp)
    (pasta / "saida").mkdir(exist_ok=True)
    for fmt in camp.get("formatos", ["feed", "story"]):
        out = pasta / "saida" / f"encarte-{fmt}.jpg"
        gerar(marca, camp, pasta, fmt).save(out, quality=93)
        print("ok", out)


if __name__ == "__main__":
    main()
