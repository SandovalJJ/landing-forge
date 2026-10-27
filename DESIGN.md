---
name: landing-forge, «El muro de la casa»
description: The business's own salon wall, with its photographs hung in mismatched frames on its painted wall and its name lit in neon.
colors:
  wall: "#5c2a20"
  wall-deep: "#381711"
  neon: "#ff4fa3"
  gilt: "#b8912f"
  gilt-dark: "#7a5c16"
  gilt-light: "#d4b45c"
  brass: "#c9a24d"
  engrave: "#2e2108"
  frame: "#141010"
  plaster: "#f2efe9"
  chalk: "#d7c9c1"
  ink-body: "#3d342f"
  ink-meta: "#5a4f48"
  ink-star: "#8a6a1f"
  wood: "#2a1810"
  wood-highlight: "#4a2f1f"
typography:
  display:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "clamp(2.5rem, 5.2vw, 4.7rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "clamp(2rem, 3.8vw, 3.3rem)"
    fontWeight: 400
    lineHeight: 1.08
  title:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  body-lead:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  neon:
    fontFamily: "Yellowtail, Gloock, cursive"
    fontWeight: 400
    lineHeight: 1.1
  plaque:
    fontFamily: "Gloock, Georgia, serif"
    fontSize: "1.15rem"
    fontWeight: 400
    letterSpacing: "0.01em"
rounded:
  none: "0px"
  screw: "9999px"
spacing:
  frame-black: "9px"
  frame-gilt: "12px"
  mat: "clamp(10px, 1.6vw, 22px)"
  mat-gilt: "clamp(14px, 1.9vw, 26px)"
  gutter: "16px"
  gutter-sm: "32px"
  section: "56px"
  section-lg: "96px"
  container: "1360px"
components:
  plaque:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.engrave}"
    typography: "{typography.plaque}"
    rounded: "{rounded.none}"
    padding: "0 1.6rem"
    height: "3.25rem"
  plaque-line:
    backgroundColor: "transparent"
    textColor: "{colors.plaster}"
    rounded: "{rounded.none}"
    padding: "0 1.5rem"
    height: "3.25rem"
  plaque-line-hover:
    backgroundColor: "{colors.plaster}"
    textColor: "{colors.frame}"
  frame-black:
    backgroundColor: "{colors.frame}"
    rounded: "{rounded.none}"
  frame-mat:
    backgroundColor: "{colors.plaster}"
    textColor: "{colors.frame}"
    rounded: "{rounded.none}"
    padding: "{spacing.mat}"
  frame-gilt:
    backgroundColor: "{colors.gilt}"
    rounded: "{rounded.none}"
  label-card:
    backgroundColor: "{colors.plaster}"
    textColor: "{colors.frame}"
    rounded: "{rounded.none}"
    padding: "36px"
  tag:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.engrave}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  molding:
    backgroundColor: "{colors.wood}"
    rounded: "{rounded.none}"
    height: "16px"
    width: "100%"
  brick-wall:
    backgroundColor: "{colors.wall}"
---

# Design System: landing-forge, «El muro de la casa»

## Overview

**Creative North Star: "El muro de la casa"**

The page is the business's own salon wall. Every section is flat paint in the business's wall colour; on it hang the business's photographs in mismatched frames (gilt, matte black, plaster mats), museum wall labels beside them, brass plaques for labels and actions, and the business's name or key phrase lit as a neon sign. Nothing is a card on a canvas: everything is an object hung on a wall, so everything casts a soft shadow onto the paint and sits a little askew until the visitor reaches for it.

The world is per-business. Two tokens, **wall** and **neon**, are variable: they are resolved at build time from `data/<slug>/brand.json` (observed brand colours, which win) or from the automatic palette in `business.json`, and injected as `--c-wall` / `--c-neon` on `<html>`. The hex values in the frontmatter are the defaults and La Gatoria's values (`#5c2a20` brick, `#ff4fa3` pink). Every other material (gilt, brass, plaster, frame black, engrave) is fixed, because real frames and plaques look the same on any wall. **wall-deep** and **chalk** are derived from the wall by mixing, so they shift with it.

The wall has one optional second material. When `brand.json` sets `"wall_texture": "brick"`, the opening (hero) and the close sit on a drawn running-bond brick wall generated from the same wall colour, and a dark wood molding with a gilt fillet marks each place where brick meets the flat paint that carries the middle sections. Brick is drawn, not photographed: a vector tile of flat-toned bricks with flat edge strips, so it stays as flat as the paint. Without the flag the whole page is flat paint, exactly as before.

