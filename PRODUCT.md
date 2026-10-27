# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Buyer:** the owner of a local business (café, restaurant, shop) in Latin America who has a Google Maps listing and, typically, only an Instagram account instead of a website. They see a finished demo of their own site and decide whether to buy it.
- **End visitor:** the business's future customers, who land on the site from Google, Instagram or a shared link, mostly on a phone.

## Product Purpose

landing-forge turns a Google Maps listing into a finished, sellable landing page: it scrapes the listing (Google Places or Apify), writes the copy with Claude from what reviews actually praise, extracts a palette from the business's photos, and builds a static Astro site into `dist/<slug>/`. Success: the owner recognizes their own place in the demo immediately and buys it.

## Positioning

Every site is built from the business's own evidence (its photos, its reviews quoted literally, its hours and address) rather than template filler. A competing template builder starts from stock photos and generic copy; this starts from the place itself.

## Operating Context

- One command per business: `python pipeline/build.py --url <maps url> [--provider apify]`.
- All page content arrives through one data file, `site/src/data/business.json` (business facts, photos, palette tokens, copy). Templates must render any business from that file alone.
- The demo is shown to the owner before purchase, usually on their phone, sometimes as a link sent over WhatsApp or Instagram.

## Capabilities and Constraints

- Multiple visual templates over the same data are a goal; the original template (`site/src/pages/index.astro` and its components) stays available.
- Photo count, aspect ratios and quality vary per business (Google/Apify user photos: 600–2400 px, mixed orientation). Hours may be missing. Reviews: up to 5.
- Static output only; no backend. Reservations happen off-site (phone, Instagram, WhatsApp).
- Content language: Spanish (Colombia) by default.

## Brand Commitments

- Each site must carry the business's own visual identity as it actually exists: drawn from its photos and physical space (for La Gatoria: brick walls, pink neon sign, framed cat portraits, "La Casa de los Gatos"), never a generic theme layered on top.
- No invented logos, claims, prices, awards or testimonials.

## Evidence on Hand

- Real scraped data for La Gatoria Cat Cafe in `data/la-gatoria-cat-cafe/` (8 photos, 5 reviews, hours, Instagram, 4.7★ / 2,214 reviews) and Claude-written copy grounded in those reviews.
- Google Maps photo/review reuse is subject to Google's terms; owners should eventually supply their own photos.

## Product Principles

1. The place is the brand: identity comes from the business's own photos and space.
2. Evidence over adjectives: quote real reviews, show real hours, never fabricate.
3. One data file, many looks: templates are interchangeable renderers of the same JSON.
4. The demo must sell itself to the owner within the first screen on a phone.
