"""Enriquecimiento con Instagram (Apify).

Google Maps aporta lo verificable (reseñas, calificación, horarios, ubicación);
Instagram aporta lo que el negocio elige mostrar: sus fotos, su bio y su voz.

    python pipeline/instagram.py --slug la-gatoria-cat-cafe            # usuario sacado de raw.json
    python pipeline/instagram.py --slug la-gatoria-cat-cafe --user lagatoriacatcafe
"""
from __future__ import annotations

import argparse
import base64
import io
import re
import shutil
from pathlib import Path

import anthropic
import requests
from PIL import Image
from pydantic import BaseModel, Field

from common import DATA_DIR, env, read_json, write_json
from copywriter import MODEL

ACTOR = "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items"
POSTS_ACTOR = "https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items"
MAX_IG_PHOTOS = 10
MAX_TOTAL_PHOTOS = 12
MIN_SIDE = 900  # px; menos que eso se ve blando en un hero


def username_from(raw: dict) -> str | None:
    for value in (raw.get("website"), raw.get("instagram")):
        m = re.search(r"instagram\.com/([A-Za-z0-9_.]+)", value or "")
        if m:
            return m.group(1).rstrip(".")
    return None


def fetch_profile(user: str) -> dict:
    token = env("APIFY_TOKEN")
    resp = requests.post(ACTOR, params={"token": token}, json={"usernames": [user]}, timeout=600)
    if not resp.ok:
        raise SystemExit(f"Apify Instagram {resp.status_code}: {resp.text[:300]}")
    items = resp.json()
    if not items or items[0].get("error"):
        raise SystemExit(f"Instagram no devolvió el perfil @{user}: {items[:1]}")
    return items[0]


def fetch_posts(user: str, limit: int = 30) -> list[dict]:
    """El scraper de perfil a veces vuelve sin publicaciones; este actor las trae directamente."""
    resp = requests.post(
        POSTS_ACTOR,
        params={"token": env("APIFY_TOKEN")},
        json={"username": [user], "resultsLimit": limit},
        timeout=600,
    )
    if not resp.ok:
        print(f"  ! Apify posts {resp.status_code}: {resp.text[:200]}")
        return []
    return [p for p in resp.json() if not p.get("error")]


def candidates(posts: list[dict], user: str, limit: int = 60) -> list[dict]:
    """Fotos sueltas y las de dentro de los carruseles, del propio negocio.

    La descripción automática de Instagram marca "text" en casi cualquier foto con un letrero al
    fondo, así que no sirve para descartar flyers: eso lo decide Claude viendo la imagen (curate)."""
    out = []
    for post in sorted(posts, key=lambda p: p.get("likesCount") or 0, reverse=True):
        if (post.get("ownerUsername") or user) != user:
            continue  # publicaciones de colaboradores: no son fotos del negocio
        frames = post.get("childPosts") if post.get("type") == "Sidecar" else [post] if post.get("type") == "Image" else []
        for f in frames or []:
            w, h = f.get("dimensionsWidth") or 0, f.get("dimensionsHeight") or 0
            if f.get("type", "Image") != "Image" or min(w, h) < MIN_SIDE:
                continue
            out.append({**f, "_likes": post.get("likesCount") or 0, "_caption": post.get("caption", ""), "_url": post.get("url")})
    return out[:limit]


class Pick(BaseModel):
    index: int = Field(description="Número de la imagen candidata (empieza en 0).")
    subject: str = Field(description="Una palabra: lugar, gatos, comida, gente o detalle.")
    alt: str = Field(description="Texto alternativo en español, concreto, máx. 18 palabras.")


class Curation(BaseModel):
    picks: list[Pick] = Field(description="Hasta 10 fotos, de mejor a peor.")


CURATOR = """Eliges fotos para el sitio web de un negocio local a partir de su Instagram.
Descarta toda imagen con texto, logos grandes, stickers, flechas o gráficos superpuestos (flyers, anuncios,
memes), capturas de pantalla, fotos borrosas o muy oscuras. Quédate con fotografías limpias y nítidas.
Busca variedad: el local por dentro y por fuera, el producto, y lo que hace especial al negocio.
Evita casi-duplicados. La primera elegida debe funcionar como foto principal del sitio."""


