import data from "../data/business.json";

export type Photo = {
  src: string; file: string; width: number | null; height: number | null; attribution: string;
  source?: string; subject?: string; alt?: string; caption?: string; url?: string;
};
export type Instagram = {
  username: string; url: string; full_name?: string; bio?: string; followers?: number; posts_count?: number;
};
export type Review = { author: string; rating: number | null; text: string; when: string };

export const business = data.business;
export const copy = data.copy;
export const palette = data.palette as Record<string, string>;
export const photos = data.photos as Photo[];
export const reviews = (data.business.reviews ?? []) as Review[];
export const instagram = ((data.business as { instagram?: Instagram }).instagram ?? null) as Instagram | null;

/** Foto por índice, repitiendo si el negocio tiene pocas. */
export const photo = (i: number): Photo => photos[i % photos.length];

export const mapsEmbed = () => {
  const { lat, lng } = business.location ?? {};
  const q = lat ? `${lat},${lng}` : `${business.name} ${business.address}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
};

export const directionsUrl = () =>
  business.maps_url ??
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address ?? business.name)}`;

export const phoneHref = () => (business.phone_intl ?? business.phone ?? "").replace(/[^\d+]/g, "");

/** Dónde reserva de verdad el negocio: su red/WhatsApp si la tiene, si no el teléfono, si no el mapa. */
export const reserveHref = () => {
  const site = business.website ?? "";
  if (/instagram\.com|wa\.me|whatsapp/i.test(site)) return site;
  if (phoneHref()) return `tel:${phoneHref()}`;
  return directionsUrl();
};

export const reserveVia = () => {
  const site = business.website ?? "";
  if (/instagram\.com/i.test(site)) return "Instagram";
  if (/wa\.me|whatsapp/i.test(site)) return "WhatsApp";
  return phoneHref() ? "teléfono" : "Google Maps";
};

export type DayHours = { day: string; hours: string };
export const hours = (business.hours ?? []) as DayHours[];

/** Separa "1 – 7 p. m." en la parte que cabe en un display de 7 segmentos ("1-7") y el sufijo ("P. M."). */
export function lcdHours(text: string): { digits: string; suffix: string } {
  if (/cerrado|closed/i.test(text)) return { digits: "--", suffix: "CERRADO" };
  const digits = text.replace(/[–—]/g, "-").replace(/[^\d:\-]/g, "");
  const suffix = (text.match(/[ap]\.?\s?m\./gi) ?? []).slice(-1)[0]?.toUpperCase() ?? "";
  return { digits: digits || "--", suffix };
}

export const formatRating =(n: number | null | undefined) =>
  n == null ? "" : n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatCount = (n: number | null | undefined) => (n == null ? "" : n.toLocaleString("es-CO"));

/** Divide el titular para poder pintar el fragmento resaltado. */
export function splitHighlight(text: string, highlight: string): [string, string, string] {
  const i = highlight ? text.indexOf(highlight) : -1;
  if (i < 0) return [text, "", ""];
  return [text.slice(0, i), highlight, text.slice(i + highlight.length)];
}

/** Reseñas largas: extracto cortado en límite de palabra (el texto completo queda a un clic). */
export const excerpt = (text: string, max = 340) => {
  if (text.length <= max + 60) return { short: text, cut: false };
  return { short: text.slice(0, text.lastIndexOf(" ", max)).replace(/[\s,.;:–-]+$/, ""), cut: true };
};

/** "Fecha de edición: hace un año" → "hace un año"; ISO → "oct 2025". */
export const reviewWhen = (w: string | null | undefined) => {
  if (!w) return "Google";
  const iso = Date.parse(w);
  if (/^\d{4}-\d{2}/.test(w) && !Number.isNaN(iso)) {
    return new Date(iso).toLocaleDateString("es-CO", { month: "short", year: "numeric" });
  }
  return w.includes(":") ? w.split(":").pop()!.trim() : w;
};

export const initials =(name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
