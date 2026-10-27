"""Módulo 1 — Data Scraper.

Extrae de Google Places (API "New") o de Apify los datos de un negocio y los
normaliza a data/<slug>/raw.json, descargando las fotos a data/<slug>/photos/.

    python pipeline/scrape.py --url "https://www.google.com/maps/place/..."
    python pipeline/scrape.py --name "La Gatoria Cat Cafe" --city "Medellín"
    python pipeline/scrape.py --url "..." --provider apify
"""
from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote_plus

import requests

from common import business_dir, env, slugify, write_json

PLACES_SEARCH = "https://places.googleapis.com/v1/places:searchText"
PLACES_MEDIA = "https://places.googleapis.com/v1/{name}/media"
APIFY_ACTOR = "https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items"

FIELD_MASK = ",".join(
    f"places.{f}"
    for f in [
        "id", "displayName", "formattedAddress", "shortFormattedAddress", "location",
        "rating", "userRatingCount", "primaryTypeDisplayName", "types",
        "regularOpeningHours", "nationalPhoneNumber", "internationalPhoneNumber",
        "websiteUri", "googleMapsUri", "editorialSummary", "priceLevel",
        "reviews", "photos",
    ]
)

MAX_PHOTOS = 8
PHOTO_WIDTH = 2400
TOP_REVIEWS = 5


@dataclass
class Query:
    name: str
    city: str | None = None
    lat: float | None = None
    lng: float | None = None
    url: str | None = None

    @property
    def text(self) -> str:
        return f"{self.name}, {self.city}" if self.city else self.name


def parse_maps_url(url: str) -> Query:
    """Saca nombre y coordenadas de un enlace de Google Maps /maps/place/..."""
    name_match = re.search(r"/maps/place/([^/@]+)", url)
    if not name_match:
        raise SystemExit("No reconozco ese enlace de Google Maps (esperaba /maps/place/<nombre>/...)")
    name = unquote_plus(name_match.group(1))
    # !3d<lat>!4d<lng> es la coordenada exacta del pin; @lat,lng es solo el centro del mapa.
    pin = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url)
    center = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
    coords = pin or center
    lat, lng = (float(coords.group(1)), float(coords.group(2))) if coords else (None, None)
    return Query(name=name, lat=lat, lng=lng, url=url)


def pick_best_reviews(reviews: list[dict], limit: int = TOP_REVIEWS) -> list[dict]:
    """Las 'mejores' = mayor calificación y, a igualdad, las que más dicen."""
    usable = [r for r in reviews if len(r.get("text", "").strip()) >= 40]
    usable.sort(key=lambda r: (r.get("rating") or 0, min(len(r["text"]), 600)), reverse=True)
    return usable[:limit]


DAY_INDEX = {
    **{d: i for i, d in enumerate(["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"])},
    **{d: i for i, d in enumerate(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])},
}
DAY_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


def normalize_hours(hours: list[dict]) -> list[dict]:
    """Lunes primero (el sitio resalta el día por posición) y texto en español."""
    out = []
    for h in hours:
        idx = DAY_INDEX.get(h["day"].strip().lower())
        if idx is None:
            return hours  # formato desconocido: mejor dejarlo tal cual que romperlo
        text = re.sub(r"[  ]", " ", h["hours"])
        text = re.sub(r"\s+to\s+|\s*[–-]\s*", " – ", text)
        text = text.replace("AM", "a. m.").replace("PM", "p. m.")
        text = re.sub(r"(?i)^closed$", "Cerrado", text)
        text = re.sub(r"(?i)^open 24 hours$", "Abierto 24 horas", text)
        out.append({"day": DAY_ES[idx], "hours": text, "_i": idx})
    return [{"day": h["day"], "hours": h["hours"]} for h in sorted(out, key=lambda h: h["_i"])]


def download(url: str, dest: Path, params: dict | None = None) -> Path:
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()
    ext = ".png" if "png" in resp.headers.get("content-type", "") else ".jpg"
    dest = dest.with_suffix(ext)
    dest.write_bytes(resp.content)
    return dest


# ---------------------------------------------------------------- Google Places

