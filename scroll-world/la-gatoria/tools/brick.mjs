// Genera assets/css/brick.css con el muro de ladrillo de site/src/lib/brick.ts
// (mismo color de pared y misma semilla que la plantilla «muro»).
import { writeFileSync } from "node:fs";
import { brickTile, BRICK_TILE, seedFrom } from "../../../site/src/lib/brick.ts";

const wall = "#5c2a20";
const tile = brickTile(wall, seedFrom("la-gatoria-cat-cafe"));
writeFileSync(
  new URL("../assets/css/brick.css", import.meta.url),
  `/* Generado por tools/brick.mjs: no editar a mano. */\n.brick-wall{background-color:${wall};background-image:${tile};background-size:${BRICK_TILE.w}px ${BRICK_TILE.h}px;background-repeat:repeat}\n`,
);
console.log("brick.css ok");