def curate(paths: list[Path], business: str) -> list[Pick]:
    client = anthropic.Anthropic()
    content: list[dict] = []
    for i, path in enumerate(paths):
        im = Image.open(path).convert("RGB")
        im.thumbnail((512, 512))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=80)
        content += [
            {"type": "text", "text": f"Imagen {i}:"},
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": base64.b64encode(buf.getvalue()).decode()}},
        ]
    content.append({"type": "text", "text": f"Negocio: {business}. Elige las mejores fotos según las reglas."})
    try:
        response = client.messages.parse(
            model=MODEL,
            max_tokens=8000,
            system=CURATOR,
            messages=[{"role": "user", "content": content}],
            output_format=Curation,
            output_config={"effort": "medium"},
        )
    except anthropic.APIStatusError as exc:
        raise SystemExit(f"Error de la API de Claude al elegir fotos ({exc.status_code}): {exc.message}")
    if response.stop_reason == "refusal" or response.parsed_output is None:
        raise SystemExit("Claude no devolvió una selección de fotos; vuelve a ejecutar.")
    return [p for p in response.parsed_output.picks if 0 <= p.index < len(paths)]


def clean_caption(text: str, limit: int = 400) -> str:
    text = re.sub(r"(#\w+\s*)+$", "", text or "").strip()  # hashtags al final
    return text[:limit]


def enrich(raw_path: Path, user: str | None = None) -> Path:
    raw = read_json(raw_path)
    user = user or username_from(raw)
    if not user:
        print("  · sin Instagram en los datos de Google; se usan solo sus fotos")
        return raw_path

    profile = fetch_profile(user)
    posts = profile.get("latestPosts") or fetch_posts(user)
    folder = raw_path.parent
    write_json(folder / "instagram.raw.json", {"profile": profile, "posts": posts})  # para depurar filtros
    # Las URL de Instagram caducan: se descargan ya, a una carpeta de candidatas.
    cand_dir = folder / "ig-candidates"
    shutil.rmtree(cand_dir, ignore_errors=True)
    cand_dir.mkdir()
    cands, paths = [], []
    for i, frame in enumerate(candidates(posts, user)):
        resp = requests.get(frame["displayUrl"], timeout=60)
        if resp.ok:
            path = cand_dir / f"c{i:02d}.jpg"
            path.write_bytes(resp.content)
            cands.append(frame)
            paths.append(path)
    print(f"  · {len(paths)} fotos candidatas; Claude elige las que sirven…")

    for old in (folder / "photos").glob("ig-*.jpg"):
        old.unlink()
    ig_photos = []
    for n, pick in enumerate(curate(paths, raw.get("name", user))[:MAX_IG_PHOTOS], start=1):
        frame = cands[pick.index]
        dest = folder / "photos" / f"ig-{n}.jpg"
        shutil.copyfile(paths[pick.index], dest)
        ig_photos.append({
            "file": dest.name,
            "width": frame.get("dimensionsWidth"),
            "height": frame.get("dimensionsHeight"),
            "attribution": f"@{user} en Instagram",
            "source": "instagram",
            "subject": pick.subject,
            "alt": pick.alt,
            "caption": clean_caption(frame.get("_caption", ""), 200),
            "url": frame.get("_url"),
        })
        print(f"  ✓ {dest.name} [{pick.subject}] {pick.alt}")
    shutil.rmtree(cand_dir, ignore_errors=True)

    raw["instagram"] = {
        "username": user,
        "url": f"https://www.instagram.com/{user}/",
        "full_name": profile.get("fullName"),
        "bio": profile.get("biography"),
        "external_url": profile.get("externalUrl"),
        "category": profile.get("businessCategoryName"),
        "followers": profile.get("followersCount"),
        "posts_count": profile.get("postsCount"),
        "captions": [clean_caption(p.get("caption", "")) for p in posts if p.get("caption")][:12],
    }
    # Google suele guardar un usuario viejo: el perfil que sí existe pasa a ser el enlace de reservas.
    if not raw.get("website") or "instagram.com" in (raw.get("website") or ""):
        raw["website"] = raw["instagram"]["url"]
    # Fotos del negocio primero; las de clientes en Google completan el resto.
    google = [p for p in raw.get("photos", []) if p.get("source") != "instagram"]
    raw["photos"] = (ig_photos + google)[:MAX_TOTAL_PHOTOS]
    write_json(raw_path, raw)
    # La paleta depende de las fotos: se recalcula en el próximo build.
    (folder / "palette.json").unlink(missing_ok=True)
    print(f"✓ Instagram @{user}: {len(ig_photos)} fotos, {profile.get('followersCount')} seguidores → {raw_path}")
    return raw_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--user", help="Usuario de Instagram (si no, se toma del enlace en los datos de Google)")
    a = ap.parse_args()
    enrich(DATA_DIR / a.slug / "raw.json", a.user)
