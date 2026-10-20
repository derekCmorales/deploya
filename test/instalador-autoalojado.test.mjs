import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { it } from "node:test";
import assert from "node:assert/strict";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLAVE = "x".repeat(32);
const CODIGO = /Código de configuración:\n[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}\n/;

function sh(lineas) {
  return `#!/bin/bash\nset -euo pipefail\n${lineas.join("\n")}\n`;
}

function doble(dir, nombre, cuerpo) {
  writeFileSync(join(dir, nombre), cuerpo, { mode: 0o755 });
}

function dobles(dir) {
  doble(dir, "docker", sh([
    '[[ -n "${DEPLOYA_TRAZA:-}" ]] && printf "%s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'if [[ "$1" == "version" ]]; then printf "%s\\n" "27.3"; exit 0; fi',
    'if [[ "$1" == "compose" && "$2" == "version" ]]; then printf "%s\\n" "2.29.1"; exit 0; fi',
    'if [[ "$1" == "ps" ]]; then printf "%s\\n" "api-tienda"; exit 0; fi',
    "exit 0",
  ]));
  doble(dir, "curl", sh([
    'printf "curl %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'if [[ "$*" == *ifconfig.me* ]]; then printf "%s\\n" "203.0.113.10"; fi',
    "exit 0",
  ]));
  doble(dir, "dig", sh([
    'printf "dig %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'printf "%s\\n" "${DEPLOYA_DIG_IP:-}"',
  ]));
  doble(dir, "free", sh([
    'printf "%s\\n" "              total        used        free      shared  buff/cache   available"',
    'printf "%s\\n" "Mem:           3891        1200        1800          20         800        2500"',
  ]));
  doble(dir, "df", sh([
    'printf "%s\\n" "Avail"',
    'printf "%s\\n" "61G"',
  ]));
  doble(dir, "ss", sh([
    'printf "%s\\n" "State Recv-Q Send-Q Local Address:Port Peer Address:Port Process"',
  ]));
  doble(dir, "pg_dump", sh([
    'printf "pg_dump %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'for arg in "$@"; do',
    '  if [[ "$arg" == --file=* ]]; then cp "$DEPLOYA_BASE_DATOS" "${arg#--file=}"; fi',
    "done",
  ]));
  doble(dir, "psql", sh([
    'printf "psql %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'for arg in "$@"; do',
    '  if [[ "$arg" == --file=* ]]; then cp "${arg#--file=}" "$DEPLOYA_BASE_DATOS"; fi',
    "done",
  ]));
  doble(dir, "prisma", sh([
    'printf "prisma %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    "exit 0",
  ]));
  doble(dir, "git", sh([
    'printf "git %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'case "$1" in',
    '  describe) cat "$DEPLOYA_GIT_REF" ;;',
    '  pull) printf "%s\\n" "$DEPLOYA_VERSION_NUEVA" > "$DEPLOYA_GIT_REF" ;;',
    '  checkout) printf "%s\\n" "$2" > "$DEPLOYA_GIT_REF" ;;',
    "esac",
  ]));
}

function escenario(extra = {}) {
  const raiz = mkdtempSync(join(tmpdir(), "deploya-inst-"));
  const home = join(raiz, "home");
  const bin = join(raiz, "bin");
  const respaldos = join(raiz, "respaldos");
  const trabajo = join(raiz, "trabajo");
  const tmp = join(raiz, "tmp");
  for (const dir of [home, bin, respaldos, trabajo, tmp]) mkdirSync(dir);
  dobles(bin);
  const traza = join(raiz, "traza.log");
  const gitRef = join(raiz, "git-ref");
  const base = join(raiz, "base.sql");
  writeFileSync(traza, "");
  writeFileSync(gitRef, "v1.0.0\n");
  writeFileSync(base, "estado-previo\n");
  const entorno = {
    PATH: `${bin}:/usr/bin:/bin`,
    HOME: home,
    TMPDIR: tmp,
    LC_ALL: "C",
    DEPLOYA_HOME: join(home, ".deploya"),
    DEPLOYA_ENV: join(trabajo, ".env"),
    DEPLOYA_PLATAFORMA_GENERADA: join(trabajo, "plataforma.generada.yml"),
    DEPLOYA_RESPALDOS: respaldos,
    DEPLOYA_AHORA: "2026-10-20T03:00:00Z",
    DEPLOYA_DOMINIO: "apps.miempresa.com",
    DEPLOYA_ACME_CORREO: "certs@miempresa.com",
    DEPLOYA_TOKEN_DNS: "token-de-prueba",
    DEPLOYA_DIG_IP: "203.0.113.10",
    DEPLOYA_TRAZA: traza,
    DEPLOYA_GIT_REF: gitRef,
    DEPLOYA_BASE_DATOS: base,
    DEPLOYA_VERSION_NUEVA: "v1.1.0",
    ...extra,
  };
  return { raiz, bin, entorno, traza, respaldos, gitRef, base };
}

