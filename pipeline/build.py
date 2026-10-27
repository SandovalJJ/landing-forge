"""Orquestador: scrape → paleta → copy → sitio Astro → dist/<slug>/

    python pipeline/build.py --url "https://www.google.com/maps/place/..."
    python pipeline/build.py --name "La Gatoria Cat Cafe" --city Medellín
    python pipeline/build.py --slug la-gatoria-cat-cafe --skip-scrape --skip-copy   # solo rehacer el sitio
    python pipeline/build.py --slug la-gatoria-cat-cafe --skip-scrape --skip-copy --template cuarto-oscuro
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
from pathlib import Path

from common import DATA_DIR, DIST_DIR, SITE_DIR, read_json, write_json
from copywriter import generate_copy
from instagram import enrich
from palette import build_palette
from scrape import add_query_args, query_from_args, scrape

SITE_DATA = SITE_DIR / "src" / "data" / "business.json"
SITE_PHOTOS = SITE_DIR / "public" / "business" / "photos"


def assemble(slug: str) -> dict:
    folder = DATA_DIR / slug
    raw = read_json(folder / "raw.json")
    copy = read_json(folder / "copy.json")
    photos = raw.get("photos", [])
    if not photos:
        raise SystemExit("No hay fotos descargadas: el diseño necesita al menos una.")

    palette_path = folder / "palette.json"
    if not palette_path.exists():
        write_json(palette_path, build_palette([folder / "photos" / p["file"] for p in photos[:5]]))
    palette = read_json(palette_path)
    # Colores de marca observados a mano (p. ej. el ladrillo y el neón reales del local) ganan a la paleta automática.
    brand_path = folder / "brand.json"
    if brand_path.exists():
        palette["tokens"].update({k: v for k, v in read_json(brand_path).items() if not k.startswith("_")})

    # Solo se publican las fotos que el sitio usa (no las descartadas ni las de otras fuentes).
    if SITE_PHOTOS.exists():
        shutil.rmtree(SITE_PHOTOS)
    SITE_PHOTOS.mkdir(parents=True)
    for p in photos:
        shutil.copy2(folder / "photos" / p["file"], SITE_PHOTOS / p["file"])

    return {
        "business": {k: v for k, v in raw.items() if k != "photos"},
        "photos": [{**p, "src": f"/business/photos/{p['file']}"} for p in photos],
        "palette": palette["tokens"],
        "copy": copy,
    }


def npm(*args: str, env: dict | None = None) -> None:
    exe = "npm.cmd" if os.name == "nt" else "npm"
    subprocess.run([exe, *args], cwd=SITE_DIR, check=True, env=env)


def build_site(slug: str, template: str = "clasica") -> Path:
    write_json(SITE_DATA, assemble(slug))
    if not (SITE_DIR / "node_modules").exists():
        npm("install")
    npm("run", "build", env={**os.environ, "LF_TEMPLATE": template})
    out = DIST_DIR / (slug if template == "clasica" else f"{slug}--{template}")
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(SITE_DIR / "dist", out)
    print(f"✓ sitio listo → {out}")
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_query_args(ap)
    ap.add_argument("--slug", help="Reutilizar data/<slug> existente")
    ap.add_argument("--skip-scrape", action="store_true")
    ap.add_argument("--skip-copy", action="store_true")
    ap.add_argument("--template", choices=["clasica", "cuarto-oscuro", "muro"], default="muro")
    ap.add_argument("--instagram", help="Usuario de Instagram (si no, se toma del enlace que trae Google)")
    ap.add_argument("--no-instagram", action="store_true", help="Usar solo Google Maps")
    a = ap.parse_args()

    if a.skip_scrape:
        if not a.slug:
            raise SystemExit("--skip-scrape requiere --slug")
        raw_path = DATA_DIR / a.slug / "raw.json"
    else:
        print("① Extrayendo datos de Google Maps…")
        raw_path = scrape(query_from_args(a), a.provider, a.lang)
        if not a.no_instagram:
            print("① b Fotos y voz desde Instagram…")
            try:
                enrich(raw_path, a.instagram)
            except SystemExit as exc:  # Instagram es un extra: si falla, el sitio sale con las fotos de Google
                print(f"  ! Instagram omitido: {exc}")

    if not a.skip_copy:
        print("② Redactando contenido con Claude…")
        generate_copy(raw_path, a.lang)

    print("③ Construyendo sitio…")
    build_site(raw_path.parent.name, a.template)


if __name__ == "__main__":
    main()
