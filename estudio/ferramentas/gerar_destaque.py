#!/usr/bin/env python3
"""Arte exclusiva de um produto/linha em destaque (ex.: Jack Daniel's em 3 sabores).

Uso:
    python ferramentas/gerar_destaque.py "campanhas/2026-11-27 black-friday-bebidas"

Lê a seção `destaque:` do briefing.yaml:
    destaque:
      nome: "Jack Daniel's"
      detalhe: "Honey • Apple • Fire  |  1 litro"
      fotos: [IMG_0637.HEIC, IMG_0636.HEIC, IMG_0638.HEIC]
      preco_de: ""        # opcional
      preco_por: 134.90
      chamada: "Preço imperdível"   # opcional, faixa acima do preço
Sai em <pasta>/saida/destaque-feed.jpg e destaque-story.jpg.
"""
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gerar_artes import RAIZ, aplicar_tema, caber, cor, fonte, fundo, preco_br  # noqa: E402
from gerar_encarte import FORMATOS, achar_recorte, colar_recorte, fundo_marca, recorte_garrafa  # noqa: E402


def gerar(marca, camp, pasta, formato):
    dst = camp["destaque"]
    w, h = FORMATOS[formato]
    m = 60
    c = dict(marca["cores"])
    c.setdefault("cartao", c["destaque"])
    c.setdefault("texto_cartao", c["texto_destaque"])
    import gerar_encarte
    gerar_encarte.BRILHO = cor(marca["brilho"]) if marca.get("brilho") else None
    arte = fundo_marca(marca, w, h)
    d = ImageDraw.Draw(arte)
    story = formato == "story"
    y = m + (60 if story else 0)

    logo = RAIZ / marca["logo"] if marca.get("logo") else None
    if logo and logo.exists():
        lg = Image.open(logo).convert("RGBA")
        lg.thumbnail((320, 120) if story else (240, 86))
        arte.alpha_composite(lg, ((w - lg.width) // 2, y))
        y += lg.height + 14

    # faixa "BLACK FRIDAY"
    tit = camp.get("titulo", "").upper()
    if tit:
        f = fonte(44 if story else 36, "Black")
        tw = d.textlength(tit, font=f)
        d.rounded_rectangle((w / 2 - tw / 2 - 30, y, w / 2 + tw / 2 + 30, y + f.size + 26), 40, fill=cor(c["destaque"]))
        d.text((w / 2, y + (f.size + 26) / 2), tit, font=f, fill=cor(c["texto_destaque"]), anchor="mm")
        y += f.size + 26 + (24 if story else 14)

    nome = dst["nome"] if dst.get("manter_maiusculas") else dst["nome"].upper()  # "iPhone" não vira "IPHONE"
    f = caber(d, nome, "titulo", w - 2 * m, 170 if story else 104)
    d.text((w // 2, y), nome, font=f, fill=cor(c["texto"]), anchor="mt")
    y += f.size + (14 if story else 6)
    if dst.get("detalhe"):
        f = caber(d, dst["detalhe"], "SemiBold", w - 2 * m, 40 if story else 34)
        d.text((w // 2, y), dst["detalhe"], font=f, fill=cor(c["texto_suave"]), anchor="mt")
        y += f.size + (36 if story else 24)

    # rodapé
    rod = h - m - (110 if story else 0)
    # regras da promoção (letra miúda) + avisos legais da marca
    from gerar_artes import quebrar
    miudas = []
    for linha in list(camp.get("regras", [])) + list(marca.get("avisos_obrigatorios", [])):
        miudas += quebrar(d, linha, fonte(22, "Medium"), w - 2 * m)
    for linha in reversed(miudas):
        d.text((w // 2, rod), linha, font=fonte(22, "Medium"), fill=cor(c["texto_suave"]), anchor="mb")
        rod -= 30
    for linha in reversed([e for e in (camp.get("validade", ""), marca.get("contato", "")) if e]):
        d.text((w // 2, rod - 4), linha, font=fonte(28, "SemiBold"), fill=cor(c["texto"]), anchor="mb")
        rod -= 42
    # faixa de chamadas (ex.: "Confira as cores disponíveis")
    if dst.get("faixa"):
        ff = caber(d, dst["faixa"].upper(), "Bold", w - 2 * m - 40, 30 if story else 26)
        tw = d.textlength(dst["faixa"].upper(), font=ff)
        rod -= 8
        d.rounded_rectangle((w / 2 - tw / 2 - 24, rod - ff.size - 22, w / 2 + tw / 2 + 24, rod), 30,
                            outline=cor(c["destaque"]), width=3)
        d.text((w / 2, rod - (ff.size + 22) / 2), dst["faixa"].upper(), font=ff, fill=cor(c["destaque"]), anchor="mm")
        rod -= ff.size + 22 + 6

    # preço
    tem_de = bool(dst.get("preco_de"))
    rot = 44 if dst.get("rotulo_preco") else 0
    alto = (250 if story else 160) + (50 if tem_de else 0) + rot
    py1 = rod - 24
    py0 = py1 - alto
    d.rounded_rectangle((m, py0, w - m, py1), 40, fill=cor(c["destaque"]))
    if dst.get("chamada"):
        fc = fonte(30 if story else 26, "Black")
        txt = dst["chamada"].upper()
        tw = d.textlength(txt, font=fc)
        d.rounded_rectangle((w / 2 - tw / 2 - 26, py0 - 28, w / 2 + tw / 2 + 26, py0 + 28), 28, fill=cor(c["cartao"]),
                            outline=cor(c["destaque"]), width=4)
        d.text((w / 2, py0), txt, font=fc, fill=cor(c["texto_cartao"]), anchor="mm")
    ty = py0 + 40
    if tem_de:
        txt = "DE " + preco_br(dst["preco_de"])
        fd = fonte(36, "SemiBold")
        d.text((w / 2, ty), txt, font=fd, fill=cor(c["texto_destaque"]), anchor="mt")
        tw = d.textlength(txt, font=fd)
        d.line((w / 2 - tw / 2, ty + 22, w / 2 + tw / 2, ty + 22), fill=cor(c["texto_destaque"]), width=4)
        ty += 50
    fp = caber(d, preco_br(dst["preco_por"]), "Black", w - 2 * m - 80, 170 if story else 110)
    d.text((w / 2, (ty + py1 - rot) / 2 + 6), preco_br(dst["preco_por"]), font=fp, fill=cor(c["texto_destaque"]), anchor="mm")
    if dst.get("rotulo_preco"):
        d.text((w / 2, py1 - 22), (dst["rotulo_preco"] if dst.get("manter_maiusculas") else dst["rotulo_preco"].upper()), font=fonte(28, "SemiBold"), fill=cor(c["texto_destaque"]), anchor="mb")

    # fotos lado a lado
    fotos = [pasta / "fotos" / f for f in dst["fotos"]]
    n = len(fotos)
    gap = 18
    area_y0, area_y1 = y, py0 - (50 if dst.get("chamada") else 30)
    fh = area_y1 - area_y0
    fw = int((w - 2 * m - gap * (n - 1)) / n)
    if camp.get("recorte") and all(achar_recorte(pasta, f) for f in dst["fotos"]):
        # garrafas recortadas lado a lado, levemente sobrepostas
        larg_slot = int((w - 2 * m) / n * 1.12)
        for i, f in enumerate(dst["fotos"]):
            cx = m + (w - 2 * m) * (i + 0.5) / n
            colar_recorte(arte, achar_recorte(pasta, f), (int(cx - larg_slot / 2), area_y0, int(cx + larg_slot / 2), area_y1 - 10))
        return arte.convert("RGB")
    for i, fp_ in enumerate(fotos):
        x0 = m + i * (fw + gap)
        sombra = Image.new("RGBA", arte.size, (0, 0, 0, 0))
        ImageDraw.Draw(sombra).rounded_rectangle((x0, area_y0 + 8, x0 + fw, area_y1 + 8), 28, fill=(20, 40, 80, 70))
        arte.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(12)))
        ImageDraw.Draw(arte).rounded_rectangle((x0 - 6, area_y0 - 6, x0 + fw + 6, area_y1 + 6), 32, fill=cor(c["cartao"]))
        if fp_.exists():
            img = recorte_garrafa(Image.open(fp_), fw / fh).resize((fw, fh), Image.LANCZOS)
            masc = Image.new("L", (fw, fh), 0)
            ImageDraw.Draw(masc).rounded_rectangle((0, 0, fw - 1, fh - 1), 26, fill=255)
            arte.paste(img, (x0, area_y0), masc)
        else:
            print(f"  aviso: foto não encontrada: {fp_}")
    return arte.convert("RGB")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pasta = Path(sys.argv[1]).resolve()
    camp = yaml.safe_load((pasta / "briefing.yaml").read_text(encoding="utf-8"))
    marca = aplicar_tema(yaml.safe_load((RAIZ / "marcas" / camp["marca"] / "marca.yaml").read_text(encoding="utf-8")), camp)
    (pasta / "saida").mkdir(exist_ok=True)
    for fmt in camp.get("formatos", ["feed", "story"]):
        out = pasta / "saida" / f"destaque-{fmt}.jpg"
        gerar(marca, camp, pasta, fmt).save(out, quality=93)
        print("ok", out)


if __name__ == "__main__":
    main()
