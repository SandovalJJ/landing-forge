# landing-forge

Pipeline para generar landing pages premium de negocios locales a partir de su ficha de Google Maps.

```
Google Maps URL ─► scrape.py ─► data/<slug>/raw.json + photos/
                                   │
                    palette.py ◄───┤  (colorthief sobre la foto principal)
                  copywriter.py ◄──┘  (Claude, salida JSON validada con Pydantic)
                                   │
                     build.py ─► site/src/data/business.json ─► Astro + Tailwind ─► dist/<slug>/
```

## Requisitos

- Python 3.10+ y Node 22.12+ (Astro está fijado en 7.3.8; Astro 7.4 exige Node ≥ 22.23).
- Claves en `.env` (copia `.env.example`): `ANTHROPIC_API_KEY`, `GOOGLE_PLACES_API_KEY` (o `APIFY_TOKEN`).

```bash
pip install -r pipeline/requirements.txt
npm --prefix site install
```

## Uso: un solo comando

```bash
python pipeline/build.py --url "https://www.google.com/maps/place/La+Gatoria+Cat+Cafe/@6.2397395,-75.6022456,..."
python pipeline/build.py --name "La Gatoria Cat Cafe" --city Medellín
python pipeline/build.py --url "..." --provider apify
python pipeline/build.py --slug la-gatoria-cat-cafe --skip-scrape --skip-copy   # solo rehacer el sitio
```

Fuentes: Google Maps da reseñas, calificación, horarios y ubicación; Instagram (`pipeline/instagram.py`, vía Apify) da las fotos del propio negocio, su bio y su voz. Claude con visión elige entre las fotos de Instagram las limpias (sin flyers ni texto encima) y escribe su texto alternativo. El usuario de Instagram se toma del enlace que trae Google; si está desactualizado, pásalo con `--instagram <usuario>`. Usa `--no-instagram` para trabajar solo con Google.

Plantillas (`--template`): `muro` (por defecto: las fotos colgadas como el muro de cuadros del local, con su nombre en neón), `clasica` y `cuarto-oscuro` (experimental, sin terminar). Cada una sale en `dist/<slug>--<plantilla>/` (la clásica en `dist/<slug>/`). Para verla en local: `LF_TEMPLATE=muro npm --prefix site run dev`.

Colores de marca: si la paleta automática no captura la identidad del local, crea `data/<slug>/brand.json` con `{"wall": "#...", "neon": "#..."}` (p. ej. el ladrillo y el neón reales). Gana sobre la paleta automática.

El resultado queda en `dist/<slug>/` (HTML estático, listo para Netlify, Vercel, Cloudflare Pages o un hosting cualquiera).
Cada paso también funciona suelto: `scrape.py`, `palette.py <foto>`, `copywriter.py <raw.json>`.

Para editar a mano antes de entregar: corrige `data/<slug>/copy.json` o `palette.json` y vuelve a ejecutar con `--skip-scrape --skip-copy`.

## Módulos

| Archivo | Qué hace |
|---|---|
| `pipeline/scrape.py` | Places API (New) `searchText` con sesgo por coordenadas del enlace; descarga hasta 8 fotos a 2400 px; elige las 5 reseñas mejor calificadas con más contenido. Alternativa: actor `compass/crawler-google-places` de Apify. |
| `pipeline/palette.py` | Extrae 8 colores con colorthief y elige como acento el más saturado; arma tokens (`bg`, `surface`, `ink`, `muted`, `border`, `accent`…) tintados con ese tono y oscurece el acento hasta que pase 3:1 de contraste WCAG. |
| `pipeline/copywriter.py` | `claude-opus-5-5` + `messages.parse` con un esquema Pydantic. El prompt obliga a anclar cada afirmación en datos/reseñas y prohíbe clichés; si aparece alguno, se regenera una vez. |
| `pipeline/build.py` | Orquesta todo, copia las fotos a `site/public/business/photos`, compila y copia a `dist/<slug>`. |
| `site/` | Astro + Tailwind v4. Todos los colores son variables CSS inyectadas desde `business.json`. |

## Decisiones de diseño (anti "look de IA")

- **Nada de texto centrado sobre foto.** Hero en grid 7/5: texto a la izquierda, composición asimétrica de dos fotos + tarjeta de reseña flotante a la derecha.
- Secciones con layouts distintos entre sí: bento (propuesta de valor), lista editorial con columna sticky (servicios), marquesina infinita (reseñas), mosaico irregular + FAQ (historia), mapa + horario con el día actual resaltado (visita).
- Tarjetas `spotlight` (borde y halo que siguen al cursor, estilo Aceternity), bordes de 1 px, tipografías Plus Jakarta Sans (títulos) + Inter (texto), servidas localmente con Fontsource.
- Cada pilar de la propuesta de valor lleva una cita literal de una reseña como evidencia.
- Respeta `prefers-reduced-motion`; JSON-LD `LocalBusiness` para SEO local.

## Demo incluida

`data/_demo-la-gatoria/` (apartada para que no se mezcle con una ejecución real) trae datos parciales copiados a mano de la ficha pública (calificación, dirección, 2 reseñas), un `copy.json` de ejemplo escrito a mano y **fotos placeholder en SVG**. Con tus claves, el comando de arriba lo reemplaza todo con datos reales.

> Las fotos y reseñas de Google tienen condiciones de uso (atribución, caché). Antes de vender un sitio, usa fotos propias del negocio o confirma que cumples las políticas de Google Maps Platform.
