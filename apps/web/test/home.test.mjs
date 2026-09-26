import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..", "..");
const leer = (p) => readFileSync(join(root, p), "utf8");

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : [p];
  });
}

test("el home nombra Deploya y apunta al design system", () => {
  const page = leer("src/app/page.tsx");
  assert.match(page, /Deploya/);
  assert.match(page, /docs\/diseno/);
  assert.match(page, /\/sistema/);
});

test("el layout declara Geist, lang es y claro por defecto", () => {
  const layout = leer("src/app/layout.tsx");
  assert.match(layout, /Geist/);
  assert.match(layout, /lang="es"/);
  assert.match(layout, /--font-geist-sans/);
  assert.doesNotMatch(layout, /className="dark"/);
  assert.match(leer("src/components/shell/theme-provider.tsx"), /defaultTheme="light"/);
});

test("los tokens v4.1 definen Señal y estados en claro y oscuro", () => {
  const css = leer("src/app/globals.css");
  for (const t of ["--background", "--sunken", "--primary", "--signal", "--signal-soft", "--ok", "--warn", "--bad", "--destructive"]) {
    assert.match(css, new RegExp(`${t}:`), `falta ${t}`);
  }
  assert.match(css, /:root \{/);
  assert.match(css, /\.dark \{/);
  assert.match(css, /prefers-reduced-motion/);
});

test("los componentes no usan hex sueltos", () => {
  const dir = join(root, "src");
  for (const f of archivos(dir).filter((p) => /\.(tsx?|css)$/.test(p))) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /#[0-9a-fA-F]{3,8}\b(?![\w-])/, `hex en ${f}`);
  }
});

test("el shell lleva la marca, la navegación y el toggle de tema", () => {
  const toggle = leer("src/components/shell/theme-toggle.tsx");
  assert.match(toggle, /Cambiar a modo claro/);
  assert.match(toggle, /Cambiar a modo oscuro/);
  const shell = leer("src/components/shell/app-shell.tsx");
  assert.match(shell, /ThemeToggle/);
  assert.match(shell, /Wordmark/);
  assert.match(leer("src/components/deploya/wordmark.tsx"), /deploy<span className="text-signal">a<\/span>/);
});

test("los estados de despliegue siguen el núcleo v4.1", () => {
  const estados = leer("src/components/deploya/estados.ts");
  assert.match(estados, /"cancelado"/);
  assert.doesNotMatch(estados, /revirtiendo/);
  for (const e of ["activa", "por-vencer", "vencida", "suspendida", "cancelada"]) {
    assert.match(estados, new RegExp(`"${e}"`));
  }
});

test("el catálogo /sistema existe y usa los componentes del sistema", () => {
  const page = leer("src/app/sistema/page.tsx");
  for (const c of ["RielEtapas", "EstadoDespliegue", "EstadoSuscripcion", "Bitacora", "Banner", "Meter"]) {
    assert.match(page, new RegExp(c), `falta ${c} en /sistema`);
  }
});

test("la fuente madre de diseño está en el repo", () => {
  for (const p of ["docs/diseno/README.md", "docs/diseno/guia-construccion.md", "docs/diseno/tokens.json", "docs/diseno/pantallas/README.md"]) {
    assert.ok(existsSync(join(repo, p)), `falta ${p}`);
  }
  const fichas = readdirSync(join(repo, "docs/diseno/pantallas")).filter((f) => f !== "README.md");
  assert.ok(fichas.length >= 30, "faltan fichas de pantalla");
});

test("el package incluye las dependencias del sistema", () => {
  const pkg = JSON.parse(leer("package.json"));
  for (const dep of ["framer-motion", "lucide-react", "next-themes", "class-variance-authority"]) {
    assert.ok(pkg.dependencies[dep], `falta ${dep}`);
  }
  assert.ok(pkg.devDependencies.tailwindcss, "falta tailwindcss");
});
