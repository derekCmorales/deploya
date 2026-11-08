/**
 * L7 · Recorrido del motor en el VPS (a mano, no en CI: necesita Docker, Traefik, DNS y HTTPS reales).
 *
 * Con una cuenta que ya tiene `hola-deploya` creado (L3):
 *   1. Despliega y espera Saludable; la URL HTTPS responde 200 con un certificado válido.
 *   2. Revierte a la versión #1 sin reconstruir y vuelve a la última.
 *   3. Despliega otra vez y cancela mientras está en Construyendo.
 *
 *   API_URL=https://api.<dominio> CORREO=cliente@deploya.app CLAVE=… PROYECTO=hola-deploya node e2e/vps.mjs
 *
 * Sin dependencias: `fetch` de Node 22 (valida el certificado igual que un navegador).
 */

const API = process.env.API_URL;
const CORREO = process.env.CORREO;
const CLAVE = process.env.CLAVE;
const PROYECTO = process.env.PROYECTO ?? "hola-deploya";

const ESPERA_SALUDABLE_MS = 5 * 60_000;
const ESPERA_REVERSION_MS = 60_000;
const PAUSA_MS = 3_000;
const TERMINALES = new Set(["saludable", "fallido", "cancelado", "detenido"]);

class FalloVps extends Error {}

function exigir(condicion, mensaje) {
  if (!condicion) throw new FalloVps(mensaje);
}

let cookie = "";

async function pedir(metodo, ruta, cuerpo) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { ...(cuerpo ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const puesta = respuesta.headers.get("set-cookie");
  if (puesta) cookie = puesta.split(";")[0];
  const texto = await respuesta.text();
  return { estado: respuesta.status, json: texto ? JSON.parse(texto) : null };
}

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function esperarEstado(despliegueId, aceptar, limiteMs) {
  const limite = Date.now() + limiteMs;
  while (Date.now() < limite) {
    const { json } = await pedir("GET", `/despliegues/${despliegueId}`);
    if (aceptar(json.estado)) return json;
    await pausa(PAUSA_MS);
  }
  throw new FalloVps(`El despliegue ${despliegueId} no llegó al estado esperado en ${limiteMs / 1000} s`);
}

async function desplegarYEsperar(proyectoId) {
  const inicio = Date.now();
  const nuevo = await pedir("POST", `/proyectos/${proyectoId}/despliegues`);
  exigir(nuevo.estado === 201, `desplegar → ${nuevo.estado} ${JSON.stringify(nuevo.json)}`);
  const final = await esperarEstado(nuevo.json.id, (e) => TERMINALES.has(e), ESPERA_SALUDABLE_MS);
  exigir(final.estado === "saludable", `#${final.numero} terminó en ${final.estado}: ${final.motivoFallo ?? ""}`);
  console.log(`✓ #${final.numero} Saludable en ${Math.round((Date.now() - inicio) / 1000)} s · ${final.url}`);
  return final;
}

async function exigirHttps(url) {
  exigir(url?.startsWith("https://"), `La URL no es HTTPS: ${url}`);
  const respuesta = await fetch(url);
  exigir(respuesta.ok, `${url} → ${respuesta.status}`);
  console.log(`✓ ${url} responde ${respuesta.status} con certificado válido`);
}

async function revertirA(proyectoId, artefacto) {
  const inicio = Date.now();
  const reversion = await pedir("POST", `/proyectos/${proyectoId}/reversiones`, { artefactoId: artefacto.id });
  exigir(reversion.estado === 201, `revertir a imagen #${artefacto.numero} → ${reversion.estado} ${JSON.stringify(reversion.json)}`);
  const final = await esperarEstado(reversion.json.id, (e) => TERMINALES.has(e), ESPERA_REVERSION_MS);
  exigir(final.estado === "saludable", `la reversión terminó en ${final.estado}`);
  const segundos = (Date.now() - inicio) / 1000;
  console.log(`✓ Revertido a la imagen #${artefacto.numero} sin reconstruir en ${segundos.toFixed(1)} s (despliegue #${final.numero})`);
  return final;
}

async function main() {
  exigir(API && CORREO && CLAVE, "Faltan API_URL, CORREO o CLAVE");
  const sesion = await pedir("POST", "/identidad/sesion", { correo: CORREO, contrasena: CLAVE });
  exigir(sesion.estado === 200, `sesión → ${sesion.estado}`);

  const { json: lista } = await pedir("GET", "/proyectos");
  const proyecto = lista.proyectos.find((p) => p.nombre === PROYECTO);
  exigir(proyecto, `${CORREO} no tiene el proyecto ${PROYECTO} (L3)`);

  // 1. Desplegar y ver la URL con candado.
  const saludable = await desplegarYEsperar(proyecto.id);
  await exigirHttps(saludable.url);

  // 2. Revertir a la primera imagen y volver a la más reciente.
  const { json: artefactos } = await pedir("GET", `/proyectos/${proyecto.id}/artefactos`);
  const disponibles = artefactos.filter((a) => a.disponible);
  exigir(disponibles.length >= 2, "Hacen falta al menos dos imágenes disponibles para revertir");
  const primera = disponibles.at(-1);
  const ultima = disponibles[0];
  await revertirA(proyecto.id, primera);
  await exigirHttps(saludable.url);
  await revertirA(proyecto.id, ultima);
  await exigirHttps(saludable.url);

  // 3. Cancelar un despliegue en Construyendo; el anterior sigue atendiendo.
  const nuevo = await pedir("POST", `/proyectos/${proyecto.id}/despliegues`);
  exigir(nuevo.estado === 201, `desplegar para cancelar → ${nuevo.estado}`);
  const enCurso = await esperarEstado(nuevo.json.id, (e) => e === "construyendo" || TERMINALES.has(e), ESPERA_REVERSION_MS);
  exigir(!TERMINALES.has(enCurso.estado), `#${enCurso.numero} terminó (${enCurso.estado}) antes de poder cancelarlo: repetir`);
  const cancelado = await pedir("POST", `/despliegues/${nuevo.json.id}/cancelar`);
  exigir(cancelado.estado === 200, `cancelar → ${cancelado.estado} ${JSON.stringify(cancelado.json)}`);
  await esperarEstado(nuevo.json.id, (e) => e === "cancelado", ESPERA_REVERSION_MS);
  console.log(`✓ #${nuevo.json.numero} cancelado en Construyendo`);
  await exigirHttps(saludable.url);

  console.log("recorrido del VPS ok");
}

main().catch((error) => {
  console.error(`✗ ${error instanceof FalloVps ? error.message : (error.stack ?? error)}`);
  process.exit(1);
});