def scrape_google(q: Query, lang: str) -> tuple[dict, list[dict]]:
    key = env("GOOGLE_PLACES_API_KEY")
    body: dict = {"textQuery": q.text, "languageCode": lang, "pageSize": 1}
    if q.lat is not None:
        body["locationBias"] = {"circle": {"center": {"latitude": q.lat, "longitude": q.lng}, "radius": 300.0}}
    resp = requests.post(
        PLACES_SEARCH,
        json=body,
        headers={"X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK},
        timeout=30,
    )
    if not resp.ok:
        err = resp.json().get("error", {}) if "json" in resp.headers.get("content-type", "") else {}
        raise SystemExit(f"Google Places {resp.status_code} {err.get('status', '')}: {err.get('message', resp.text[:300])}")
    places = resp.json().get("places") or []
    if not places:
        raise SystemExit(f"Google Places no encontró '{q.text}'")
    p = places[0]

    hours = []
    for line in (p.get("regularOpeningHours") or {}).get("weekdayDescriptions", []):
        day, _, value = line.partition(": ")
        hours.append({"day": day.strip().capitalize(), "hours": value.strip()})

    reviews = [
        {
            "author": (r.get("authorAttribution") or {}).get("displayName", "Cliente"),
            "rating": r.get("rating"),
            "text": (r.get("originalText") or r.get("text") or {}).get("text", ""),
            "when": r.get("relativePublishTimeDescription", ""),
        }
        for r in p.get("reviews", [])
    ]

    facts = {
        "source": "google_places",
        "place_id": p.get("id"),
        "name": p["displayName"]["text"],
        "category": (p.get("primaryTypeDisplayName") or {}).get("text", ""),
        "types": p.get("types", []),
        "rating": p.get("rating"),
        "review_count": p.get("userRatingCount"),
        "address": p.get("formattedAddress"),
        "short_address": p.get("shortFormattedAddress"),
        "phone": p.get("nationalPhoneNumber"),
        "phone_intl": p.get("internationalPhoneNumber"),
        "website": p.get("websiteUri"),
        "maps_url": p.get("googleMapsUri") or q.url,
        "location": {"lat": p["location"]["latitude"], "lng": p["location"]["longitude"]},
        "summary": (p.get("editorialSummary") or {}).get("text", ""),
        "price_level": p.get("priceLevel"),
        "hours": hours,
        "reviews": pick_best_reviews(reviews),
    }

    def fetch_photo(photo: dict, dest: Path) -> Path:
        return download(
            PLACES_MEDIA.format(name=photo["name"]),
            dest,
            params={"maxWidthPx": PHOTO_WIDTH, "key": key},
        )

    photos = [
        {
            "fetch": fetch_photo,
            "ref": ph,
            "width": ph.get("widthPx"),
            "height": ph.get("heightPx"),
            "attribution": ", ".join(a.get("displayName", "") for a in ph.get("authorAttributions", [])),
        }
        for ph in p.get("photos", [])[:MAX_PHOTOS]
    ]
    return facts, photos


# ---------------------------------------------------------------------- Apify

def scrape_apify(q: Query, lang: str) -> tuple[dict, list[dict]]:
    token = env("APIFY_TOKEN")
    payload = {
        "language": lang,
        "maxImages": MAX_PHOTOS,
        "maxReviews": 30,
        "reviewsSort": "highestRanking",
        "maxCrawledPlacesPerSearch": 1,
    }
    if q.url:
        payload["startUrls"] = [{"url": q.url}]
    else:
        payload["searchStringsArray"] = [q.text]
    resp = requests.post(APIFY_ACTOR, params={"token": token}, json=payload, timeout=600)
    resp.raise_for_status()
    items = resp.json()
    if not items:
        raise SystemExit(f"Apify no devolvió resultados para '{q.text}'")
    p = items[0]

    reviews = [
        {
            "author": r.get("name", "Cliente"),
            "rating": r.get("stars"),
            "text": r.get("text") or "",
            "when": r.get("publishAt", ""),
        }
        for r in p.get("reviews", [])
    ]
    facts = {
        "source": "apify",
        "place_id": p.get("placeId"),
        "name": p.get("title"),
        "category": p.get("categoryName", ""),
        "types": p.get("categories", []),
        "rating": p.get("totalScore"),
        "review_count": p.get("reviewsCount"),
        "address": p.get("address"),
        "short_address": p.get("street"),
        "phone": p.get("phone"),
        "phone_intl": p.get("phoneUnformatted"),
        "website": p.get("website"),
        "maps_url": p.get("url") or q.url,
        "location": p.get("location"),
        "summary": p.get("description") or "",
        "price_level": p.get("price"),
        "hours": [{"day": h.get("day", "").capitalize(), "hours": h.get("hours", "")} for h in p.get("openingHours", [])],
        "reviews": pick_best_reviews(reviews),
    }
    photos = [
        {"fetch": lambda ref, dest: download(ref, dest), "ref": url, "width": None, "height": None, "attribution": "Google Maps"}
        for url in (p.get("imageUrls") or [])[:MAX_PHOTOS]
    ]
    return facts, photos


# ----------------------------------------------------------------------- main

def scrape(q: Query, provider: str = "google", lang: str = "es") -> Path:
    facts, photos = (scrape_google if provider == "google" else scrape_apify)(q, lang)
    facts["hours"] = normalize_hours(facts["hours"])
    if q.city:
        facts["city"] = q.city
    slug = slugify(facts["name"])
    out = business_dir(slug)

    saved = []
    for i, ph in enumerate(photos, start=1):
        try:
            path = ph["fetch"](ph["ref"], out / "photos" / f"photo-{i}")
        except requests.HTTPError as exc:
            print(f"  ! foto {i} omitida: {exc}")
            continue
        saved.append({"file": path.name, "width": ph["width"], "height": ph["height"], "attribution": ph["attribution"]})
        print(f"  ✓ foto {i} → {path.name}")

    facts["slug"] = slug
    facts["photos"] = saved
    raw_path = out / "raw.json"
    write_json(raw_path, facts)
    print(f"✓ {facts['name']} ({facts['rating']}★, {facts['review_count']} reseñas) → {raw_path}")
    return raw_path


def query_from_args(args: argparse.Namespace) -> Query:
    if args.url:
        q = parse_maps_url(args.url)
        q.city = args.city
        return q
    if not args.name:
        raise SystemExit("Usa --url o --name (+ --city)")
    return Query(name=args.name, city=args.city)


def add_query_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--url", help="Enlace de Google Maps del negocio")
    parser.add_argument("--name", help="Nombre del negocio")
    parser.add_argument("--city", help="Ciudad (mejora la búsqueda)")
    parser.add_argument("--provider", choices=["google", "apify"], default="google")
    parser.add_argument("--lang", default="es")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_query_args(ap)
    a = ap.parse_args()
    scrape(query_from_args(a), a.provider, a.lang)
