"""Shared paths, env loading and small helpers."""
from __future__ import annotations

import json
import os
import re
import unicodedata
from pathlib import Path

import truststore
from dotenv import load_dotenv

# Usa el almacén de certificados del sistema (Windows/macOS): así funcionan los
# antivirus o proxies corporativos que inspeccionan HTTPS con su propia CA.
truststore.inject_into_ssl()

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
SITE_DIR = ROOT / "site"
DIST_DIR = ROOT / "dist"

load_dotenv(ROOT / ".env")


def env(name: str, required: bool = True) -> str | None:
    value = os.getenv(name)
    if required and not value:
        raise SystemExit(f"Falta la variable de entorno {name} (ponla en .env)")
    return value


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def business_dir(slug: str) -> Path:
    path = DATA_DIR / slug
    (path / "photos").mkdir(parents=True, exist_ok=True)
    return path


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
