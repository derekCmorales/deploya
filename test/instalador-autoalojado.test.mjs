import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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
    'if [[ "$1" == "ps" ]]; then printf "%s\\n" "deploya-p-api-tienda" "deploya-p-api-tienda"; exit 0; fi',
    'if [[ "$*" == *" pg_dump "* ]]; then cat "$DEPLOYA_BASE_DATOS"; exit 0; fi',
    'if [[ "$*" == *ON_ERROR_STOP* ]]; then cat > "$DEPLOYA_BASE_DATOS"; exit 0; fi',
    'if [[ "$*" == *"run --rm migracion"* && "${DEPLOYA_MIGRACION_FALLA:-}" == "1" ]]; then',
    '  printf "%s\\n" "migracion-fallida" > "$DEPLOYA_BASE_DATOS"',
    "  exit 1",
    "fi",
    'if [[ "${DEPLOYA_HAY_ADMIN:-}" == "1" && "$*" == *administrador* ]]; then printf "%s\\n" "1"; exit 0; fi',
    "exit 0",
  ]));
  doble(dir, "openssl", sh([
    'if [[ "$1" == "s_client" ]]; then',
    '  printf "%s\\n" "-----BEGIN CERTIFICATE-----"',
    '  printf "%s\\n" "dGVzdA=="',
    '  printf "%s\\n" "-----END CERTIFICATE-----"',
    "  exit 0",
    "fi",
    'if [[ "$1" == "x509" ]]; then',
    "  cat >/dev/null",
    '  dominio="${DEPLOYA_DOMINIO:-apps.miempresa.com}"',
    '  printf "%s\\n" "DNS:*.${dominio}, DNS:${dominio}"',
    '  printf "%s\\n" "notAfter=Jan 18 12:00:00 2027 GMT"',
    "  exit 0",
    "fi",
    'exec /usr/bin/openssl "$@"',
  ]));
  doble(dir, "curl", sh([
    'printf "curl %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'malo=0',
    'prev=""',
    'for arg in "$@"; do',
    '  if [[ "$prev" == "--header" && "$arg" == @* && -f "${arg#@}" ]]; then',
    '    if grep -q "token-malo" "${arg#@}"; then malo=1; fi',
    "  fi",
    '  prev="$arg"',
    "done",
    'if [[ "$*" == *ifconfig.me* ]]; then printf "%s\\n" "203.0.113.10"; exit 0; fi',
    'if [[ "$*" == *tokens/verify* ]]; then',
    '  if [[ "$malo" == 1 ]]; then printf "%s\\n" "{\\"success\\":false}"; exit 0; fi',
    '  printf "%s\\n" "{\\"success\\":true,\\"result\\":{\\"status\\":\\"active\\"}}"',
    "  exit 0",
    "fi",
    'nombre_zona=""',
    'for arg in "$@"; do',
    '  case "$arg" in',
    "    *'zones?name='*) nombre_zona=\"\${arg#*'zones?name='}\" ;;",
    "  esac",
    "done",
    'if [[ -n "$nombre_zona" ]]; then',
    '  nombre_zona="${nombre_zona%%&*}"',
    '  puntos="${nombre_zona//[^.]}"',
    '  if [[ "${#puntos}" -ge 2 ]]; then printf "%s\\n" "{\\"success\\":true,\\"result\\":[]}"; exit 0; fi',
    '  printf "%s\\n" "{\\"success\\":true,\\"result\\":[{\\"name\\":\\"${nombre_zona}\\"}]}"',
    "  exit 0",
    "fi",
    'dominio="${DEPLOYA_DOMINIO:-apps.miempresa.com}"',
    'if [[ -n "${DEPLOYA_CURL_FALLOS:-}" && "$*" == *"$dominio"* ]]; then',
    "  n=0",
    '  [[ -f "${DEPLOYA_CURL_N:-}" ]] && n=$(cat "$DEPLOYA_CURL_N")',
    "  n=$((n + 1))",
    '  printf "%s" "$n" > "$DEPLOYA_CURL_N"',
    '  if (( n <= DEPLOYA_CURL_FALLOS )); then exit 28; fi',
    "fi",
    "exit 0",
  ]));
  doble(dir, "dig", sh([
    'printf "dig %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'nombre=""',
    'for arg in "$@"; do nombre="$arg"; done',
    'if [[ -n "${DEPLOYA_DIG_CNAME:-}" ]]; then printf "%s\\n" "cname.ejemplo.net."; fi',
    'if [[ "$nombre" == "${DEPLOYA_DOMINIO:-}" ]]; then',
    '  printf "%s\\n" "${DEPLOYA_DIG_APEX:-${DEPLOYA_DIG_IP:-}}"',
    "else",
    '  printf "%s\\n" "${DEPLOYA_DIG_IP:-}"',
    "fi",
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
    '  checkout) printf "%s\\n" "${!#}" > "$DEPLOYA_GIT_REF" ;;',
    "  fetch) ;;",
    '  tag) cat "$DEPLOYA_GIT_TAGS" ;;',
    "esac",
    "exit 0",
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
  const gitTags = join(raiz, "git-tags");
  const cron = join(raiz, "cron-deploya");
  const base = join(raiz, "base.sql");
  writeFileSync(traza, "");
  writeFileSync(gitRef, "v1.0.0\n");
  writeFileSync(gitTags, "v1.0.0\nv1.1.0\n");
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
    DEPLOYA_GIT_TAGS: gitTags,
    DEPLOYA_CRON: cron,
    DEPLOYA_PAUSA_HTTPS_SEG: "0",
    DEPLOYA_BASE_DATOS: base,
    DEPLOYA_VERSION_NUEVA: "v1.1.0",
    ...extra,
  };
  return { raiz, bin, entorno, traza, respaldos, gitRef, gitTags, cron, base };
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

function hashDe(codigo) {
  return createHash("sha256").update(codigo).digest("hex");
}

function codigoDe(salida) {
  const hallado = salida.match(/Código de configuración:\n([2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4})\n/);
  assert.ok(hallado, salida);
  return hallado[1];
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
    "DOMINIO_BASE=apps.miempresa.com",
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
  assert.match(resultado.stdout, /\[2\/5\] Dominio ✗ \*\.apps\.miempresa\.com apunta a 198\.51\.100\.7/);
  assert.match(resultado.stdout, /registro A:/);
  assert.match(resultado.stdout, /\*\.apps → 203\.0\.113\.10/);
  assert.match(resultado.stdout, /2\. Espera a que propague \(normalmente minutos\)\n3\. Sigue donde quedó:/);
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

function indice(lineas, prueba) {
  const i = lineas.findIndex(prueba);
  assert.notEqual(i, -1, lineas.join("\n"));
  return i;
}

function sinBinariosDelHost(lineas) {
  assert.equal(lineas.some((l) => /^(pg_dump|psql|prisma) /.test(l)), false, lineas.join("\n"));
}

it("Actualizar sin cortar", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  const resultado = correr("actualizar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  assert.match(resultado.stdout, /api, web y trabajador reiniciados · las apps publicadas no se cortan/);
  const lineas = lineasTraza(escena.traza);
  const sondeos = lineas.map((l, i) => ({ l, i })).filter(({ l }) => l.startsWith("curl ") && l.includes("https://api-tienda.apps.miempresa.com/"));
  const dump = indice(lineas, (l) => l.includes(" pg_dump --clean --if-exists"));
  const checkout = indice(lineas, (l) => l === "git checkout --quiet --detach v1.1.0");
  const build = indice(lineas, (l) => l.includes("build api web worker migracion"));
  const migracion = indice(lineas, (l) => l.includes("run --rm migracion"));
  const arriba = indice(lineas, (l) => l.includes("up -d --no-deps api web worker"));
  assert.ok(sondeos.length >= 3);
  assert.ok(sondeos[0].i < dump);
  assert.ok(dump < checkout && checkout < build && build < migracion && migracion < arriba);
  assert.ok(sondeos[sondeos.length - 1].i > arriba);
  assert.equal(lineas.some((l) => /\b(stop|down|restart)\b/.test(l)), false);
  assert.equal(lineas.some((l) => l.includes("api-tienda") && /\b(stop|rm|down)\b/.test(l)), false);
  sinBinariosDelHost(lineas);
  const version = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(version.instalada, "v1.1.0");
  assert.equal(version.disponible, null);
  assert.equal(version.versionAnterior, "v1.0.0");
  assert.equal(existsSync(join(escena.respaldos, "ultimo.json")), true);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Una app que no responde detiene la actualización antes de tocar nada", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  doble(escena.bin, "curl", sh([
    'printf "curl %s\\n" "$*" >> "$DEPLOYA_TRAZA"',
    'if [[ "$*" == *api-tienda* ]]; then exit 7; fi',
    "exit 0",
  ]));
  const resultado = correr("actualizar.sh", [], escena.entorno);
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stdout, /✗ api-tienda\.apps\.miempresa\.com dejó de responder\./);
  const lineas = lineasTraza(escena.traza);
  assert.equal(lineas.some((l) => l.includes("pg_dump") || l.includes("checkout") || l.includes("build")), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Sin versión nueva no se toca nada", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  writeFileSync(escena.gitTags, "v1.0.0\n");
  const resultado = correr("actualizar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  assert.match(resultado.stdout, /Ya estás en la última versión \(v1\.0\.0\)/);
  const lineas = lineasTraza(escena.traza);
  assert.equal(lineas.some((l) => l.includes("pg_dump") || l.includes("checkout") || l.includes("build")), false);
  const version = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(version.instalada, "v1.0.0");
  assert.equal(version.disponible, null);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Volver", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  const fallo = correr("actualizar.sh", [], { ...escena.entorno, DEPLOYA_MIGRACION_FALLA: "1" });
  assert.notEqual(fallo.status, 0);
  assert.match(fallo.stdout, /La migración falló\./);
  assert.equal(readFileSync(escena.base, "utf8"), "migracion-fallida\n");
  const tras = lineasTraza(escena.traza).length;
  const vuelta = correr("actualizar.sh", ["--volver"], escena.entorno);
  assert.equal(vuelta.status, 0, detalle(vuelta));
  assert.equal(readFileSync(escena.base, "utf8"), "estado-previo\n");
  const lineas = lineasTraza(escena.traza).slice(tras);
  const checkout = indice(lineas, (l) => l === "git checkout --quiet --detach v1.0.0");
  const build = indice(lineas, (l) => l.includes("build api web worker migracion"));
  const stop = indice(lineas, (l) => l.includes("stop api web worker"));
  const psql = indice(lineas, (l) => l.includes("psql --quiet -v ON_ERROR_STOP=1 --single-transaction"));
  const arriba = indice(lineas, (l) => l.includes("up -d --no-deps api web worker"));
  assert.ok(checkout < build && build < stop && stop < psql && psql < arriba);
  assert.equal(lineas.some((l) => l.includes("api-tienda") && /\b(stop|rm|down)\b/.test(l)), false);
  sinBinariosDelHost(lineasTraza(escena.traza));
  const version = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(version.instalada, "v1.0.0");
  assert.equal(version.disponible, "v1.1.0");
  assert.equal(readFileSync(escena.gitRef, "utf8").trim(), "v1.0.0");
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Respaldo sin la clave", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  ochoRespaldos(escena.entorno);
  const archivos = readdirSync(escena.respaldos).filter((n) => n.endsWith(".tar.gz"));
  assert.equal(archivos.length, 7);
  assert.equal(archivos.includes("2026-10-01T030000Z.tar.gz"), false);
  assert.equal(archivos.includes("2026-10-08T030000Z.tar.gz"), true);
  const texto = execFileSync("tar", ["-xOzf", join(escena.respaldos, "2026-10-08T030000Z.tar.gz")], { encoding: "utf8" });
  assert.equal(texto.includes("CLAVE_CIFRADO_VARIABLES"), false);
  assert.equal(texto.includes(CLAVE), false);
  assert.match(texto, /MODO_INSTALACION=autoalojado/);
  const ultimo = JSON.parse(readFileSync(join(escena.respaldos, "ultimo.json"), "utf8"));
  assert.equal(ultimo.ultimo, "2026-10-08T03:00:00Z");
  assert.equal(ultimo.ruta.endsWith("/2026-10-08T030000Z.tar.gz"), true);
  assert.equal(ultimo.programa, "diario");
  assert.equal(ultimo.hora, "03:00");
  assert.equal(ultimo.conserva, 7);
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

it("Código que la API puede validar", () => {
  const escena = escenario();
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  const codigo = codigoDe(resultado.stdout);
  const texto = readFileSync(escena.entorno.DEPLOYA_ENV, "utf8");
  const hash = hashDe(codigo);
  assert.equal(valor(texto, "HASH_CODIGO_CONFIGURACION"), hash);
  assert.equal(valor(texto, "CODIGO_VENCE"), "2026-10-20T03:30:00Z");
  assert.equal(texto.includes(codigo), false);
  const log = readFileSync(join(escena.entorno.DEPLOYA_HOME, "instalacion.log"), "utf8");
  assert.equal(log.includes(codigo), false);
  const yml = readFileSync(join(repo, "docker-compose.autoalojado.yml"), "utf8");
  assert.match(yml, /migracion:[\s\S]*MODO_INSTALACION: autoalojado/);
  assert.match(yml, /HASH_CODIGO_CONFIGURACION/);
  assert.equal(lineasTraza(escena.traza).some((l) => l.includes("/configurar")), false);
  assert.equal(lineasTraza(escena.traza).some((l) => l.includes("token-de-prueba")), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Código nuevo invalida el anterior", () => {
  const escena = escenario();
  const primero = correr("instalar.sh", [], escena.entorno);
  assert.equal(primero.status, 0, detalle(primero));
  const codigo1 = codigoDe(primero.stdout);
  const hash1 = valor(readFileSync(escena.entorno.DEPLOYA_ENV, "utf8"), "HASH_CODIGO_CONFIGURACION");
  const segundo = correr("instalar.sh", ["--codigo-nuevo"], { ...escena.entorno, DEPLOYA_AHORA: "2026-10-20T04:00:00Z" });
  assert.equal(segundo.status, 0, detalle(segundo));
  const codigo2 = codigoDe(segundo.stdout);
  const texto = readFileSync(escena.entorno.DEPLOYA_ENV, "utf8");
  assert.notEqual(codigo2, codigo1);
  assert.equal(valor(texto, "HASH_CODIGO_CONFIGURACION"), hashDe(codigo2));
  assert.notEqual(valor(texto, "HASH_CODIGO_CONFIGURACION"), hash1);
  assert.equal(valor(texto, "CODIGO_VENCE"), "2026-10-20T04:30:00Z");
  const migraciones = lineasTraza(escena.traza).filter((l) => l.includes("migracion"));
  assert.ok(migraciones.length >= 2);
  const conAdmin = correr("instalar.sh", ["--codigo-nuevo"], { ...escena.entorno, DEPLOYA_HAY_ADMIN: "1" });
  assert.notEqual(conAdmin.status, 0);
  assert.match(conAdmin.stdout, /Ya hay un administrador/);
  assert.equal(valor(readFileSync(escena.entorno.DEPLOYA_ENV, "utf8"), "HASH_CODIGO_CONFIGURACION"), hashDe(codigo2));
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("HTTPS espera al certificado", () => {
  const escena = escenario();
  const curlN = join(escena.raiz, "curl-n");
  escena.entorno.DEPLOYA_CURL_FALLOS = "2";
  escena.entorno.DEPLOYA_CURL_N = curlN;
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  const https = lineasTraza(escena.traza).filter((l) => l.startsWith("curl ") && l.includes("https://apps.miempresa.com/"));
  assert.ok(https.length >= 3, https.join("\n"));
  assert.equal(https.some((l) => l.includes("/configurar")), false);
  assert.match(resultado.stdout, /Comodín emitido por Let's Encrypt · vence 18 ene 2027/);
  const antes = resultado.stdout.split("[4/5]")[0];
  assert.equal(antes.includes("emitido"), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("La raíz del dominio también se comprueba", () => {
  const escena = escenario({ DEPLOYA_DIG_APEX: "198.51.100.8" });
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.notEqual(resultado.status, 0);
  assert.equal(existsSync(escena.entorno.DEPLOYA_ENV), false);
  assert.match(resultado.stdout, /apps\.miempresa\.com apunta a 198\.51\.100\.8, no a esta máquina \(203\.0\.113\.10\)\./);
  assert.match(resultado.stdout, /^apps → 203\.0\.113\.10$/m);
  assert.equal(resultado.stdout.includes("*.apps →"), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Un CNAME no se toma por una IP", () => {
  const escena = escenario({ DEPLOYA_DIG_CNAME: "1" });
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  assert.match(resultado.stdout, /\[2\/5\] Dominio ✓ \*\.apps\.miempresa\.com → 203\.0\.113\.10 \(esta máquina\)/);
  assert.match(resultado.stdout, /\[2\/5\] Dominio ✓ apps\.miempresa\.com → 203\.0\.113\.10 \(esta máquina\)/);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Token del proveedor inválido", () => {
  const escena = escenario({ DEPLOYA_TOKEN_DNS: "token-malo" });
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.notEqual(resultado.status, 0);
  assert.equal(existsSync(escena.entorno.DEPLOYA_ENV), false);
  assert.match(resultado.stdout, /\[3\/5\] Certificado ✗ El token del proveedor DNS no es válido\./);
  assert.equal(resultado.stdout.includes("emitido"), false);
  assert.equal(resultado.stdout.includes("[4/5]"), false);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Versión disponible", () => {
  const escena = escenario();
  const instalado = correr("instalar.sh", [], escena.entorno);
  assert.equal(instalado.status, 0, detalle(instalado));
  const trasInstalar = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(trasInstalar.instalada, "v1.0.0");
  assert.equal(trasInstalar.disponible, "v1.1.0");
  writeFileSync(escena.gitTags, "v1.0.0\nv1.1.0\nv1.2.0\n");
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  const actualizado = correr("actualizar.sh", [], escena.entorno);
  assert.equal(actualizado.status, 0, detalle(actualizado));
  const version = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(version.instalada, "v1.2.0");
  assert.equal(version.disponible, null);
  writeFileSync(escena.gitTags, "v1.0.0\nv1.1.0\nv1.2.0\nv1.3.0\n");
  const respaldo = correr("respaldar.sh", [], escena.entorno);
  assert.equal(respaldo.status, 0, detalle(respaldo));
  const trasRespaldo = JSON.parse(readFileSync(join(escena.respaldos, "version.json"), "utf8"));
  assert.equal(trasRespaldo.instalada, "v1.2.0");
  assert.equal(trasRespaldo.disponible, "v1.3.0");
  const trazas = lineasTraza(escena.traza);
  assert.ok(trazas.some((l) => l.startsWith("git fetch")));
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Dos respaldos del mismo día no se pisan", () => {
  const escena = escenario();
  entornoPlano(escena.entorno.DEPLOYA_ENV);
  const manana = correr("respaldar.sh", [], { ...escena.entorno, DEPLOYA_AHORA: "2026-10-20T03:00:00Z" });
  assert.equal(manana.status, 0, detalle(manana));
  const tarde = correr("respaldar.sh", [], { ...escena.entorno, DEPLOYA_AHORA: "2026-10-20T15:04:00Z" });
  assert.equal(tarde.status, 0, detalle(tarde));
  const archivos = readdirSync(escena.respaldos).filter((n) => n.endsWith(".tar.gz"));
  assert.equal(archivos.includes("2026-10-20T030000Z.tar.gz"), true);
  assert.equal(archivos.includes("2026-10-20T150400Z.tar.gz"), true);
  const ultimo = JSON.parse(readFileSync(join(escena.respaldos, "ultimo.json"), "utf8"));
  assert.equal(ultimo.ultimo, "2026-10-20T15:04:00Z");
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Salida de etapa correcta", () => {
  const escena = escenario();
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.equal(resultado.status, 0, detalle(resultado));
  assert.match(resultado.stdout, /\[1\/5\] Requisitos ✓ Docker 27\.3 · Compose v2 · 3\.8 GB de RAM · 61 GB libres/);
  assert.match(resultado.stdout, /\[1\/5\] Requisitos ✓ Puertos 80 y 443 libres/);
  assert.match(resultado.stdout, /\[4\/5\] Servicios ✓ postgres · redis · api · web · trabajador · traefik/);
  assert.match(resultado.stdout, /\[5\/5\] Administrador ✓ → Abre https:\/\/apps\.miempresa\.com\/configurar/);
  const cron = readFileSync(escena.cron, "utf8");
  assert.match(cron, /0 3 \* \* \* root .*scripts\/respaldar\.sh/);
  const programa = JSON.parse(readFileSync(join(escena.respaldos, "programa.json"), "utf8"));
  assert.equal(programa.programa, "diario");
  assert.equal(programa.hora, "03:00");
  assert.equal(programa.conserva, 7);
  rmSync(escena.raiz, { recursive: true, force: true });
});

it("Pasos de qué hacer en líneas distintas", () => {
  const escena = escenario({ DEPLOYA_DIG_IP: "198.51.100.7" });
  const resultado = correr("instalar.sh", [], escena.entorno);
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stdout, /2\. Espera a que propague \(normalmente minutos\)\n3\. Sigue donde quedó:\n\.\/scripts\/instalar\.sh --continuar/);
  rmSync(escena.raiz, { recursive: true, force: true });
});
