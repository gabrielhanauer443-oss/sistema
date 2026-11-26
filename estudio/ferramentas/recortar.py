#!/usr/bin/env python3
"""Recorta o produto de cada foto da campanha (tira o fundo) e salva em <pasta>/recortes/<nome>.png.

Uso:
    python ferramentas/recortar.py "campanhas/2026-11-27 black-friday-bebidas"

Precisa de: pip install "rembg[cpu]" pillow-heif
Na 1ª vez baixa o modelo de recorte (~180 MB). Foto que já tem recorte é pulada;
para refazer, apague o PNG em recortes/.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

EXT = {".heic", ".jpg", ".jpeg", ".png", ".webp"}


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    from rembg import new_session, remove
    pasta = Path(sys.argv[1]).resolve()
    saida = pasta / "recortes"
    saida.mkdir(exist_ok=True)
    sessao = None
    for f in sorted((pasta / "fotos").iterdir()):
        if f.suffix.lower() not in EXT:
            continue
        destino = saida / (f.stem + ".png")
        if destino.exists():
            continue
        sessao = sessao or new_session("isnet-general-use")
        im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        im.thumbnail((2000, 2000))
        out = remove(im, session=sessao)
        a = np.asarray(out.getchannel("A")).copy()
        a[a < 30] = 0  # limpa resto de fundo quase invisível
        out.putalpha(Image.fromarray(a))
        out = out.crop(out.getchannel("A").point(lambda v: 255 if v > 60 else 0).getbbox())
        out.save(destino)
        print("ok", destino)


if __name__ == "__main__":
    main()