function correr(script, args, entorno) {
  return spawnSync("bash", [join(repo, "scripts", script), ...args], {
    cwd: repo,
    env: entorno,
    encoding: "utf8",
  });
}

function detalle(resultado) {
  return `${resultado.stdout}\n${resultado.stderr}`;
}

function valor(texto, clave) {
  const linea = texto.split("\n").find((l) => l.startsWith(`${clave}=`));
  assert.ok(linea, clave);
  return linea.slice(clave.length + 1).replaceAll('"', "");
}

function lineasTraza(traza) {
  return readFileSync(traza, "utf8").split("\n").filter(Boolean);
}

function pathSin(escena, nombre) {
  const filtro = join(escena.raiz, "sistema");
  mkdirSync(filtro);
  const nombres = [
    "awk", "install", "mktemp", "mkdir", "chmod", "sed", "tar", "rm", "cat",
    "cp", "mv", "find", "sort", "wc", "date", "basename", "dirname", "openssl",
    "curl", "dig", "free", "df", "ss", "bash", "env",
  ];
  for (const cmd of nombres) {
    if (cmd === nombre) continue;
    const origen = [`/usr/bin/${cmd}`, `/bin/${cmd}`].find((ruta) => existsSync(ruta));
    if (origen) symlinkSync(origen, join(filtro, cmd));
  }
  const doble = join(escena.bin, nombre);
  if (existsSync(doble)) rmSync(doble);
  escena.entorno.PATH = `${escena.bin}:${filtro}`;
}

function entornoPlano(ruta) {
  writeFileSync(ruta, [
    "MODO_INSTALACION=autoalojado",
    "POSTGRES_USER=deploya",
    "POSTGRES_PASSWORD=clave-db",
    "POSTGRES_DB=deploya",
    `CLAVE_CIFRADO_VARIABLES="${CLAVE}"`,
    "",
  ].join("\n"));
}

function ochoRespaldos(entorno) {
  const fechas = [
    "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08",
  ];
  for (const fecha of fechas) {
    const resultado = correr("respaldar.sh", [], { ...entorno, DEPLOYA_AHORA: `${fecha}T03:00:00Z` });
    assert.equal(resultado.status, 0, detalle(resultado));
  }
}

