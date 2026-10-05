from pathlib import Path
from PIL import Image

SRC = Path(__file__).parent / "v2"
OUT = Path(__file__).parent.parent / "web" / "assets" / "v2"
ECHELLE = 2560 / 6995
OEIL = (2958, 2102, 4033, 3825)
PIECES = {
    "bg": (None, "jpg"),
    "cadre": (None, "webp"),
    "logo": ((121, 306, 3635, 1554), "webp"),
    "oeil": (OEIL, "webp"),
    "oeil_survol": (OEIL, "webp"),
    "oeil_off": (OEIL, "webp"),
    "episode": ((393, 2582, 2703, 2855), "png"),
    "etiquette": ((400, 2405, 1119, 2553), "png"),
}

OUT.mkdir(parents=True, exist_ok=True)
for nom, (boite, fmt) in PIECES.items():
    im = Image.open(SRC / f"{nom}.png")
    if boite:
        im = im.crop(boite)
    taille = (round(im.width * ECHELLE), round(im.height * ECHELLE))
    im = im.resize(taille, Image.LANCZOS)
    dest = OUT / f"{nom}.{fmt}"
    if fmt == "jpg":
        im.convert("RGB").save(dest, quality=88, optimize=True, progressive=True)
    elif fmt == "webp":
        im.save(dest, quality=92, alpha_quality=100, method=6)
    else:
        im.save(dest, optimize=True)
    print(f"{dest.name:18} {taille[0]}x{taille[1]}  css {taille[0]/2:g}x{taille[1]/2:g}  "
          f"pos {boite[0]*ECHELLE/2:.1f},{boite[1]*ECHELLE/2:.1f}" if boite else f"{dest.name:18} {taille}")
