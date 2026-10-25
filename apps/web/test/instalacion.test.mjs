import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { hayCobro, MODO_POR_DEFECTO, navegacionSegunModo, RUTAS_SOLO_NUBE } from "../src/lib/instalacion.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (ruta) => readFileSync(join(root, ruta), "utf8");

const NAV = [{ href: "/projects" }, { href: "/suscripcion" }, { href: "/cuenta" }, { href: "/sistema" }, { href: "/admin/usuarios" }];

test("SP-06 · Nube por defecto: mientras carga, la navegación es la de siempre", () => {
  assert.deepEqual(MODO_POR_DEFECTO, { modo: "nube", configurada: true });
  assert.deepEqual(navegacionSegunModo(NAV, "nube"), NAV);
});

test("SP-06 · Sin cobro en autoalojado: la navegación no muestra Suscripción", () => {
  assert.deepEqual(
    navegacionSegunModo(NAV, "autoalojado").map((i) => i.href),
    ["/projects", "/cuenta", "/sistema", "/admin/usuarios"],
  );
  assert.equal(hayCobro("autoalojado"), false);
  assert.deepEqual([...RUTAS_SOLO_NUBE], ["/suscripcion", "/planes", "/pagos"]);
});

test("SP-06 · /planes, /suscripcion y /pagos cuelgan de un layout que da 404 en autoalojado", () => {
  assert.match(leer("src/app/(billing)/layout.tsx"), /<SoloEnNube>/);
  assert.match(leer("src/app/(billing)/solo-en-nube.tsx"), /if \(!hayCobro\(modo\)\) notFound\(\)/);
  assert.match(leer("src/components/shell/nav-panel.tsx"), /navegacionSegunModo\(/);
});