Density is gallery-like rather than grid-like: a 12-column container at 1360px with asymmetric spans, generous vertical rhythm, and photographs carrying the proof. This is the pipeline's default template. Two other templates render the same `business.json` but sit outside this system: «clasica» (the earlier pre-Impeccable template) and «cuarto-oscuro» (an unfinished experiment). Nothing here describes them.

**Key Characteristics:**
- Flat painted wall owns every section; depth comes from hung objects and their shadows, never gradients.
- Optional drawn brick (flag-driven) for the opening and the close, derived from the wall colour, divided from the paint by a wood-and-gilt molding.
- Three frame materials (gilt with flat gold rules, matte black, plaster mat) mixed on purpose, never uniform.
- Brass plaques with engraved dark text for primary actions, rating, and hours.
- One neon colour, used only as lit signage in Yellowtail script.
- Slight tilt at rest, straighten and lift on hover or focus; the neon ignites once on load.
- Square corners everywhere; the only round shapes are screw heads.

## Colors

A warm, single-wall palette: one variable paint, one variable light, and a fixed kit of frame and plaque metals.

### Primary
- **Wall Paint** (`wall`, variable, default brick): the background of the whole page and every section. Flat paint, never a gradient. Resolved per business.
- **Deep Wall** (`wall-deep`, derived as `color-mix(in oklab, wall 72%, black)`): the shadowed band behind reviews, the closing sign (flat-paint mode only; brick replaces it there), and the footer; also the scrollbar track.
- **Brick** (derived at build time from `wall`, not a fixed token): mortar at the wall hue with saturation x0.35 and lightness x0.55 (floor 8%); each brick a flat tone at lightness x0.8 to x1.08, hue within +/-4deg, saturation x0.85 to x1.15; a 2px top edge 4.5 points lighter and a 3px bottom edge 5 points darker.

### Secondary
- **Brass** (`brass`): plaques (primary action, rating, hours plate), menu tags, rating stars on the wall, and the focus ring.
- **Engrave** (`engrave`): text engraved into brass. Holds 6.5:1 on brass.
- **Gilt / Gilt Dark / Gilt Light** (`gilt`, `gilt-dark`, `gilt-light`): the gold frame, built from flat stepped rules; gilt-dark also borders the plaques and gilt is the scrollbar thumb. Gilt is the molding's top fillet and gilt-dark its bottom edge.
- **Wood / Wood Highlight** (`wood`, `wood-highlight`): the dark stained wood of the molding and its 3px inset top highlight. Fixed, like the other materials; used only on the molding.

### Tertiary
- **Neon** (`neon`, variable, default pink): only the light of a neon sign. Its tube core is rendered near-white (`color-mix(in oklab, neon 25%, white)`) with the neon colour as the halo; also the text-selection colour.

### Neutral
- **Plaster** (`plaster`): primary text on the wall, mats inside frames, wall labels, and the outline of secondary plaques.
- **Chalk** (`chalk`, derived as `color-mix(in oklab, plaster 82%, wall)`): secondary text on the wall (subheads, meta, nav). 7.2:1 on the default wall.
- **Frame Black** (`frame`): matte black frames, text on plaster, selection text.
- **Ink Body / Ink Meta / Ink Star** (`ink-body`, `ink-meta`, `ink-star`): body copy, captions, and stars on plaster surfaces (10.6:1, 6.9:1, 4.4:1 on plaster).

### Named Rules
**The Wall Owns Everything Rule.** Every section background is the wall, in one of two materials: flat paint (wall or wall-deep) everywhere, or, when the business opts in, drawn brick for the opening and the close with flat paint between. Light surfaces exist only as objects hung on it (mats, labels, framed notes), never as full-bleed bands.

**The One Light Rule.** Neon appears only as lit signage text (headline highlight, handle sign, story sign, closing line) and as selection. Never on buttons, borders, icons, or fills.

**The Variable Paint Rule.** Never hard-code a wall or neon value in a component; read `--c-wall` / `--c-neon` (or the derived tokens) so each business's colours land everywhere. The brick tile is the one build-time derivation: it is generated from the same resolved wall value, so it shifts with the business too.

## Typography

**Display Font:** Gloock (with Georgia, serif)
**Body Font:** Figtree Variable (with ui-sans-serif, system-ui)
**Neon Script:** Yellowtail (with Gloock, cursive)

