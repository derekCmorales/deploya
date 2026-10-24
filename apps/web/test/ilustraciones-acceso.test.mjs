import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const ILUSTRACIONES = {
  registro: {
    pagina: "src/app/(auth)/registro/page.tsx",
    componente: "src/app/(auth)/registro/ilustracion-registro.tsx",
    nombre: "IlustracionRegistro",
    formulario: "FormularioRegistro",
  },
  ingreso: {
    pagina: "src/app/(auth)/ingresar/page.tsx",
    componente: "src/app/(auth)/ingresar/ilustracion-ingreso.tsx",
    nombre: "IlustracionIngreso",
    formulario: "FormularioIngreso",
  },
};

const css = leer("src/app/globals.css");
const bloqueReducido = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)[1];

/** Clases `dy-*` que usa una ilustración. */
function clasesDeMovimiento(fuente) {
  return [...new Set([...fuente.matchAll(/className="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))].filter((c) =>
    c.startsWith("dy-"),
  );
}

/** Cuerpo de la regla `.clase { … }` dentro de `@layer utilities`. */
function reglaDe(clase) {
  const regla = css.match(new RegExp(`\\n  \\.${clase} \\{([^}]*)\\}`));
  assert.ok(regla, `falta .${clase} en globals.css`);
  return regla[1];
}

function keyframesDe(nombre) {
  const bloque = css.match(new RegExp(`@keyframes ${nombre} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(bloque, `faltan @keyframes ${nombre}`);
  return bloque[1];
}

test("Movimiento reducido", () => {
  for (const { componente, pagina, formulario } of Object.values(ILUSTRACIONES)) {
    const clases = clasesDeMovimiento(leer(componente));
    assert.ok(clases.length > 0, `${componente} no tiene movimiento`);
    for (const clase of clases) {
      reglaDe(clase);
      assert.ok(bloqueReducido.includes(`.${clase}`), `.${clase} no se apaga con movimiento reducido`);
    }
    // El formulario está en la página aparte de la ilustración: funciona igual quieta o sin ella.
    assert.match(leer(pagina), new RegExp(`<${formulario}`));
  }
  // Quieta queda en su estado final: la entrada no deja nada transparente y el halo no se ve.
  for (const clase of ["dy-aparece", "dy-crece-x", "dy-crece-centro"]) {
    assert.doesNotMatch(reglaDe(clase), /opacity|transform:/);
  }
  assert.match(bloqueReducido, /\.dy-respira \{\s*opacity: 0;/);
});

test("Ilustración decorativa", () => {
  for (const { pagina, componente, nombre } of Object.values(ILUSTRACIONES)) {
    const fuente = leer(componente);
    assert.match(leer(pagina), new RegExp(`<${nombre}`));
    assert.match(fuente, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
    // Nada que un lector de pantalla anuncie ni que reciba foco.
    assert.doesNotMatch(fuente, /tabIndex|<title|<text|<a\b|role=|aria-label/);
  }
});

test("Solo tokens", () => {
  for (const { componente } of Object.values(ILUSTRACIONES)) {
    const fuente = leer(componente);
    assert.doesNotMatch(fuente, /#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(fuente, /\b(rgb|rgba|hsl|hsla|oklch|oklab)\(|gradient/i);
    const colores = [...fuente.matchAll(/"var\((--[a-z-]+)\)"/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(colores)].sort(), ["--border-stronger", "--foreground", "--signal"]);
    // Cada token cambia con el tema: está en claro (:root) y en oscuro (.dark).
    for (const token of colores) {
      const definiciones = css.match(new RegExp(`\\n\\s*${token}:`, "g")) ?? [];
      assert.ok(definiciones.length >= 2, `${token} no tiene valor claro y oscuro`);
    }
  }
});

test("SP-01 · el halo y la flotación no se cortan en el borde del dibujo", () => {
  for (const { componente } of Object.values(ILUSTRACIONES)) {
    const fuente = leer(componente);
    assert.match(fuente, /<svg[^>]*style=\{SIN_RECORTE\}/);
    assert.match(fuente, /const SIN_RECORTE: CSSProperties = \{ overflow: "visible" \}/);
  }
});

test("SP-01 · el halo no se ve antes de su retraso", () => {
  assert.match(reglaDe("dy-respira"), /^\s*opacity: 0;/m);
});

test("SP-01 · las utilidades nuevas solo animan transform y opacity", () => {
  for (const nombre of ["dy-aparece", "dy-crece-x", "dy-respira", "dy-oscila"]) {
    const propiedades = [...keyframesDe(nombre).matchAll(/^\s*([a-z-]+):/gm)].map((m) => m[1]);
    assert.ok(propiedades.length > 0);
    assert.deepEqual(
      propiedades.filter((p) => p !== "transform" && p !== "opacity"),
      [],
      `${nombre} anima algo que mueve el layout`,
    );
  }
});
