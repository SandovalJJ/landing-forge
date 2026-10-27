// Muro de ladrillo dibujado en SVG a partir del color de la pared del negocio.
// Vectorial (nítido en cualquier pantalla) y plano: cada ladrillo es un tono propio
// con un canto claro arriba y uno oscuro abajo; nada de degradados ni fotos.

type HSL = [number, number, number];

function hexToHsl(hex: string): HSL {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

const hsl = (h: number, s: number, l: number) =>
  `hsl(${h.toFixed(1)} ${(Math.min(1, Math.max(0, s)) * 100).toFixed(1)}% ${(Math.min(1, Math.max(0, l)) * 100).toFixed(1)}%)`;

// Aleatorio con semilla: el mismo negocio siempre tiene el mismo muro.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Semilla estable a partir del nombre del negocio: cada local tiene su propio aparejo. */
export const seedFrom = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const BRICK_W = 92;
const BRICK_H = 28;
const MORTAR = 5;
const PER_ROW = 4;
const ROWS = 8;
export const BRICK_TILE = { w: PER_ROW * (BRICK_W + MORTAR), h: ROWS * (BRICK_H + MORTAR) };

export function brickTile(wall: string, seed = 7): string {
  const [h, s, l] = hexToHsl(wall);
  const rand = rng(seed);
  const { w: W, h: H } = BRICK_TILE;
  const mortar = hsl(h, s * 0.35, Math.max(0.08, l * 0.55));
  const parts: string[] = [`<rect width="${W}" height="${H}" fill="${mortar}"/>`];

  for (let row = 0; row < ROWS; row++) {
    const y = row * (BRICK_H + MORTAR) + MORTAR / 2;
    const offset = row % 2 ? (BRICK_W + MORTAR) / 2 : 0; // aparejo a soga: media pieza corrida
    const bricks = Array.from({ length: PER_ROW }, () => ({
      lift: 0.8 + rand() * 0.28,
      hue: (rand() - 0.5) * 8,
      sat: 0.85 + rand() * 0.3,
      chip: rand() < 0.12 ? (rand() < 0.5 ? "left" : "right") : null,
    }));
    // En las hileras corridas, la pieza que sale por un borde entra por el otro con el mismo tono: sin costura.
    for (let i = -1; i <= PER_ROW; i++) {
      const b = bricks[(i + PER_ROW) % PER_ROW];
      const x = i * (BRICK_W + MORTAR) + offset + MORTAR / 2;
      const base = l * b.lift;
      parts.push(
        `<rect x="${x}" y="${y}" width="${BRICK_W}" height="${BRICK_H}" fill="${hsl(h + b.hue, s * b.sat, base)}"/>`,
        `<rect x="${x}" y="${y}" width="${BRICK_W}" height="2" fill="${hsl(h, s * 0.9, base + 0.045)}"/>`,
        `<rect x="${x}" y="${y + BRICK_H - 3}" width="${BRICK_W}" height="3" fill="${hsl(h, s, base - 0.05)}"/>`,
      );
      // De vez en cuando, una esquina gastada.
      if (b.chip) {
        const cx = b.chip === "left" ? x : x + BRICK_W - 9;
        parts.push(`<rect x="${cx}" y="${y}" width="9" height="6" fill="${mortar}"/>`);
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