**Character:** Gloock is the painted sign-writer's serif on the wall and the engraving on brass; Figtree is the quiet reading voice; Yellowtail exists only as bent neon tube.

### Hierarchy
- **Display** (400, clamp(2.5rem, 5.2vw, 4.7rem), 1.04): the hero headline painted on the wall; its highlight phrase switches to neon script at 1.18em.
- **Headline** (400, clamp(2rem, 3.8vw, 3.3rem), 1.08): section titles. Balanced wrapping.
- **Title** (400, 1.5rem to 1.875rem, tight): wall-label titles, menu items, the FAQ sign title; lead review quotes run larger in Gloock at clamp(1.6rem, 2.6vw, 2.3rem).
- **Body** (400, 1.0625rem, 1.6): base reading text; section intros step up to 1.125rem at 1.625, capped at 42 to 58ch. Pretty wrapping.
- **Label** (400 to 600, 0.875rem): captions, review authors and dates, address labels. Menu tags are 0.75rem, semibold, uppercase, wide tracking, on brass.
- **Neon** (400, sized per placement, 1.1 to 1.15): signage only; the Instagram handle sizes inversely to its length so it never breaks.

### Named Rules
**The Script Is Light Rule.** Yellowtail is used only with the neon treatment. Never set reading text, labels, or buttons in it.

**The Display Is One Weight Rule.** Gloock runs at 400 everywhere; hierarchy comes from size, not weight.

## Layout

A centred container (max 1360px, 16px gutters, 32px from `sm`) on a 12-column grid from `lg` (1024px). Spans are asymmetric (6/6 hero, 6+5 or 4+7 sections) and alternate sides down the page, like a hang rather than a stack. Sections breathe at 56px vertical padding, 96px from `lg`.

The salon hang is its own grid: 6 columns by 8 rows of 2.7rem on phones (three frames, so the place is visible in the first screen), 12 by 14 rows of 2.45rem on desktop (up to six frames of mixed size). Reviews hang as a lead framed quote plus a staggered two-column wall with uneven top offsets; on phones notes sit at 92% width alternating left and right. In brick mode the brick wraps the whole hero band and the whole closing section, full-bleed, tiled at 388x264px (four 92x28px bricks plus 5px mortar per course, eight courses, alternate courses offset half a brick, seams continuous); a molding sits directly below the hero and directly above the close. The footer stays wall-deep in both modes. The header is sticky, wall at 92% opacity with a light backdrop blur, and always keeps the Reservar plaque.

## Elevation & Depth

Depth is physical: the wall is flat and everything hung on it casts a soft, offset drop shadow downward onto the paint. There are no gradients and no floating surfaces without a shadow. Neon depth is light (a multi-layer text glow), not shadow.

### Shadow Vocabulary
- **Hung object** (`box-shadow: 0 22px 30px -14px rgb(0 0 0 / .6), 0 4px 8px -2px rgb(0 0 0 / .35)`): every frame.
- **Wall label** (`box-shadow: 0 14px 22px -12px rgb(0 0 0 / .55)`): plaster labels beside portraits.
- **Sign plate** (`box-shadow: 0 16px 26px -14px rgb(0 0 0 / .7)`): the dark acrylic plate behind a neon sign.
- **Plaque** (`box-shadow: inset 0 0 0 3px <brass lightened>, 0 10px 18px -8px rgb(0 0 0 / .6)`): brass plaques.
- **Neon glow** (`text-shadow` at 2px, 10px, 24px, 48px in the neon colour): lit signage.
- **Molding** (`box-shadow: inset 0 3px 0 wood-highlight, 0 10px 18px -6px rgb(0 0 0 / .65)`): the wood rail casts down onto the wall below it, stacked above the next section.

### Named Rules
**The Nothing Floats Rule.** Every object on the wall carries a soft drop shadow; a light surface without one reads as a card, which this world does not have.

**The Flat Gold Rule.** Gilt frames are built from flat stepped rules (inset and outset rings in gilt-dark and gilt-light), never gradients or bevel images.

**The Drawn Brick Rule.** Brick is a flat plane like the paint: per-brick flat tones with flat edge strips, drawn in vector from the wall colour. No gradients, no photographic or raster texture, no shadow cast by the brick itself.

## Shapes

