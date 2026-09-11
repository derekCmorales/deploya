import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const KEYWORDS = [
  "flowchart",
  "classDiagram",
  "erDiagram",
  "stateDiagram",
  "sequenceDiagram",
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const root = join(process.cwd(), "docs/diagramas");
const files = walk(root).filter((f) => extname(f) === ".mmd");
if (files.length === 0) {
  console.error("No se encontraron .mmd en docs/diagramas");
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!KEYWORDS.some((k) => text.includes(k))) {
    console.error(`Mermaid inválido (sin tipo de diagrama): ${file}`);
    failed += 1;
  }
}

if (failed) process.exit(1);
console.log(`OK ${files.length} archivos Mermaid`);