it("Servidor limpio", () => {
  const escena = escenario();
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  assert.match(resultado.stdout, /https:\/\/apps\.miempresa\.com\/configurar/);
  assert.match(resultado.stdout, CODIGO);
  const texto = readFileSync(escena.entorno.DEPLOYA_ENV, "utf8");
  assert.equal(statSync(escena.entorno.DEPLOYA_ENV).mode & 0o777, 0o600);
  assert.equal(valor(texto, "MODO_INSTALACION"), "autoalojado");
  assert.equal(valor(texto, "CLAVE_CIFRADO_VARIABLES").length, 32);
  assert.equal(valor(texto, "SECRETO_SESION").length, 32);
  assert.notEqual(valor(texto, "CLAVE_CIFRADO_VARIABLES"), valor(texto, "SECRETO_SESION"));
  assert.notEqual(valor(texto, "CLAVE_CIFRADO_VARIABLES"), "deploya-dev-clave-variables-032b");
  assert.equal(valor(texto, "CF_DNS_API_TOKEN"), "token-de-prueba");
  assert.match(readFileSync(join(escena.entorno.DEPLOYA_HOME, "estado"), "utf8"), /administrador=hecha/);
  assert.equal(existsSync(join(escena.entorno.DEPLOYA_HOME, "instalacion.log")), true);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("DNS que no apunta", () => {
  const escena = escenario({ DEPLOYA_DIG_IP: "198.51.100.7" });
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.notEqual(resultado.status, 0);
  assert.equal(existsSync(escena.entorno.DEPLOYA_ENV), false);
  assert.match(resultado.stdout, /\*\.apps\.miempresa\.com apunta a 198\.51\.100\.7, no a esta máquina \(203\.0\.113\.10\)\./);
  assert.match(resultado.stdout, /registro A:/);
  assert.match(resultado.stdout, /\*\.apps → 203\.0\.113\.10/);
  assert.match(resultado.stdout, /\.\/scripts\/instalar\.sh --continuar/);
  assert.match(resultado.stdout, /No se instaló nada todavía\. Bitácora: ~\/\.deploya\/instalacion\.log/);
  const log = readFileSync(join(escena.entorno.DEPLOYA_HOME, "instalacion.log"), "utf8");
  assert.match(log, /198\.51\.100\.7/);
  const estado = readFileSync(join(escena.entorno.DEPLOYA_HOME, "estado"), "utf8");
  assert.match(estado, /requisitos=hecha/);
  assert.equal(estado.includes("servicios=hecha"), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Retomar", () => {
  const escena = escenario({ DEPLOYA_DIG_IP: "198.51.100.7" });
  const primero = correr("instalar.sh", [], escena.entorno);
  assert.notEqual(primero.status, 0);
  const trasFallo = lineasTraza(escena.traza).filter((l) => l.startsWith("version ")).length;
  assert.equal(trasFallo, 1);
  escena.entorno.DEPLOYA_DIG_IP = "203.0.113.10";
  const segundo = correr("instalar.sh", ["--continuar"], escena.entorno);
  assert.equal(segundo.status, 0, detalle(segundo));
  assert.equal(lineasTraza(escena.traza).filter((l) => l.startsWith("version ")).length, trasFallo);
  assert.equal(segundo.stdout.includes("[1/5]"), false);
  assert.match(segundo.stdout, /\[2\/5\]/);
  assert.match(segundo.stdout, /Código de configuración:/);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Actualizar sin cortar", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  const resultado = correr("actualizar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  assert.match(resultado.stdout, /api, web y trabajador reiniciados · las apps publicadas no se cortan/);
  const lineas = lineasTraza(escena.traza);
  const curls = lineas.map((l, i) => ({ l, i })).filter(({ l }) => l.startsWith("curl ") && l.includes("api-tienda"));
  const dump = lineas.findIndex((l) => l.startsWith("pg_dump "));
  const migracion = lineas.findIndex((l) => l.startsWith("prisma "));
  const reinicio = lineas.findIndex((l) => l.includes("restart") && l.includes("worker"));
  assert.ok(curls.length >= 3);
  assert.ok(curls[0].i < dump);
  assert.ok(dump < migracion);
  assert.ok(curls[curls.length - 1].i > reinicio);
  assert.equal(lineas.some((l) => /\bstop\b/.test(l) || /\bdown\b/.test(l)), false);
  assert.equal(lineas.some((l) => l.includes("api-tienda") && /\b(stop|rm|down)\b/.test(l)), false);
  const version = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(version.instalada, "v1.1.0");
  assert.equal(version.disponible, null);
  assert.equal(existsSync(join(escena.respaldos, "ultimo.json")), true);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Volver", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  doble(escena.bin, "prisma", sh([
    'printf "prisma %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'printf "%s\\n" "migracion-fallida" > "$DEPLOYA_BASE_DATOS"',
    "exit 1",
  ]));
  const fallo = correr("actualizar.sh", [], escena.entorno);
  assert.notEqual(fallo.status, 0);
  assert.equal(readFileSync(escena.base, "utf8"), "migracion-fallida\n");
  const vuelta = correr("actualizar.sh", ["--volver"], escena.entorno);
  assert.equal(vuelta.status, 0, detalle(vuelta));
  assert.equal(readFileSync(escena.base, "utf8"), "estado-previo\n");
  const version = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(version.instalada, "v1.0.0");
  assert.equal(readFileSync(escena.gitRef, "utf8").trim(), "v1.0.0");
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Respaldo sin la clave", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  ochoRespaldos(escena.entorno);
  const archivos = readdirSync(escena.respaldos).filter((n) => n.endsWith(".tar.gz"));
  assert.equal(archivos.length, 7);
  assert.equal(archivos.includes("2026-10-01.tar.gz"), false);
  assert.equal(archivos.includes("2026-10-08.tar.gz"), true);
  const texto = execFileSync("tar", ["-xOzf", join(escena.respaldos, "2026-10-08.tar.gz")], { encoding: "utf8" });
  assert.equal(texto.includes("CLAVE_CIFRADO_VARIABLES"), false);
  assert.equal(texto.includes(CLAVE), false);
  assert.match(texto, /MODO_INSTALACION=autoalojado/);
  const ultimo = JSON.parse(readFileSync(join(escena.respaldos, "ultimo.json"), "utf8"));
  assert.equal(ultimo.ultimo, "2026-10-08");
  assert.equal(ultimo.ruta.endsWith("/2026-10-08.tar.gz"), true);
  assert.equal(typeof ultimo.tamanoMb, "number");
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Docker anterior a 24 se detiene en requisitos", () => {
  const escena = escenario();
  doble(escena.bin, "docker", sh([
    'if [[ "$1" == "version" ]]; then printf "%s\\n" "20.10.7"; exit 0; fi',
    'if [[ "$1" == "compose" && "$2" == "version" ]]; then printf "%s\\n" "2.29.1"; exit 0; fi',
    "exit 0",
  ]));
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.notEqual(resultado.status, 0);
  assert.equal(existsSync(escena.entorno.DEPLOYA_ENV), false);
  assert.match(resultado.stdout, /Hace falta Docker 24 o más nuevo \(hay 20\.10\.7\)\./);
  assert.match(resultado.stdout, /\[1\/5\]/);
  assert.equal(resultado.stdout.includes("[2/5]"), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Sin dig se detiene en requisitos", () => {
  const escena = escenario();
  pathSin(escena, "dig");
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.notEqual(resultado.status, 0);
  assert.equal(existsSync(escena.entorno.DEPLOYA_ENV), false);
  assert.match(resultado.stdout, /Falta dig\./);
  assert.match(resultado.stdout, /\[1\/5\]/);
  assert.equal(resultado.stdout.includes("[2/5]"), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});
