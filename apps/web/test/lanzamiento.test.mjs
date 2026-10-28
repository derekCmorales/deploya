import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PLANTILLA_TITULO, tituloDePagina } from "../src/lib/titulos.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

/** Todo `page.tsx` y `not-found.tsx` del App Router, para revisar los títulos de una vez. */
function paginas(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) return paginas(ruta);
    return entrada.name === "page.tsx" || entrada.name === "not-found.tsx" ? [ruta] : [];
  });
}

const LIMITES = [
  "src/app/error.tsx",
  "src/app/(auth)/error.tsx",
  "src/app/(billing)/error.tsx",
  "src/app/(cuenta)/error.tsx",
  "src/app/(projects)/error.tsx",
  "src/app/(admin)/error.tsx",
];

test("Error inesperado en una pantalla", () => {
  for (const ruta of LIMITES) {
    const limite = leer(ruta);
    assert.match(limite, /^"use client";/, `${ruta} no es componente de cliente`);
    assert.match(limite, /<ErrorDePantalla reset=\{reset\} \/>/, `${ruta} no llama a reset()`);
  }

  const limite = leer("src/components/estados/error-de-pantalla.tsx");
  assert.match(limite, /<ErrorConexionApi/, "el límite no muestra el estado 28");
  assert.match(limite, /onReintentar=\{reset\}/, "«Reintentar» no vuelve a dibujar");
  assert.match(limite, /reintentoAutomatico=\{false\}/, "un error de render no se reintenta solo");
  assert.match(limite, /Algo falló al dibujar esta pantalla/);
  assert.doesNotMatch(limite, /\bfetch\(/, "el límite no pide datos");
  assert.match(leer("src/components/estados/error-conexion-api.tsx"), /"Reintentar"/);

  const global = leer("src/app/global-error.tsx");
  assert.match(global, /<html lang="es">/);
  assert.match(global, /<ErrorConexionApi/);
  assert.match(global, /onReintentar=\{reset\}/);
  assert.match(global, /reintentoAutomatico=\{false\}/);
});

test("Carga entre rutas", () => {
  const proyectos = leer("src/app/(projects)/loading.tsx");
  assert.match(proyectos, /<EsqueletoProyectos \/>/);

  for (const ruta of ["(auth)", "(billing)", "(cuenta)", "(admin)"]) {
    const carga = leer(`src/app/${ruta}/loading.tsx`);
    assert.match(carga, /<Skeleton className=/, `${ruta} no muestra Skeleton`);
  }
});

test("Cabeceras de seguridad", async () => {
  const config = await import(new URL("../next.config.ts", import.meta.url));
  const reglas = await config.default.headers();
  const cabeceras = Object.fromEntries(reglas.flatMap((regla) => regla.headers).map(({ key, value }) => [key, value]));

  assert.equal(cabeceras["X-Frame-Options"], "DENY");
  assert.equal(cabeceras["X-Content-Type-Options"], "nosniff");
  assert.equal(cabeceras["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(cabeceras["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
  assert.equal(cabeceras["Strict-Transport-Security"], undefined, "HSTS lo pone Traefik");
});

test("Título por página", () => {
  assert.equal(tituloDePagina("Mi suscripción"), "Mi suscripción · Deploya");
  assert.match(leer("src/app/layout.tsx"), /template: PLANTILLA_TITULO/);
  assert.match(leer("src/app/(billing)/suscripcion/page.tsx"), /title: "Mi suscripción"/);

  for (const ruta of paginas(fileURLToPath(new URL("../src/app", import.meta.url)))) {
    const pagina = readFileSync(ruta, "utf8");
    assert.match(pagina, /export const metadata: Metadata = \{ title:/, `${ruta} sin título propio`);
    assert.ok(!pagina.includes("· Deploya"), `${ruta} repite el sufijo de la plantilla`);
  }

  const icono = leer("src/app/icon.svg");
  assert.match(icono, />deploy<tspan/, "el ícono no es el Wordmark");
  assert.doesNotMatch(icono, /#[0-9a-fA-F]{3,8}\b/, "el ícono no inventa hex");
  assert.match(icono, /oklch\(0\.5 0\.15 250\)/, "la última «a» va en Señal");
});
