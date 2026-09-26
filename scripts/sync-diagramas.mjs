// Copia cada diagrama .mmd a los documentos que lo embeben.
// En el .md, el bloque ```mermaid va justo después de `<!-- diagrama: docs/diagramas/... -->`.
// Uso: node scripts/sync-diagramas.mjs          → reescribe los bloques
//      node scripts/sync-diagramas.mjs --check  → falla si alguno difiere del .mmd (CI)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DOCUMENTOS = ["docs/arquitectura.md", "docs/arquitectura-maestro.md"];
const BLOQUE = /(<!-- diagrama: (\S+) -->\n+```mermaid\n)([\s\S]*?)(```)/g;

const soloRevisar = process.argv.includes("--check");
const raiz = process.cwd();
const desfasados = [];

for (const doc of DOCUMENTOS) {
  const ruta = join(raiz, doc);
  const original = readFileSync(ruta, "utf8");
  const actualizado = original.replace(BLOQUE, (_, apertura, fuente, bloque, cierre) => {
    const mmd = readFileSync(join(raiz, fuente), "utf8").trimEnd() + "\n";
    if (mmd !== bloque) desfasados.push(`${doc} ← ${fuente}`);
    return apertura + mmd + cierre;
  });
  if (!soloRevisar && actualizado !== original) writeFileSync(ruta, actualizado);
}

if (desfasados.length === 0) {
  console.log("Diagramas embebidos al día");
} else if (soloRevisar) {
  console.error("Diagramas embebidos desfasados (corre `pnpm diagramas:sync`):");
  for (const d of desfasados) console.error(`  ${d}`);
  process.exit(1);
} else {
  console.log(`Sincronizados ${desfasados.length} bloques:`);
  for (const d of desfasados) console.log(`  ${d}`);
}
