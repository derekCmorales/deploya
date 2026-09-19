import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("el home usa el kit canónico y el ciclo de despliegue", () => {
  const page = readFileSync(join(root, "src/app/page.tsx"), "utf8");
  assert.match(page, /Deploya/);
  assert.match(page, /Recepción/);
  assert.match(page, /Construcción/);
  assert.match(page, /Ejecución/);
  assert.match(page, /Enrutamiento/);
  assert.match(page, /Operación/);
  assert.doesNotMatch(page, /placeholder neutro/i);
  assert.doesNotMatch(page, /#121212|#0D6EFD/);
});

test("el layout declara Geist y lang es", () => {
  const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /Geist/);
  assert.match(layout, /lang="es"/);
  assert.match(layout, /--font-geist-sans/);
});

test("los tokens canónicos definen fondo y acento", () => {
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  assert.match(css, /--background/);
  assert.match(css, /--primary/);
});

test("al menos un entorno mock dispara aviso de cuota", () => {
  const obs = readFileSync(
    join(root, "src/lib/mock/observabilidad.ts"),
    "utf8",
  );
  assert.match(obs, /avisoCuota: true/);
});
