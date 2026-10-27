"""Módulo 2 — AI Copywriter (Claude).

Lee data/<slug>/raw.json y escribe data/<slug>/copy.json con todo el texto del
sitio. La propuesta de valor sale de lo que más repiten las reseñas, no de
adjetivos genéricos.

    python pipeline/copywriter.py data/la-gatoria-cat-cafe/raw.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import anthropic
from pydantic import BaseModel, Field

from common import read_json, write_json

MODEL = "claude-opus-5-5"

# Frases que delatan texto de plantilla/IA. Si aparecen, se pide una reescritura.
BANNED = [
    "experiencia única", "experiencia inolvidable", "en el corazón de", "sumérgete",
    "descubre", "no te lo puedes perder", "calidad y servicio", "pasión por",
    "un oasis", "una joya escondida", "te invitamos a", "ven y disfruta",
    "más que un", "el lugar perfecto", "eleva tu", "deleita tus sentidos",
    "unique experience", "nestled", "look no further", "elevate", "delve",
]


class Hero(BaseModel):
    eyebrow: str = Field(description="2-5 palabras: categoría + barrio/ciudad. Sin emojis.")
    headline: str = Field(description="Gancho de máx. 9 palabras. Concreto, específico de ESTE negocio.")
    headline_highlight: str = Field(description="Fragmento literal del headline (1-3 palabras) que irá resaltado en color.")
    subheadline: str = Field(description="1-2 frases, máx. 30 palabras. Qué es, para quién y por qué venir.")
    primary_cta: str = Field(description="Verbo + objeto, máx. 3 palabras (p. ej. 'Reservar mesa').")
    secondary_cta: str = Field(description="Máx. 3 palabras, acción secundaria (p. ej. 'Cómo llegar').")


class Pillar(BaseModel):
    title: str = Field(description="Máx. 5 palabras.")
    body: str = Field(description="1-2 frases concretas.")
    evidence_quote: str = Field(description="Cita LITERAL y corta (máx. 18 palabras) de una reseña que respalda este pilar.")
    evidence_author: str


class ValueProposition(BaseModel):
    title: str = Field(description="La razón #1 por la que la gente vuelve, según las reseñas. Máx. 8 palabras.")
    body: str = Field(description="2-3 frases.")
    pillars: list[Pillar] = Field(description="Exactamente 3 pilares, ordenados por cuántas reseñas los mencionan.")


class Service(BaseModel):
    name: str
    description: str = Field(description="1-2 frases, máx. 28 palabras. Detalles sensoriales o prácticos reales.")
    tag: str = Field(description="Etiqueta corta (1-2 palabras) o cadena vacía.")


class Faq(BaseModel):
    question: str
    answer: str


# Se genera en dos llamadas: con el esquema completo de una vez, el modelo a menudo
# dejaba la segunda mitad con relleno ("x"). Cada parte se valida por separado.
class CoreCopy(BaseModel):
    hero: Hero
    value_proposition: ValueProposition
    services_title: str
    services_intro: str
    services: list[Service] = Field(description="Entre 3 y 6 servicios/productos inferidos de la categoría y las reseñas.")


class ExtraCopy(BaseModel):
    story_title: str
    story_body: str = Field(description="Párrafo de 50-80 palabras sobre el negocio. Sin inventar fechas ni fundadores.")
    reviews_title: str
    reviews_intro: str
    faq: list[Faq] = Field(description="3-4 preguntas prácticas que un cliente nuevo se haría (reservas, precios, mascotas, horario...).")
    visit_title: str
    visit_note: str = Field(description="Una frase práctica para la visita (reservar, llegar temprano, etc.) basada en reseñas.")
    closing_title: str = Field(description="Título del CTA final, máx. 8 palabras.")
    closing_body: str
    seo_title: str = Field(description="Máx. 60 caracteres.")
    seo_description: str = Field(description="Máx. 155 caracteres.")


class SiteCopy(CoreCopy, ExtraCopy):
    pass


SYSTEM = """Eres un copywriter senior que escribe sitios web para negocios locales reales.
Escribes como alguien del barrio que conoce el lugar, no como una agencia.

Reglas:
- Todo lo que afirmes debe poder rastrearse a los datos o reseñas que te paso. No inventes premios,
  años de fundación, nombres de dueños, precios ni platos que no aparezcan.
- Si las reseñas mencionan algo negativo recurrente (p. ej. precio alto, hay que reservar), conviértelo
  en información útil y honesta (p. ej. en la FAQ o la nota de visita), nunca lo escondas ni lo niegues.
- Frases cortas. Verbos concretos. Sustantivos específicos (el plato, el gato, la calle) en lugar de
  adjetivos ('increíble', 'único', 'excepcional').
- Prohibido: {banned}. Tampoco uses signos de exclamación en títulos, ni la estructura 'No es solo un café, es un hogar',
  ni enumeraciones de tres adjetivos.
