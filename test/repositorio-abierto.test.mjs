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
const BASE_DESCARGA = `https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}`;
const URL_INSTALACION = "https://github.com/gitleaks/gitleaks#installing";
const MODO_EJECUTABLE = 0o755;
const ESPERA_ESCANEO_MS = 120_000;
// Fuente: gitleaks_8.30.1_checksums.txt del release oficial v8.30.1.
const ARCHIVOS_POR_PLATAFORMA = {
  "linux-x64": {
    nombre: `gitleaks_${VERSION}_linux_x64.tar.gz`,
    sha256: "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
  },
  "linux-arm64": {
    nombre: `gitleaks_${VERSION}_linux_arm64.tar.gz`,
    sha256: "e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080",
  },
  "darwin-x64": {
    nombre: `gitleaks_${VERSION}_darwin_x64.tar.gz`,
    sha256: "dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709",
  },
  "darwin-arm64": {
    nombre: `gitleaks_${VERSION}_darwin_arm64.tar.gz`,
    sha256: "b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5",
  },
};
const cache = join(tmpdir(), `deploya-gitleaks-${VERSION}`);
const binarioEnCache = join(cache, "gitleaks");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function partesDeVersion(texto) {
  const coincidencia = texto.match(/(\d+)\.(\d+)\.(\d+)/);
  return coincidencia ? coincidencia.slice(1).map(Number) : null;
}

function esVersionSuficiente(texto) {
  const encontrada = partesDeVersion(texto);
  if (!encontrada) return false;
  const minima = partesDeVersion(VERSION);
  for (let i = 0; i < minima.length; i += 1) {
    if (encontrada[i] !== minima[i]) return encontrada[i] > minima[i];
  }
  return true;
}

function versionDe(ejecutable) {
  try {
    return execFileSync(ejecutable, ["version"], { encoding: "utf8", stdio: "pipe" });
  } catch {
    return "";
  }
}

function sirve(ejecutable) {
  return esVersionSuficiente(versionDe(ejecutable));
}

function archivoDeLaPlataforma() {
  const clave = `${process.platform}-${process.arch}`;
  const archivo = ARCHIVOS_POR_PLATAFORMA[clave];
  if (archivo) return archivo;
  const soportadas = Object.keys(ARCHIVOS_POR_PLATAFORMA).join(", ");
  throw new Error(
    `no hay gitleaks ${VERSION} para ${clave} (soportadas: ${soportadas}). ` +
      `Instala gitleaks ${VERSION} o superior y ponlo en el PATH: ${URL_INSTALACION}`,
  );
}

async function descargarTar(archivo) {
  const respuesta = await fetch(`${BASE_DESCARGA}/${archivo.nombre}`);
  if (!respuesta.ok) throw new Error(`no se pudo bajar gitleaks (${respuesta.status})`);
  const bytes = Buffer.from(await respuesta.arrayBuffer());
  if (sha256(bytes) !== archivo.sha256) throw new Error("el checksum de gitleaks no coincide");
  return bytes;
}

function extraer(archivo, bytes) {
  mkdirSync(cache, { recursive: true });
  const tar = join(cache, archivo.nombre);
  writeFileSync(tar, bytes);
  execFileSync("tar", ["-xzf", tar, "-C", cache]);
  chmodSync(binarioEnCache, MODO_EJECUTABLE);
}

/** El escenario pide gitleaks sobre el historial; el binario no es dependencia npm. */
async function asegurarGitleaks() {
  if (sirve("gitleaks")) return "gitleaks";
  if (existsSync(binarioEnCache) && sirve(binarioEnCache)) return binarioEnCache;
  const archivo = archivoDeLaPlataforma();
  extraer(archivo, await descargarTar(archivo));
  return binarioEnCache;
}

function clonSuperficial() {
  const marca = execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
    cwd: repo,
    encoding: "utf8",
  });
  return marca.trim() === "true";
}

function detalleFallo(error) {
  const stderr = error.stderr?.toString?.().trim();
  if (stderr) return stderr;
  return error.message;
}

function traerHistorialCompleto() {
  try {
    execFileSync("git", ["fetch", "--unshallow"], {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
  } catch (error) {
    const detalle = detalleFallo(error);
    throw new Error(`el clon es superficial y git fetch --unshallow falló: ${detalle}`);
  }
  if (clonSuperficial()) {
    throw new Error("el clon sigue siendo superficial después de git fetch --unshallow");
  }
}

/**
 * actions/checkout deja un solo commit; sin historial el escaneo no ve nada.
 * Solo CI completa el clon por su cuenta; en local no se toca el repo de quien corre la prueba.
 */
function completarHistorial() {
  if (!clonSuperficial()) return;
  if (!process.env.CI) {
    throw new Error("el clon es superficial: corre git fetch --unshallow y repite pnpm test");
  }
  traerHistorialCompleto();
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
  completarHistorial();
  const bin = await asegurarGitleaks();
  mkdirSync(cache, { recursive: true });
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
