/* La Gatoria · motor del recorrido.
   Adaptado de scroll-world/scrub-engine.js para tramos ENTRE paradas:
   parada 0 · clip-1 · parada 1 · clip-2 · … · clip-6 · parada 6.
   En cada parada la cámara está quieta (se ve su still, que es un fotograma real del
   vídeo) y su texto HTML; durante el tramo k el scroll mueve el currentTime del clip-k.
   Técnicas heredadas del engine: clips como Blob (siempre seekables), seeks coalescidos,
   priming en iOS al primer toque y resize que ignora la barra de URL del móvil. */
(() => {
  const root = document.documentElement;
  const BOGOTA_DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // Horario: resalta el día de hoy en Medellín (no depende del recorrido).
  try {
    const wd = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Bogota" }).format(new Date());
    const row = document.querySelector(`.hours li[data-day="${BOGOTA_DAY[wd]}"]`);
    if (row) { row.classList.add("is-today"); row.setAttribute("aria-current", "date"); }
  } catch (e) {}

  const world = document.querySelector("[data-world]");
  if (!world || !root.classList.contains("world-on")) return;

  const stops = [...world.querySelectorAll(".stop")];
  const N = stops.length;              // 7 paradas
  const CLIPS = N - 1;                 // 6 tramos
  const screen = world.querySelector(".world__screen");
  const poster = world.querySelector(".world__poster");
  const canvas = world.querySelector(".world__ambi canvas");
  const ctx = canvas && canvas.getContext("2d", { alpha: false });
  const routeEl = world.querySelector(".route");

  const coarse = matchMedia("(hover: none) and (pointer: coarse)").matches;
  const mobileMQ = matchMedia("(max-width: 899px)");
  const isMobile = () => mobileMQ.matches;
  const still = (i) => `assets/stills/stop-${i}${isMobile() ? "-m" : ""}.webp`;
  const clipUrl = (k) => `assets/video/clip-${k}${isMobile() ? "-m" : ""}.mp4`;

  // Recorrido en alturas de pantalla: paradas cortas (el texto se lee con la cámara quieta),
  // tramos largos (la cámara camina). La primera y la última se quedan un poco más.
  const HOLD = (i) => (i === 0 ? 0.7 : i === N - 1 ? 0.9 : 0.6);
  const TRAVEL = 1.6;
  const segs = [];
  for (let i = 0; i < N; i++) {
    segs.push({ kind: "stop", i, w: HOLD(i) });
    if (i < CLIPS) segs.push({ kind: "clip", k: i + 1, w: TRAVEL });
  }

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const easeInOut = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));

  // La picture del póster sirve para el primer render (LCP); desde aquí el src lo lleva el motor.
  const posterSource = poster.parentElement.querySelector("source");
  if (posterSource) posterSource.remove();
  let posterSrc = "";
  const setPoster = (i) => { const s = still(i); if (s !== posterSrc) { posterSrc = s; poster.src = s; } };
  setPoster(0);

  // ---------- clips ----------
  const clips = {}; // k -> { v, url, ready, painted, cur, target, variant }
  let userReady = false;

  function load(k) {
    if (k < 1 || k > CLIPS || clips[k]) return;
    const variant = isMobile() ? "m" : "d";
    const c = (clips[k] = { v: null, url: "", ready: false, painted: false, cur: 0, target: 0, variant, dead: false });
    fetch(clipUrl(k))
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.status))))
      .then((blob) => {
        if (c.dead) return;
        const v = document.createElement("video");
        v.muted = true; v.playsInline = true; v.preload = "auto";
        v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
        c.url = URL.createObjectURL(blob);
        v.src = c.url;
        v.addEventListener("loadedmetadata", () => { c.ready = true; frame(); });
        // Solo se muestra cuando ya pintó un fotograma real (en iOS un vídeo nunca reproducido queda en negro).
        v.addEventListener("seeked", () => { c.painted = true; }, { once: true });
        v.addEventListener("loadeddata", () => { try { v.pause(); v.currentTime = 0.001; } catch (e) {} if (userReady) prime(v); });
        screen.appendChild(v);
        c.v = v;
      })
      .catch(() => { delete clips[k]; });
  }

  function release(k) {
    const c = clips[k];
    if (!c) return;
    c.dead = true;
    if (c.v) { c.v.removeAttribute("src"); c.v.load(); c.v.remove(); }
    if (c.url) URL.revokeObjectURL(c.url);
    delete clips[k];
  }

  function prime(v) {
    if (!isMobile() || !v) return;
    try { const p = v.play(); if (p && p.then) p.then(() => v.pause()).catch(() => {}); } catch (e) {}
  }
  const onGesture = () => { if (userReady) return; userReady = true; Object.values(clips).forEach((c) => prime(c.v)); };
  addEventListener("pointerdown", onGesture, { once: true, passive: true });
  addEventListener("touchstart", onGesture, { once: true, passive: true });

  // ---------- ruta ----------
  const dots = stops.map((s, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Ir a ${s.dataset.label}`);
    b.addEventListener("click", () => goTo(i));
    li.appendChild(b); routeEl.appendChild(li);
    return b;
  });

  // ---------- layout ----------
  let vh = innerHeight, laidOutW = innerWidth, total = 0;
  function layout() {
    vh = innerHeight; laidOutW = innerWidth;
    let off = 0;
    segs.forEach((s) => { s.start = off * vh; off += s.w; s.end = off * vh; });
    total = off * vh;
    world.style.height = `${total + vh}px`;
    read();
  }

  function goTo(i) {
    const s = segs.find((x) => x.kind === "stop" && x.i === i);
    const top = world.getBoundingClientRect().top + scrollY + (s.start + s.end) / 2;
    scrollTo({ top, behavior: "smooth" });
  }

  // Si el foco del teclado llega a un enlace de otra parada, el recorrido viaja hasta ella.
  stops.forEach((s, i) => s.addEventListener("focusin", () => { if (active !== i) goTo(i); }));

  // ---------- lectura del scroll ----------
  let active = -1, seg = segs[0], segP = 0, ticking = false, started = false;

  function read() {
    ticking = false;
    const y = clamp(scrollY - (world.getBoundingClientRect().top + scrollY), 0, total - 1);
    seg = segs.find((s) => y >= s.start && y < s.end) || segs[segs.length - 1];
    segP = clamp((y - seg.start) / (seg.end - seg.start));

    // Qué clips mantener cargados y cuál precargar. Nada se pide antes del primer render.
    if (!started) return paintCopy();
    const keep = new Set();
    if (seg.kind === "stop") {
      keep.add(seg.i); keep.add(seg.i + 1);          // los dos tramos vecinos
      load(seg.i + 1); load(seg.i);
    } else {
      const k = seg.k;
      keep.add(k - 1); keep.add(k); keep.add(k + 1);
      load(k);
      if (segP >= 0.5) load(k + 1);                   // precarga el siguiente a mitad de tramo
      else load(k - 1);                               // y el anterior, por si vuelve atrás
    }
    Object.keys(clips).forEach((k) => { if (!keep.has(+k)) release(+k); });
    paintCopy();
  }

  // Texto: se ve con la cámara quieta y se va cuando arranca el tramo siguiente.
  function paintCopy() {
    stops.forEach((el, i) => {
      let op = 0, lift = 0;
      if (seg.kind === "stop" && seg.i === i) op = 1;
      else if (seg.kind === "clip" && seg.k === i) { op = smooth((segP - 0.72) / 0.28); lift = (1 - op) * 18; }
      else if (seg.kind === "clip" && seg.k === i + 1) { op = 1 - smooth(segP / 0.28); lift = -(1 - op) * 18; }
      el.style.opacity = op.toFixed(3);
      el.style.setProperty("--lift", `${lift.toFixed(1)}px`);
      el.classList.toggle("is-active", op > 0.5);
    });
    const near = seg.kind === "stop" ? seg.i : segP < 0.5 ? seg.k - 1 : seg.k;
    if (near !== active) {
      active = near;
      dots.forEach((d, i) => (i === near ? d.setAttribute("aria-current", "step") : d.removeAttribute("aria-current")));
    }
  }

  function park(c, at, eps) {
    if (!c || !c.ready || !c.v) return;
    c.cur = c.target = at;
    const t = clamp(at, 0, 0.999) * (c.v.duration || 1);
    if (!c.v.seeking && Math.abs(c.v.currentTime - t) > eps) { try { c.v.currentTime = t; } catch (e) {} }
  }

  // ---------- render por frame ----------
  let ambiKey = "";
  function frame() {
    const eps = isMobile() ? 0.02 : 0.008;
    let shown = null;
    if (seg.kind === "clip") {
      const c = clips[seg.k];
      if (c && c.ready && c.v) {
        c.target = easeInOut(segP);
        if (!c.v.seeking) {
          c.cur += (c.target - c.cur) * 0.22;
          if (Math.abs(c.target - c.cur) < 0.0005) c.cur = c.target;
          const t = clamp(c.cur, 0, 0.999) * (c.v.duration || 1);
          if (Math.abs(c.v.currentTime - t) > eps) { try { c.v.currentTime = t; } catch (e) {} }
        }
        if (c.painted) shown = c;
      }
      // Debajo del vídeo, el póster es la parada más cercana: cubre el clip mientras carga y,
      // al final del tramo, recibe un fundido corto que tapa el casi-calce de Kling con la foto de llegada.
      setPoster(segP < 0.5 ? seg.k - 1 : seg.k);
      if (shown) shown.v.style.opacity = (1 - smooth((segP - 0.93) / 0.07)).toFixed(3);
    } else {
      setPoster(seg.i);
      // En la parada, el clip de salida espera en su primer fotograma y el de llegada en el último,
      // ya colocados: al arrancar el tramo no aparece un fotograma viejo.
      park(clips[seg.i + 1], 0, eps);
      park(clips[seg.i], 1, eps);
    }
    Object.entries(clips).forEach(([k, c]) => c.v && c.v.classList.toggle("is-on", c === shown));

    // Ambilight (escritorio): el muro toma el color del fotograma que se ve en el cuadro.
    if (ctx && !isMobile()) {
      const src = shown ? shown.v : poster;
      const key = shown ? `v${seg.k}:${shown.v.currentTime.toFixed(2)}` : `p${posterSrc}:${poster.complete}`;
      if (key !== ambiKey && (shown || (poster.complete && poster.naturalWidth))) {
        ambiKey = key;
        try { ctx.drawImage(src, 0, 0, 64, 36); } catch (e) {}
      }
    }
    requestAnimationFrame(frame);
  }

  // ---------- eventos ----------
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(read); } }, { passive: true });
  addEventListener("resize", () => { if (coarse && innerWidth === laidOutW) return; layout(); });
  addEventListener("orientationchange", layout);
  mobileMQ.addEventListener("change", () => { Object.keys(clips).forEach((k) => release(+k)); posterSrc = ""; read(); });

  layout();
  requestAnimationFrame(frame);
  // El clip-1 se pide después del primer render, para no competir con el still de la parada 0 (LCP).
  const start = () => { if (started) return; started = true; read(); };
  if (document.readyState === "complete") setTimeout(start, 0);
  else addEventListener("load", () => setTimeout(start, 0), { once: true });
})();
