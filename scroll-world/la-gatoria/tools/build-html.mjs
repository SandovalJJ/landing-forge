// Genera index.html de la landing scroll-world de La Gatoria a partir de
// data/la-gatoria-cat-cafe/raw.json (reseñas literales, horario, contacto).
// Uso: node tools/build-html.mjs
import { readFileSync, writeFileSync } from "node:fs";

const raw = JSON.parse(readFileSync(new URL("../../../data/la-gatoria-cat-cafe/raw.json", import.meta.url), "utf8"));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const IG = "https://www.instagram.com/lacasadelosgatosfelices/";
const DM = "https://ig.me/m/lacasadelosgatosfelices";
const MAPS = raw.maps_url;
const TEL = raw.phone_intl;
const { lat, lng } = raw.location;

const reservar = (cls = "plaque") =>
  `<a class="${cls}" href="${DM}" target="_blank" rel="noopener">Reservar<span class="sr-only"> por mensaje directo en Instagram</span></a>`;

// Las 7 paradas del recorrido. clip-k va de la parada k-1 a la parada k.
const stops = [
  {
    slug: "fachada", label: "La fachada",
    alt: "Fachada de La Gatoría de noche: escalera de barro, arco de ladrillo y reja de hierro iluminada, con el número 33 84.",
    copy: `
      <p class="eyebrow">Cra. 80C #33-84 · Laureles, Medellín</p>
      <h1 class="display">Comida vegetariana en la <span class="neon neon-ignite">casa de los gatos</span></h1>
      <p class="lead">La Casa de los Gatos Felices: una casa de ladrillo donde viven entre 15 y 18 gatos rescatados. Atendemos solo con reserva y desde los 10 años.</p>
      <div class="stop__actions">
        ${reservar()}
        <p class="rating-plate"><span aria-hidden="true">★</span> 4,7 <span class="rating-plate__meta">· 2.214 reseñas en Google</span></p>
      </div>
      <p class="scroll-hint" aria-hidden="true">Desliza para entrar</p>`,
  },
  {
    slug: "pasillo", label: "El pasillo",
    alt: "Pasillo de granito con varios gatos caminando sueltos hacia la cámara.",
    copy: `
      <p class="eyebrow">Al entrar</p>
      <h2 class="headline">Aquí los anfitriones tienen cuatro patas</h2>
      <p class="lead">Te reciben, te cuentan las reglas de la casa y te dan un recorrido. Los gatos andan sueltos por los pasillos, cada uno a su ritmo.</p>`,
  },
  {
    slug: "cat-home", label: "Cat home",
    alt: "Pared lila con un letrero de bombillos que dice CAT HOME, un cuadro de tres gatos y un sofacito rosa para gatos.",
    copy: `
      <p class="eyebrow">Su casa, tu visita</p>
      <h2 class="headline">Tú eres la visita</h2>
      <p class="lead">Los gatos deciden cuándo acercarse. No se cargan: se admiran de cerca, se acompañan y, si ellos quieren, se dejan consentir.</p>`,
  },
  {
    slug: "galeria", label: "La galería",
    alt: "Sala con retratos de gatos en marcos negros, lámparas de mimbre, enredaderas y un gato blanco y negro dormido en una banca de madera.",
    copy: `
      <p class="eyebrow">La galería</p>
      <h2 class="headline">Una banca, retratos y alguien durmiendo la siesta</h2>
      <p class="lead">Lámparas de mimbre, enredaderas y paredes llenas de gatos enmarcados. Un rincón para quedarse quieto un rato.</p>`,
  },
  {
    slug: "repisas", label: "Las repisas",
    alt: "Pared blanca con repisas y puentes de madera para gatos, un gatito asomado en su caja y retratos de gatos con gorguera.",
    copy: `
      <p class="eyebrow">Hecha para ellos</p>
      <h2 class="headline">Puentes, cajas y repisas a su altura</h2>
      <p class="lead">La casa está pensada para su bienestar: suben, se esconden y te miran desde arriba. En el cookie time eres tú quien les da las galletitas.</p>`,
  },
  {
    slug: "comedor", label: "El comedor",
    alt: "Comedor de paredes grises con mesas de madera, repisas para gatos y cuadros bajo bombillos colgantes.",
    copy: `
      <p class="eyebrow">El comedor</p>
      <h2 class="headline">Comida vegetariana, sin carta cerrada</h2>
      <p class="lead">Waffles de yuca, flan, limonada de coco, ensalada de las hadas. Entre COP 40.000 y 60.000 por persona, según Google.</p>`,
  },
  {
    slug: "tu-mesa", label: "Tu mesa",
    alt: "Una gata calicó sentada junto a una mesa de madera servida, con un florero de flores secas.",
    copy: `
      <p class="eyebrow">Tu mesa te espera</p>
      <h2 class="headline">Reserva por mensaje directo</h2>
      <p class="lead">Escríbenos por Instagram con el día, la hora y cuántas personas vienen. Lun a jue de 2 a 8 p. m., vie de 1 a 8, sáb de 1 a 9 y dom de 1 a 7.</p>
      <div class="stop__actions">${reservar()}</div>`,
  },
];

