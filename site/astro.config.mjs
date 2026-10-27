import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// Una sola plantilla entra al build, así su CSS y sus fuentes no se mezclan con las de otra.
const TEMPLATES = { clasica: "Clasica", "cuarto-oscuro": "CuartoOscuro", muro: "Muro" };
const name = process.env.LF_TEMPLATE ?? "clasica";
if (!TEMPLATES[name]) throw new Error(`Plantilla desconocida: ${name}. Usa: ${Object.keys(TEMPLATES).join(", ")}`);

// Compila en site/dist; build.py lo copia luego a dist/<slug> en la raíz.
// (El outDir debe quedar dentro de site/ para que el prerender resuelva node_modules.)
export default defineConfig({
  build: { assets: "assets" },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { "@template": fileURLToPath(new URL(`./src/templates/${TEMPLATES[name]}.astro`, import.meta.url)) },
    },
  },
});