Square corners throughout: frames, mats, plaques, tags, labels and the sign plate are all 0 radius. The only circles are the four screw heads on the sign plate. Frames rest tilted between about -2.6deg and +3.2deg (multiplied by 1.6 below 1024px so the tilt reads on a phone); large framed panels (menu, FAQ, map) tilt no more than 0.5deg. Thin 1px rules in frame black at 15% divide content inside mats; the menu uses dotted leaders. Bricks are square-cornered rectangles (92x28px) in running bond; about one in eight has a 9x6px chipped top corner showing mortar. The molding is a straight full-width rail.

## Components

### Buttons (Plaques)
- **Shape:** square (0), min height 3.25rem; compact 2.5rem in the header.
- **Primary (brass plaque):** brass fill, engrave text in Gloock 1.15rem, 1px gilt-dark border plus a lighter inner rule, plaque shadow. Hover lightens the brass 15% and lifts 1px (0.2s).
- **Secondary (plaque-line):** transparent, 1px plaster border at 55%, plaster semibold Figtree. Hover fills plaster with frame-black text.
- **Focus:** 2px brass outline, 4px offset (global).

### Frames (signature)
Photos are hung, never placed. Three materials: **gilt** (12px gilt border with stepped flat rules), **black** (9px matte frame), and either with a **plaster mat**. Mixed deliberately within any hang. Images fill with object-fit cover, respecting the photo's own ratio (4:5 default). Hover or focus within straightens to 0deg and lifts 4px over 0.6s `cubic-bezier(.16, 1, .3, 1)`. Matted frames also hold text: the menu, the FAQ sign, and framed review notes.

### Cards / Containers (Wall labels and notes)
- **Corner Style:** square.
- **Background:** plaster, frame-black text, ink tones for body and meta.
- **Shadow Strategy:** wall-label shadow, or the hung-object shadow when framed.
- **Internal Padding:** 28px, 36px from `sm`; framed notes 20px or the mat padding.
- Review notes are framed, star-rated in ink-star, and truncate long text into a native disclosure ("seguir leyendo").

### Neon sign (signature)
Yellowtail with the neon glow; on load it ignites once (1.6s stepped flicker, 0.4s delay, only when JS is present). It may sit straight on the wall or on a dark acrylic sign plate with four visible screws.

### Brass plates
The rating and the opening hours reuse the plaque material as plates; today's row is engraved bold.

### Brick wall (variable wall treatment)
Enabled per business by `"wall_texture": "brick"` in `data/<slug>/brand.json`. An SVG running-bond tile is generated from the resolved wall colour and applied as a repeating background on the hero band and the closing section; the flat wall colour sits under it as the fallback. The tile is deterministic, seeded from the business slug, so a business always gets the same wall and different businesses get different brick layouts as well as their own wall colour. Everything hung on the brick (frames, plaques, neon, text) keeps its normal treatment.

### Molding
A full-width dark wood rail, 16px, square: wood fill, 3px gilt top fillet, 2px gilt-dark bottom edge, 3px wood-highlight inset at the top, molding shadow. Decorative (hidden from assistive tech). It appears only in brick mode, exactly where brick meets flat paint.

### Navigation
Sticky wall-coloured bar, 64px. Business name in Gloock left; four chalk links (hover plaster and underline) from `lg`; compact brass Reservar plaque always visible.

## Do's and Don'ts

### Do:
- **Do** read wall and neon from `--c-wall` / `--c-neon` and derive deeper or lighter steps with `color-mix(in oklab, ...)`.
- **Do** hang every photograph in a frame, mixing gilt, black and matted frames, with a small rest tilt and the hung-object shadow.
- **Do** use the brass plaque for the primary action and the plaster outline plaque for the secondary one.
- **Do** keep the motion grammar to one ignition and one straighten; under reduced motion show the sign lit and frames still.
- **Do** quote reviews literally inside framed notes, with author and date beneath a 1px rule.
- **Do** enable brick only through the `wall_texture` flag, keep it to the opening and the close, and put a molding at every brick-to-paint edge.

### Don't:
- **Don't** use neon for anything but lit signage and selection.
- **Don't** set reading text, labels or buttons in Yellowtail.
- **Don't** round corners on frames, plaques, labels or tags.
- **Don't** build gilt from gradients or put gradients on the wall.
- **Don't** place a light surface on the wall without a drop shadow, or tile photos in rows of equal unframed cards.
- **Don't** hard-code a business's wall or neon hex in a component.
- **Don't** use a photographed or raster brick texture, or shade brick with gradients; generate it from the wall colour.
- **Don't** run brick behind the middle sections or butt brick against paint without a molding.
