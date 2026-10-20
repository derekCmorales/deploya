import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "8.30.1";
const ARCHIVO = `gitleaks_${VERSION}_linux_x64.tar.gz`;
const SHA256 = "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb";
const URL_GITLEAKS = `https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/${ARCHIVO}`;
const ESPERA_ESCANEO_MS = 120_000;
const cache = join(tmpdir(), `deploya-gitleaks-${VERSION}`);
const binario = join(cache, "gitleaks");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function versionInstalada() {
  if (!existsSync(binario)) return "";
  try {
    return execFileSync(binario, ["version"], { encoding: "utf8" });
  } catch {
    return "";
  }
}

async function descargarTar() {
  const respuesta = await fetch(URL_GITLEAKS);
  if (!respuesta.ok) throw new Error(`no se pudo bajar gitleaks (${respuesta.status})`);
  const bytes = Buffer.from(await respuesta.arrayBuffer());
  if (sha256(bytes) !== SHA256) throw new Error("el checksum de gitleaks no coincide");
  return bytes;
}

function extraer(bytes) {
  mkdirSync(cache, { recursive: true });
  const tar = join(cache, ARCHIVO);
  writeFileSync(tar, bytes);
  execFileSync("tar", ["-xzf", tar, "-C", cache]);
  chmodSync(binario, 0o755);
}

/** El escenario pide gitleaks sobre el historial; el binario no es dependencia npm. */
async function asegurarGitleaks() {
  if (versionInstalada().includes(VERSION)) return binario;
  extraer(await descargarTar());
  return binario;
}

function argumentos(informe) {
  return [
    "detect",
    "--source", repo,
    "--config", join(repo, ".gitleaks.toml"),
    "--log-opts=--all",
    "--report-format", "json",
    "--report-path", informe,
    "--redact",
    "--no-banner",
  ];
}

it("Historial sin secretos", { timeout: ESPERA_ESCANEO_MS }, async () => {
  const bin = await asegurarGitleaks();
  const informe = join(cache, "informe.json");
  execFileSync(bin, argumentos(informe), { cwd: repo, stdio: "pipe" });
  const hallazgos = JSON.parse(readFileSync(informe, "utf8"));
  assert.equal(hallazgos.length, 0);
});

it("Contribuir", () => {
  const texto = readFileSync(join(repo, "CONTRIBUTING.md"), "utf8");
  assert.match(texto, /proponer un change/);
  assert.match(texto, /\/opsx-propose/);
  assert.match(texto, /feat\/m<n>-<slug>/);
  assert.match(texto, /fix\//);
  assert.match(texto, /docs\//);
  assert.match(texto, /chore\//);
  assert.match(texto, /Nunca commits ni push a `main`/);
  assert.match(texto, /Conventional Commits/);
  assert.match(texto, /Un change por pull request/);
  assert.match(texto, /pnpm check/);
});
