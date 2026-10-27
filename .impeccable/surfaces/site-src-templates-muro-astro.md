---
version: 1
slug: "site-src-templates-muro-astro"
primary_target: "site/src/templates/Muro.astro"
related_targets: []
---

# Surface brief: plantilla «El muro de la casa»

Scope: third landing-page template for landing-forge (`--template muro`), rendered from `site/src/data/business.json` alone. Visitor mode: Persuade. The owner sees the demo first, usually on a phone; end visitors are the business's customers.

Data: Google Maps supplies reviews, rating, hours, location; Instagram supplies the business's own photos (curated by Claude vision, with Spanish alt text), bio, voice and the live reservation profile. Optional `data/<slug>/brand.json` pins observed brand colours (wall, neon) over the automatic palette.

Action: reserve (the business's real channel: Instagram/WhatsApp/phone) and get directions. Proof: the business's photos hung as its own wall, literal review quotes, rating, hours, Instagram following.

Constraints: works for any business (2–12 photos, mostly 4:5 portrait from Instagram, 0–5 reviews, hours may be missing). No invented claims.

## Direction contract

THESIS: The page is the business's own salon wall: its photographs hung in mismatched frames on its painted wall, with its name lit as a neon sign. It refuses the restaurant-landing default of a photo hero, a centred headline and rows of equal cards.

OWN-WORLD: Committed colour: the wall (brick #5c2a20 family, from brand.json or derived) owns every section as flat paint. Frames: gilt #b8912f with darker gold inner rules, matte black #141010, plaster-white mats #f2efe9. Brass plaques #c9a24d with engraved dark text for labels and primary actions. One neon colour (pink #ff4fa3 for La Gatoria) used only for lit signage, glowing on the wall. Type: Gloock for display and plaques, Figtree for reading text, Yellowtail only as neon script. Offset soft drop shadows under every hung object; nothing floats without a shadow.

STORY: The owner recognises their own wall and sign in one glance, reads what guests actually say framed beside the photos, and taps the brass "Reservar" plaque.

FIRST VIEWPORT: Desktop: left 6 columns, the headline painted on the wall in Gloock with the highlight lit in neon script, subheadline, brass primary action and outlined secondary; right 6 columns, a salon hang of 5–6 frames of mixed size and frame type, one tilted. Phone: neon headline, then a three-frame hang so the place is visible in the first screen, then actions; sticky header keeps "Reservar".

FORM: User-pinned direction: the IMPECCABLE'S PICK card «El muro de la casa» from direction round seed:969e441d33624e0b (the user first adopted the darkroom challenger, then switched to this card in chat). Signature interaction: the neon sign ignites once on load with a short flicker; hung frames sit slightly askew and straighten and lift on hover or focus. Motion grammar: one ignition, one straighten; reduced motion shows the sign lit and frames still.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Amendment (user-approved, after ship)
The user asked for a literal brick wall in parts, designed rather than taken from photos (photo quality too low). Change: with `brand.json` `"wall_texture": "brick"`, the hero and the closing sit on an SVG-drawn running-bond brick wall generated from the wall colour (per-brick flat tones, light top edge, dark bottom edge, occasional chipped corner, seeded per business). A dark wood molding with a gilt fillet marks where the brick ends and the flat painted wall continues for the middle sections. Without the flag the whole page stays flat paint.

## Section plan
- Hero wall (salon hang + neon headline + plaques).
- Por qué volver: three framed portraits, each with a museum wall label (title, body, literal review quote) set beside it, alternating sides and frame types.
- La carta: one large gilt-framed menu card with dotted leaders and brass tags.
- Lo que dicen: rating on a brass plaque, reviews as framed notes hung in a staggered column wall.
- En Instagram: neon handle sign, follower count, link.
- Reglas de la casa: story plaque + FAQ as a framed house-rules sign.
- Visítanos: framed map, hours on a brass plate with today engraved darker, address.
- Cierre: large neon sign line + plaques.
