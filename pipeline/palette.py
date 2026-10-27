"""Paleta dinámica: colorthief sobre las fotos principales → tokens de diseño.

No usamos los colores crudos de la foto (suelen ser marrones sucios o grises).
Tomamos el tono más 'con carácter' como acento y construimos alrededor de él
un sistema neutro tintado, verificando contraste WCAG para texto y botones.

    python pipeline/palette.py data/la-gatoria-cat-cafe/photos/photo-*.jpg
"""
from __future__ import annotations

import colorsys
import sys
from pathlib import Path

from colorthief import ColorThief

RGB = tuple[int, int, int]


def hex_(rgb: RGB) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def luminance(rgb: RGB) -> float:
    def ch(c: int) -> float:
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a: RGB, b: RGB) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hls(h: float, l: float, s: float) -> RGB:
    r, g, b = colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s)))
    return round(r * 255), round(g * 255), round(b * 255)


def to_hls(rgb: RGB) -> tuple[float, float, float]:
    return colorsys.rgb_to_hls(*(c / 255 for c in rgb))


def vividness(c: RGB) -> float:
    _, l, s = to_hls(c)
    return s * max(0.0, 1 - abs(l - 0.5) * 1.6)


def hue_distance(a: float, b: float) -> float:
    d = abs(a - b) % 1
    return min(d, 1 - d)


def pick_accent(per_image: list[list[RGB]]) -> RGB:
    """El color con carácter que más se repite entre fotos.

    Con una sola foto, una fachada de noche o un letrero de neón deciden toda la
    marca; contando en cuántas fotos aparece cada tono gana la identidad real del lugar.
    """
    candidates = [c for sw in per_image for c in sw if vividness(c) > 0.08]
    if not candidates:
        return max((c for sw in per_image for c in sw), key=vividness)

    def support(c: RGB) -> int:
        h = to_hls(c)[0]
        return sum(
            any(hue_distance(h, to_hls(o)[0]) < 0.05 and vividness(o) > 0.05 for o in sw)
            for sw in per_image
        )

    return max(candidates, key=lambda c: vividness(c) * (1 + support(c)))


def build_palette(images: list[Path]) -> dict:
    thieves = [ColorThief(str(p)) for p in images]
    dominant = thieves[0].get_color(quality=2)
    per_image = [t.get_palette(color_count=6, quality=2) for t in thieves]
    swatches = per_image[0]
    accent = pick_accent(per_image)
    h, l, s = to_hls(accent)

    # Si la foto es casi gris, imponemos algo de saturación para que el acento exista.
    s = max(s, 0.45)
    l = min(max(l, 0.32), 0.55)
    bg = hls(h, 0.975, min(s, 0.35))
    surface = hls(h, 0.995, min(s, 0.2))
    ink = hls(h, 0.11, min(s, 0.3))
    muted = hls(h, 0.38, min(s, 0.15))
    border = hls(h, 0.88, min(s, 0.25))

    # El acento debe leerse sobre el fondo (≥3:1, texto grande / UI).
    accent_rgb = hls(h, l, s)
    while contrast(accent_rgb, bg) < 3.0 and l > 0.15:
        l -= 0.03
        accent_rgb = hls(h, l, s)
    accent_fg = (255, 255, 255) if contrast((255, 255, 255), accent_rgb) >= contrast(ink, accent_rgb) else ink
    accent_soft = hls(h, 0.92, min(s, 0.6))
    # Segundo tono para gradientes sutiles: análogo, no complementario (evita el arcoíris).
    accent_2 = hls(h + 0.035, min(l + 0.08, 0.6), s * 0.9)
    # Para la plantilla «muro»: la pared (tono profundo del acento) y el neón (el color
    # más vivo de todas las fotos, encendido). brand.json puede fijar ambos a mano.
    wall = hls(h, 0.24, min(s, 0.55))
    vivid_h = to_hls(max((c for sw in per_image for c in sw), key=vividness))[0]
    neon = hls(vivid_h, 0.64, 1.0)

    return {
        "source_images": [p.name for p in images],
        "extracted": [hex_(c) for c in swatches],
        "dominant": hex_(dominant),
        "tokens": {
            "bg": hex_(bg),
            "surface": hex_(surface),
            "ink": hex_(ink),
            "muted": hex_(muted),
            "border": hex_(border),
            "accent": hex_(accent_rgb),
            "accent-2": hex_(accent_2),
            "accent-fg": hex_(accent_fg),
            "accent-soft": hex_(accent_soft),
            "wall": hex_(wall),
            "neon": hex_(neon),
        },
    }


if __name__ == "__main__":
    import json
    print(json.dumps(build_palette([Path(a) for a in sys.argv[1:]]), indent=2))