- Idioma de salida: {lang}. Tutea si el idioma es español de Colombia o similar.
- No asumas el género de quien lee: evita 'tú misma', 'bienvenida', 'listo/lista'; reformula la frase.
"""


def build_prompt(raw: dict) -> str:
    facts = {k: raw.get(k) for k in [
        "name", "category", "types", "rating", "review_count", "address", "city",
        "summary", "price_level", "hours", "website",
    ]}
    reviews = "\n\n".join(
        f"[{r.get('rating')}★] {r['author']}: {r['text']}" for r in raw.get("reviews", [])
    )
    ig = raw.get("instagram") or {}
    instagram = ""
    if ig:
        captions = "\n- ".join(c for c in ig.get("captions", []) if c)
        instagram = (
            f"<instagram usuario=\"@{ig.get('username')}\" seguidores=\"{ig.get('followers')}\">\n"
            f"Bio: {ig.get('bio') or ''}\n"
            f"Textos recientes del propio negocio (su voz; úsalos para nombres, actividades y tono, "
            f"no como prueba de calidad):\n- {captions}\n</instagram>\n\n"
        )
    return (
        "<negocio>\n" + json.dumps(facts, ensure_ascii=False, indent=2) + "\n</negocio>\n\n"
        "<resenas>\n" + reviews + "\n</resenas>\n\n"
        + instagram +
        "Primero identifica qué elogian las reseñas con más frecuencia; esa es la propuesta de valor. "
        "Luego escribe el contenido siguiendo el esquema."
    )


def find_cliches(part: BaseModel) -> list[str]:
    text = part.model_dump_json().lower()
    return [b for b in BANNED if re.search(rf"\b{re.escape(b)}\b", text)]


OPTIONAL_FIELDS = {"tag", "headline_highlight"}
MIN_ITEMS = {"faq": 3, "services": 3}


def find_gaps(part: BaseModel) -> list[str]:
    """Campos vacíos o de relleno ('x', '...'): el esquema los acepta pero el sitio quedaría roto."""
    gaps: list[str] = []

    def walk(value, path: str) -> None:
        if isinstance(value, dict):
            for k, v in value.items():
                walk(v, f"{path}.{k}" if path else k)
        elif isinstance(value, list):
            if path in MIN_ITEMS and len(value) < MIN_ITEMS[path]:
                gaps.append(f"{path} (mínimo {MIN_ITEMS[path]})")
            for i, v in enumerate(value):
                walk(v, f"{path}[{i}]")
        elif isinstance(value, str) and path.rsplit(".", 1)[-1] not in OPTIONAL_FIELDS:
            if len(value.strip(" .x-_")) < 3:
                gaps.append(path)

    walk(part.model_dump(), "")
    if isinstance(part, CoreCopy) and len(part.value_proposition.pillars) != 3:
        gaps.append("value_proposition.pillars (exactamente 3)")
    return gaps


def ask[T: BaseModel](client: anthropic.Anthropic, system: str, prompt: str, schema: type[T]) -> T:
    """Una llamada con salida estructurada, regenerando si hay clichés o campos de relleno."""
    content = prompt
    for attempt in range(3):
        try:
            response = client.messages.parse(
                model=MODEL,
                max_tokens=16000,
                system=system,
                messages=[{"role": "user", "content": content}],
                output_format=schema,
                output_config={"effort": "high"},
            )
        except anthropic.RateLimitError:
            raise SystemExit("Límite de tasa de la API de Claude; reintenta en un minuto.")
        except anthropic.APIStatusError as exc:
            raise SystemExit(f"Error de la API de Claude ({exc.status_code}): {exc.message}")

        if response.stop_reason == "refusal":
            raise SystemExit("Claude rechazó generar este contenido; revisa los datos de entrada.")
        if response.stop_reason == "max_tokens" or response.parsed_output is None:
            raise SystemExit("La respuesta salió incompleta; vuelve a ejecutar.")

        part = response.parsed_output
        hits, gaps = find_cliches(part), find_gaps(part)
        if not hits and not gaps:
            return part
        if attempt == 2:
            raise SystemExit(f"{schema.__name__} sigue incompleto tras 3 intentos: clichés={hits} vacíos={gaps}")
        print(f"  ↻ {schema.__name__}: clichés {hits} / campos vacíos {gaps}, regenerando…")
        feedback = []
        if hits:
            feedback.append(f"Un borrador anterior usó {', '.join(hits)}; no los uses.")
        if gaps:
            feedback.append(f"Un borrador anterior dejó vacíos o con relleno: {', '.join(gaps)}. Escribe todos los campos con contenido real.")
        # Petición nueva (no seguimos la conversación): más barato y sin arrastrar el borrador.
        content = prompt + "\n\n" + " ".join(feedback)
    raise AssertionError("unreachable")


def generate_copy(raw_path: Path, lang: str = "es") -> Path:
    raw = read_json(raw_path)
    client = anthropic.Anthropic()
    system = SYSTEM.format(banned=", ".join(f"'{b}'" for b in BANNED), lang=lang)
    base = build_prompt(raw)

    core = ask(client, system, base + "\n\nEn esta parte escribe: hero, propuesta de valor y servicios.", CoreCopy)
    extra = ask(
        client,
        system,
        base
        + "\n\n<ya_escrito>\n" + core.model_dump_json(indent=2) + "\n</ya_escrito>\n\n"
        + "Ya está escrita la parte superior del sitio (arriba). Ahora escribe el resto: historia, reseñas, "
        "FAQ, visita, cierre y SEO. Mantén el mismo tono y no repitas frases de la parte ya escrita.",
        ExtraCopy,
    )
    copy = SiteCopy(**core.model_dump(), **extra.model_dump())

    # El resaltado debe existir literalmente en el titular, o el sitio no lo podrá pintar.
    if copy.hero.headline_highlight not in copy.hero.headline:
        copy.hero.headline_highlight = ""

    out = raw_path.with_name("copy.json")
    write_json(out, copy.model_dump())
    print(f"✓ copy → {out}")
    return out


if __name__ == "__main__":
    generate_copy(Path(sys.argv[1]))