const stopHtml = stops
  .map((s, i) => `
    <li class="stop" id="parada-${s.slug}" data-stop="${i}" data-label="${esc(s.label)}">
      <figure class="stop__media frame frame-gilt" style="--tilt:${i % 2 ? "0.8deg" : "-1deg"}">
        <picture>
          <source media="(max-width: 899px)" srcset="assets/stills/stop-${i}-m.webp" width="720" height="1280">
          <img src="assets/stills/stop-${i}.webp" alt="${esc(s.alt)}" width="1280" height="720" decoding="async"${i ? ' loading="lazy"' : ' fetchpriority="high"'}>
        </picture>
      </figure>
      <div class="stop__copy">
        <p class="stop__num" aria-hidden="true">${String(i + 1).padStart(2, "0")} / 07 · ${esc(s.label)}</p>${s.copy}
      </div>
    </li>`)
  .join("");

// Reseñas literales. Mar Mora llega cortada desde la fuente: se cita hasta su última frase completa.
const reviewCut = { "Mar Mora": "Tú eres la visita, por lo tanto, hay que acatar las reglas" };
const tilts = ["-1.4deg", "1.1deg", "-0.6deg", "1.6deg", "-1.1deg"];
const reviewHtml = raw.reviews
  .map((r, i) => {
    let text = r.text;
    if (reviewCut[r.author]) text = text.slice(0, text.indexOf(reviewCut[r.author]) + reviewCut[r.author].length) + "…";
    // Primeras frases visibles (unos 150 caracteres); el resto, literal, en una disclosure nativa.
    const sentences = text.replace(/\s*\n+\s*/g, " ").trim().match(/[^.!?…]+(?:[.!?…]+["”’)]?|$)\s*/g) || [text];
    let shown = "", i2 = 0;
    while (i2 < sentences.length && (shown.length < 150 || i2 === 0)) shown += sentences[i2++];
    let restText = sentences.slice(i2).join("").trim();
    shown = shown.trim();
    // Una primera frase muy larga se corta por palabras; el texto sigue literal en «Seguir leyendo».
    if (shown.length > 230) {
      const cut = shown.lastIndexOf(" ", 200);
      restText = `…${shown.slice(cut + 1)} ${restText}`.trim();
      shown = `${shown.slice(0, cut).replace(/[,;:]$/, "")}…`;
    }
    const rest = restText ? [restText] : [];
    const when = r.when.replace(/^Fecha de edición: /, "").toLowerCase();
    const name = r.author.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
    return `
      <figure class="note frame frame-black frame-mat" style="--tilt:${tilts[i % tilts.length]}">
        <p class="note__stars" aria-label="${r.rating} de 5 estrellas">${"★".repeat(r.rating)}</p>
        <blockquote>
          <p>${esc(shown)}</p>${rest.length ? `
          <details><summary>Seguir leyendo</summary>${rest.map((p) => `<p>${esc(p)}</p>`).join("")}</details>` : ""}
        </blockquote>
        <figcaption><strong>${esc(name)}</strong> · en Google · ${esc(when)}</figcaption>
      </figure>`;
  })
  .join("");

const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const hoursHtml = raw.hours
  .map((h) => `<li data-day="${days.indexOf(h.day)}"><span>${esc(h.day)}</span><span>${esc(h.hours)}</span></li>`)
  .join("");

const faqs = [
  ["¿Hay que reservar?", `Sí, siempre. Las reservas son por mensaje directo en Instagram, en <a href="${IG}" target="_blank" rel="noopener">@lacasadelosgatosfelices</a>. Así cuidamos la tranquilidad de los gatos y el espacio de cada mesa.`],
  ["¿Puedo ir con niños?", "Sí, desde los 10 años."],
  ["¿Puedo cargar a los gatos?", "No. Ellos deciden cuándo acercarse. Puedes darles Churu de la tienda de mascotas o galletitas en el cookie time, y casi siempre alguno termina a tu lado."],
  ["¿Cuánto se gasta?", "No hay menú cerrado ni precios por plato. Según Google, entre COP 40.000 y 60.000 por persona."],
  ["¿La comida es vegetariana?", "Sí. Hay platos salados y dulces, bebidas y postres: los que más nombran las reseñas son los waffles de yuca, el flan y la limonada de coco."],
  ["Tengo alergia a los gatos, ¿puedo ir?", "En la casa viven entre 15 y 18 gatos sueltos. Si tienes alergia, escríbenos antes de reservar y lo hablamos."],
  ["¿Puedo celebrar un cumpleaños?", "Sí, aquí se celebran cumpleaños. Cuéntanos por mensaje directo cuántas personas vienen."],
  ["¿Qué es el Teatro Orión?", "Es el cine que hay dentro de la casa: cada 8 días hay película. También se puede reservar para eventos especiales."],
  ["¿Hay tienda?", `Sí, una tienda de mascotas en la misma casa. En Instagram es <a href="https://www.instagram.com/lagatoria.store/" target="_blank" rel="noopener">@lagatoria.store</a>.`],
];
const faqHtml = faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("");

const dishes = [
  ["Waffles de yuca", "«Enriquito fortachón»", "Dulce"],
  ["Flan", "", "Dulce"],
  ["Limonada de coco", "", "Bebida"],
  ["Gata engreída", "", ""],
  ["Ensalada de las hadas", "", "Salado"],
  ["Angelito punkero", "", ""],
  ["Papas punkeritas", "", "Salado"],
];
const dishHtml = dishes
  .map(([n, a, t]) => `<li><span class="dish__name">${n}${a ? ` <span class="dish__alias">${a}</span>` : ""}</span>${t ? `<span class="tag">${t}</span>` : ""}</li>`)
  .join("");

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "La Gatoria Cat Cafe",
  alternateName: "La Casa de los Gatos Felices",
  servesCuisine: "Vegetariana",
  priceRange: "COP 40.000–60.000",
  telephone: raw.phone_intl,
  acceptsReservations: true,
  address: { "@type": "PostalAddress", streetAddress: "Cra. 80C #33-84", addressLocality: "Medellín", addressRegion: "Antioquia", addressCountry: "CO" },
  geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
  aggregateRating: { "@type": "AggregateRating", ratingValue: raw.rating, reviewCount: raw.review_count },
  openingHoursSpecification: [
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "14:00", closes: "20:00" },
    { dayOfWeek: "Friday", opens: "13:00", closes: "20:00" },
    { dayOfWeek: "Saturday", opens: "13:00", closes: "21:00" },
    { dayOfWeek: "Sunday", opens: "13:00", closes: "19:00" },
  ],
  sameAs: [IG],
};

const html = `<!doctype html>
<html lang="es-CO" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>La Gatoria Cat Cafe · Comida vegetariana en la casa de los gatos</title>
<meta name="description" content="La Casa de los Gatos Felices, en Laureles (Medellín): comida vegetariana entre 15 y 18 gatos rescatados. Solo con reserva por Instagram, desde los 10 años. 4,7★ en Google.">
<meta name="theme-color" content="#5c2a20">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_CO">
<meta property="og:title" content="La Gatoria Cat Cafe · La Casa de los Gatos Felices">
<meta property="og:description" content="Comida vegetariana en la casa de los gatos, en Laureles, Medellín. Solo con reserva.">
<meta property="og:image" content="assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preload" href="assets/fonts/gloock-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="assets/stills/stop-0.webp" media="(min-width: 900px)" fetchpriority="high">
<link rel="preload" as="image" href="assets/stills/stop-0-m.webp" media="(max-width: 899px)" fetchpriority="high">
<link rel="stylesheet" href="assets/css/brick.css">
<link rel="stylesheet" href="assets/css/site.css">
<script>(function(d){d.classList.replace("no-js","js");if(!matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("world-on")})(document.documentElement)</script>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="skip" href="#contenido">Saltar al contenido</a>

<header class="topbar">
  <a class="topbar__name" href="#parada-fachada">La Gatoria</a>
  ${reservar("plaque plaque--compact")}
</header>

<main id="contenido">
  <section class="world brick-wall" id="recorrido" aria-label="Recorrido por la casa" data-world>
    <div class="world__sticky">
      <div class="world__ambi" aria-hidden="true"><canvas width="64" height="36"></canvas></div>
      <div class="world__frame frame frame-gilt" aria-hidden="true">
        <div class="world__screen"><picture><source media="(max-width: 899px)" srcset="assets/stills/stop-0-m.webp"><img class="world__poster" src="assets/stills/stop-0.webp" alt="" width="1280" height="720" fetchpriority="high"></picture></div>
      </div>
      <ol class="stops">${stopHtml}
      </ol>
      <ol class="route" aria-label="Paradas del recorrido"></ol>
    </div>
  </section>
  <div class="molding" aria-hidden="true"></div>

  <section class="section" id="resenas" aria-labelledby="resenas-t">
    <div class="container">
      <div class="section__head">
        <h2 class="headline" id="resenas-t">Lo que cuentan en Google</h2>
        <p class="rating-plate rating-plate--lg"><span aria-hidden="true">★</span> 4,7 <span class="rating-plate__meta">· 2.214 reseñas</span></p>
      </div>
      <p class="lead section__intro">Lo que más repiten: la limpieza, lo bien cuidados que están los gatos y la calma de la casa.</p>
      <div class="notes">${reviewHtml}
      </div>
    </div>
  </section>

  <section class="section section--deep" id="la-casa" aria-labelledby="casa-t">
    <div class="container split">
      <div class="split__text">
        <h2 class="headline" id="casa-t">Qué se hace en la casa</h2>
        <ul class="activities">
          <li><h3>Recorrido por la casa</h3><p>Al llegar te muestran los espacios pensados para los gatos y te cuentan las reglas.</p></li>
          <li><h3>Cookie time</h3><p>La hora de las galletitas: eres tú quien se las da a los gatos.</p></li>
          <li><h3>Churu de la tienda</h3><p>Lo compras en la tienda de mascotas de la casa y se lo ofreces a quien se acerque.</p></li>
          <li><h3>Yoga con gatos</h3><p>Pregunta por las próximas fechas por mensaje directo.</p></li>
          <li><h3>Teatro Orión</h3><p>El cine de la casa: película cada 8 días, y se puede reservar para eventos especiales.</p></li>
        </ul>
      </div>
      <div class="hang" aria-label="Fotos de la casa">
        <figure class="frame frame-black hang__a" style="--tilt:-1.8deg"><img src="assets/photos/biblioteca.webp" alt="Biblioteca con estantes de libros, mesas de madera y repisas para gatos." width="1000" height="750" loading="lazy" decoding="async"></figure>
        <figure class="frame frame-gilt frame-mat hang__b" style="--tilt:2.2deg"><img src="assets/photos/fachada-dia.webp" alt="Fachada de la casa de día, con el letrero La Gatoría cat café." width="900" height="1599" loading="lazy" decoding="async"></figure>
        <figure class="frame frame-black frame-mat hang__c" style="--tilt:1deg"><img src="assets/photos/salon-cumpleanos.webp" alt="Salón con mesa larga, sillas blancas y un tablero que dice Que tu cumpleaños sea muy especial." width="1000" height="645" loading="lazy" decoding="async"><figcaption>Aquí se celebran cumpleaños.</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="section" id="carta" aria-labelledby="carta-t">
    <div class="container carta">
      <div class="frame frame-gilt frame-mat carta__frame" style="--tilt:-0.4deg">
        <h2 class="title" id="carta-t">La carta</h2>
        <p class="carta__note">No hay menú cerrado ni precios por plato. Estos son los que más nombran las reseñas:</p>
        <ul class="dishes">${dishHtml}</ul>
        <p class="carta__price">Entre <strong>COP 40.000 y 60.000</strong> por persona, según Google.</p>
      </div>
      <div class="carta__side">
        <h2 class="headline">Vegetariana, casera y con nombre propio</h2>
        <p class="lead">Platos salados, dulces, bebidas y postres. Cada uno tiene su apodo, como los gatos de la casa.</p>
        ${reservar()}
      </div>
    </div>
  </section>

  <section class="section section--deep" id="gatos" aria-labelledby="gatos-t">
    <div class="container split split--rev">
      <figure class="frame frame-black gatos__photo" style="--tilt:1.2deg"><img src="assets/photos/muro-de-los-gatos.webp" alt="Muro con las fotos y los nombres de los gatos de la casa." width="1200" height="900" loading="lazy" decoding="async"></figure>
      <div class="split__text">
        <h2 class="headline" id="gatos-t">Conoce a los gatos</h2>
        <p class="lead">Entre 15 y 18 gatos rescatados viven aquí. No los vas a ver a todos juntos: depende del ánimo en que estén.</p>
        <div class="label-card rules">
          <h3 class="title">Las reglas de la casa</h3>
          <ul>
            <li>Ellos deciden cuándo acercarse.</li>
            <li>Los gatos no se cargan; se acompañan.</li>
            <li>Siempre con reserva, por su tranquilidad y la tuya.</li>
            <li>Desde los 10 años.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="preguntas" aria-labelledby="faq-t">
    <div class="container faq">
      <div class="frame frame-black frame-mat faq__frame" style="--tilt:0.3deg">
        <h2 class="title" id="faq-t">Preguntas frecuentes</h2>
        ${faqHtml}
      </div>
    </div>
  </section>

  <section class="section section--deep" id="visita" aria-labelledby="visita-t">
    <div class="container visit">
      <div class="visit__info">
        <h2 class="headline" id="visita-t">Cómo llegar</h2>
        <p class="lead">Cra. 80C #33-84, Laureles–Estadio, Medellín.</p>
        <div class="hours-plate">
          <h3>Horario</h3>
          <ul class="hours">${hoursHtml}</ul>
        </div>
        <div class="visit__actions">
          ${reservar()}
          <a class="plaque-line" href="${MAPS}" target="_blank" rel="noopener">Abrir en Google Maps</a>
        </div>
        <p class="visit__contact">Tel. <a href="tel:${TEL}">+57 305 3949391</a> · Instagram <a href="${IG}" target="_blank" rel="noopener">@lacasadelosgatosfelices</a></p>
      </div>
      <figure class="frame frame-gilt visit__map" style="--tilt:0.5deg">
        <iframe title="Mapa: La Gatoria Cat Cafe en Laureles, Medellín" src="https://maps.google.com/maps?q=${lat},${lng}&amp;z=17&amp;hl=es&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </figure>
    </div>
  </section>

  <div class="molding" aria-hidden="true"></div>
  <section class="closing brick-wall" aria-labelledby="cierre-t">
    <div class="container closing__inner">
      <div class="sign-plate">
        <span class="screw" aria-hidden="true"></span><span class="screw" aria-hidden="true"></span><span class="screw" aria-hidden="true"></span><span class="screw" aria-hidden="true"></span>
        <h2 class="neon neon-ignite closing__sign" id="cierre-t">La Casa de los Gatos Felices</h2>
      </div>
      <p class="lead closing__line">Te esperamos. Escríbenos y separamos tu mesa.</p>
      ${reservar()}
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container footer__inner">
    <p>Fotos: @lacasadelosgatosfelices y Google Maps · Reseñas: Google</p>
    <p><a href="${IG}" target="_blank" rel="noopener">@lacasadelosgatosfelices</a> · Tienda <a href="https://www.instagram.com/lagatoria.store/" target="_blank" rel="noopener">@lagatoria.store</a> · <a href="tel:${TEL}">+57 305 3949391</a></p>
  </div>
</footer>
<script src="assets/js/world.js" defer></script>
</body>
</html>
`;

writeFileSync(new URL("../index.html", import.meta.url), html);
console.log("index.html ok");
