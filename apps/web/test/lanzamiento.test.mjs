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

test("Accesibilidad: un main por pantalla, medidores con nombre y bitácora con teclado (DOC-02)", () => {
  const conMain = [
    "src/app/(auth)/registro/page.tsx",
    "src/app/(auth)/ingresar/page.tsx",
    "src/app/(auth)/recuperar/page.tsx",
    "src/app/(auth)/verificar/page.tsx",
    "src/app/(auth)/restablecer/page.tsx",
    "src/app/(projects)/projects/nuevo/page.tsx",
    "src/app/(projects)/projects/[proyecto]/layout.tsx",
    "src/app/not-found.tsx",
  ];
  for (const ruta of conMain) {
    const pagina = leer(ruta);
    assert.match(pagina, /<main[ >]/, `${ruta} sin <main>`);
    assert.equal(pagina.match(/<main[ >]/g).length, 1, `${ruta} con más de un <main>`);
  }

  const medidor = leer("src/components/ui/meter.tsx");
  assert.match(medidor, /role="meter"\s+aria-labelledby=\{etiqueta\}/, "el medidor no toma su nombre de la etiqueta");
  assert.match(medidor, /<span id=\{etiqueta\}/);

  const bitacora = leer("src/components/deploya/bitacora.tsx");
  assert.match(bitacora, /role="log"[\s\S]*tabIndex=\{0\}/, "la bitácora se desplaza sin teclado");
  assert.match(bitacora, /focus-visible:ring-2 focus-visible:ring-ring/, "la bitácora no muestra el foco");
  assert.match(bitacora, /text-faint select-none" aria-hidden/, "el número de línea no es decorativo");
});

/** Resuelve los imports locales de una página (`./`, `../`, `@/`) al archivo `.tsx` que importan. */
function componentesLocales(ruta, fuente) {
  const imports = [...fuente.matchAll(/from "((?:\.{1,2}|@)\/[^"]+)"/g)].map((m) => m[1]);
  return imports.flatMap((spec) => {
    const base = spec.startsWith("@/") ? join("src", spec.slice(2)) : join(ruta, "..", spec);
    try {
      return [[base, readFileSync(new URL(`../${base}.tsx`, import.meta.url), "utf8")]];
    } catch {
      return [];
    }
  });
}

test("Alto completo: un <main> sin altura no envuelve un contenedor con min-h-full (lateral cortado)", () => {
  const raiz = fileURLToPath(new URL("../", import.meta.url));
  const archivos = paginas(join(raiz, "src/app")).map((abs) => abs.slice(raiz.length));
  for (const ruta of archivos) {
    const fuente = leer(ruta);
    if (!/<main>/.test(fuente)) continue;
    for (const [componente, codigo] of componentesLocales(ruta, fuente)) {
      assert.doesNotMatch(
        codigo,
        /min-h-full/,
        `${ruta} envuelve ${componente} en un <main> sin altura: su min-h-full no se resuelve y la pantalla queda a medias`,
      );
    }
  }

  const nuevo = leer("src/app/(projects)/projects/nuevo/page.tsx");
  assert.match(nuevo, /<main className="flex min-h-full flex-col">/, "el alta no llena el cuerpo del shell");
  const asistente = leer("src/app/(projects)/projects/_componentes/asistente-alta.tsx");
  assert.match(asistente, /className="grid flex-1 grid-cols-1/, "la rejilla del alta no crece hasta abajo");
});
