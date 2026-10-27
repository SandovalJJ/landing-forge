# La Gatoria · scroll-world

Landing de La Gatoria Cat Cafe con el recorrido por la casa como hero: al hacer scroll, la cámara camina por 7 paradas reales del local. Sigue el sistema «El muro de la casa» (`DESIGN.md` de la raíz).

HTML estático, sin build: sirve la carpeta tal cual (Netlify, Vercel, Cloudflare Pages o cualquier hosting).

```bash
python -m http.server 8765    # y abre http://127.0.0.1:8765/
```

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Generado por `tools/build-html.mjs` desde `data/la-gatoria-cat-cafe/raw.json` (reseñas literales, horario, contacto). No editar a mano. |
| `assets/css/site.css` | Estilos del muro y del recorrido. |
| `assets/css/brick.css` | Ladrillo SVG generado por `tools/brick.mjs` con `site/src/lib/brick.ts` (misma pared y semilla que la plantilla «muro»). |
| `assets/js/world.js` | Motor del recorrido (adaptado del engine de la skill scroll-world). |
| `assets/video/clip-k.mp4` | Tramo de la parada k-1 a la k. Escritorio: 1280×720, 24 fps, GOP 6, crf 20, sin audio, faststart. |
| `assets/video/clip-k-m.mp4` | Móvil: recorte 9:16 a 720×1280, GOP 4, que desplaza el encuadre de una parada a la otra. |
| `assets/stills/stop-i(-m).webp` | Fotograma real de cada parada (primer fotograma del clip siguiente; la parada 6 es el último de clip-6). |
| `_source/` | Originales de Kling (720p) y lienzos 16:9 por parada. Ignorado por git; guárdalo aparte. |

## Paradas

| # | Parada | Foto original | Centro del recorte móvil |
|---|---|---|---|
| 0 | Fachada de noche | lagatoria_4 | 0.44 |
| 1 | Pasillo con gatos | lagatoria_5 | 0.47 |
| 2 | Pared CAT HOME | lagatoria_7 | 0.53 |
| 3 | Galería de retratos | lagatoria_12 | 0.52 |
| 4 | Repisas y gatito en su caja | lagatoria_9 | 0.38 |
| 5 | Comedor gris | lagatoria_3 | 0.50 |
| 6 | Gata calicó en la mesa | lagatoria_6 | 0.53 |

## Regenerar

```bash
node tools/brick.mjs        # ladrillo
node tools/build-html.mjs   # index.html desde raw.json
```

Para recodificar un clip o cambiar un encuadre móvil, parte de `_source/kling/clip-k.mp4` con los parámetros de la tabla de arriba y vuelve a extraer los stills de sus dos paradas.

## Pendiente del negocio

- Fotos limpias de platos (no se generan con IA).
- Fotos sueltas de los gatos para la galería.
- Confirmar si el teléfono es WhatsApp.
- Logo vectorial, si lo tienen.
