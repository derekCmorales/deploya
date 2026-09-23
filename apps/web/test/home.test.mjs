import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("el home nombra Deploya y apunta al kit", () => {
  const page = readFileSync(join(root, "src/app/page.tsx"), "utf8");
  assert.match(page, /Deploya/);
  assert.match(page, /docs\/kit-visual\.md/);
  assert.doesNotMatch(page, /placeholder neutro/i);
  assert.doesNotMatch(page, /#121212|#0D6EFD/);
});

test("el layout declara Geist y lang es", () => {
  const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /Geist/);
  assert.match(layout, /lang="es"/);
  assert.match(layout, /--font-geist-sans/);
});

test("los tokens canónicos definen fondo y énfasis monocromático", () => {
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  assert.match(css, /--background/);
  assert.match(css, /--primary/);
  assert.match(css, /:root/);
  assert.match(css, /\.dark/);
  assert.doesNotMatch(css, /175\)/);
});

test("el toggle de tema vive en el header mínimo", () => {
  const toggle = readFileSync(
    join(root, "src/components/shell/theme-toggle.tsx"),
    "utf8",
  );
  assert.match(toggle, /Cambiar a modo claro/);
  assert.match(toggle, /Cambiar a modo oscuro/);
  const shell = readFileSync(
    join(root, "src/components/shell/app-shell.tsx"),
    "utf8",
  );
  assert.match(shell, /ThemeToggle/);
  assert.match(shell, /Deploya/);
});

test("el package incluye el kit y no monta xyflow", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  for (const dep of [
    "@xyflow/react",
    "framer-motion",
    "lucide-react",
    "next-themes",
  ]) {
    assert.ok(pkg.dependencies[dep], `falta ${dep}`);
  }
  assert.ok(pkg.devDependencies.tailwindcss, "falta tailwindcss");
  const page = readFileSync(join(root, "src/app/page.tsx"), "utf8");
  assert.doesNotMatch(page, /@xyflow\/react/);
  assert.equal(existsSync(join(root, "src/components/panel")), false);
  assert.equal(existsSync(join(root, "src/lib/mock")), false);
});
