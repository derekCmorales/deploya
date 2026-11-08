/**
 * QA-01 · Recorrido e2e de la API contra el compose real (job «Smoke compose» del CI).
 *
 * Camino feliz: registro → enlace de Mailpit → verificar → sesión → Starter → `hola-deploya`
 * → despliegue #1 encolado. Negativos: 403 sin verificar, 403 de un Cliente en admin, 404 de un
 * proyecto ajeno y 429 al sexto fallo de contraseña (EST-01a).
 *
 * Sin dependencias: `fetch` de Node 22. Cada corrida usa un correo y un nombre de proyecto
 * nuevos, así que se puede repetir sobre la misma base.
 *
 *   API_URL=http://localhost:3001 MAILPIT_URL=http://localhost:8025 \
 *   ADMIN_CORREO=admin@deploya.app ADMIN_CLAVE=… node e2e/recorrido.mjs
 */

const API = process.env.API_URL ?? "http://localhost:3001";
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
const ADMIN_CORREO = process.env.ADMIN_CORREO ?? "admin@deploya.app";
const ADMIN_CLAVE = process.env.ADMIN_CLAVE;
const REPOSITORIO = process.env.REPOSITORIO ?? "https://github.com/derekCmorales/hola-deploya";
const RAMA = process.env.RAMA ?? "main";

const SUFIJO = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
const CORREO = `e2e-${SUFIJO}@deploya.test`;
const CONTRASENA = "Recorrido-E2e#2026";
const PROYECTO = `hola-deploya-${SUFIJO}`;

/** Tarjeta que aprueba en la pasarela simulada (M2-03). */
const TARJETA_APRUEBA = { titular: "Recorrido E2E", numero: "4242424242424242", vencimiento: "12/29", cvc: "123" };
/** EST-01a: 5 fallos por IP y correo en 15 min; el sexto responde 429. */
const FALLOS_ANTES_DEL_LIMITE = 5;

const ESPERA_CORREO_MS = 30_000;
const PAUSA_MS = 1_000;

const pasos = [];

function paso(nombre) {
  pasos.push(nombre);
  console.log(`✓ ${nombre}`);
}

class FalloRecorrido extends Error {}

function exigir(condicion, mensaje) {
  if (!condicion) throw new FalloRecorrido(mensaje);
}

/** Cliente con su propia cookie de sesión: el Cliente y el Administrador no se mezclan. */
function cliente() {
  let cookie = "";
  return async function pedir(metodo, ruta, cuerpo) {
    const respuesta = await fetch(`${API}${ruta}`, {
      method: metodo,
      headers: { ...(cuerpo ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const puesta = respuesta.headers.get("set-cookie");
    if (puesta) cookie = puesta.split(";")[0];
    const texto = await respuesta.text();
    let json = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      json = { texto };
    }
    return { estado: respuesta.status, cabeceras: respuesta.headers, json };
  };
}

function describir({ estado, json }) {
  return `${estado} ${JSON.stringify(json)?.slice(0, 300)}`;
}

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/** El token del enlace «Confirma tu correo» que M10 dejó en Mailpit (ADR 0001). */
async function tokenDeVerificacion(correo) {
  const limite = Date.now() + ESPERA_CORREO_MS;
  while (Date.now() < limite) {
    const busqueda = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${correo}`)}`);
    exigir(busqueda.ok, `Mailpit no respondió (${busqueda.status}) en ${MAILPIT}`);
    const { messages } = await busqueda.json();
    if (messages?.length) {
      const mensaje = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
      const enlace = /\/verificar\?token=([^\s"'<>&]+)/.exec(`${mensaje.Text ?? ""}\n${mensaje.HTML ?? ""}`);
      exigir(enlace, "El correo de verificación no trae el enlace /verificar?token=");
      return decodeURIComponent(enlace[1]);
    }
    await pausa(PAUSA_MS);
  }
  throw new FalloRecorrido(`No llegó a Mailpit el correo de verificación de ${correo} en ${ESPERA_CORREO_MS / 1000} s`);
}

async function caminoFeliz(clienteNuevo) {
  const registro = await clienteNuevo("POST", "/identidad/registro", { correo: CORREO, contrasena: CONTRASENA, confirmacion: CONTRASENA });
  exigir(registro.estado === 201, `registro → ${describir(registro)}`);
  paso(`Registro de ${CORREO} (201, pendiente de verificación)`);

  const sinVerificar = await clienteNuevo("POST", "/identidad/sesion", { correo: CORREO, contrasena: CONTRASENA });
  exigir(sinVerificar.estado === 403 && sinVerificar.json?.codigo === "CuentaNoVerificada", `sesión sin verificar → ${describir(sinVerificar)}`);
  paso("Negativo: iniciar sesión sin verificar responde 403 CuentaNoVerificada");

  const token = await tokenDeVerificacion(CORREO);
  paso("Enlace de verificación leído de Mailpit");

  const verificacion = await clienteNuevo("POST", "/identidad/verificacion", { token });
  exigir(verificacion.estado === 200, `verificación → ${describir(verificacion)}`);
  paso("Cuenta verificada (200)");

  const sesion = await clienteNuevo("POST", "/identidad/sesion", { correo: CORREO, contrasena: CONTRASENA });
  exigir(sesion.estado === 200 && sesion.json?.usuario?.rol === "cliente", `sesión → ${describir(sesion)}`);
  paso("Sesión iniciada como Cliente (cookie deploya_sesion)");

  const contratacion = await clienteNuevo("POST", "/suscripciones/contratar", { plan: "starter", vigenciaDias: 30, tarjeta: TARJETA_APRUEBA });
  exigir(contratacion.estado === 200 && contratacion.json?.resultado === "aprobado", `contratar Starter → ${describir(contratacion)}`);
  paso("Starter contratado con la pasarela simulada (aprobado)");

  const alta = await clienteNuevo("POST", "/proyectos", { url: REPOSITORIO, rama: RAMA, nombre: PROYECTO });
  exigir(alta.estado === 201 && alta.json?.proyecto?.id, `alta de ${PROYECTO} → ${describir(alta)}`);
  exigir(alta.json.despliegue?.numero === 1 && alta.json.despliegue?.estado === "encolado", `el alta no encoló el despliegue #1 → ${describir(alta)}`);
  paso(`Proyecto ${PROYECTO} creado desde ${REPOSITORIO}#${RAMA} y despliegue #1 encolado`);

  return alta.json.proyecto.id;
}

async function negativos(clienteNuevo, proyectoId) {
  const adminComoCliente = await clienteNuevo("GET", "/admin/usuarios");
  exigir(adminComoCliente.estado === 403, `Cliente en /admin/usuarios → ${describir(adminComoCliente)}`);
  paso("Negativo: un Cliente en /admin/usuarios responde 403");

  if (!ADMIN_CLAVE) {
    console.log("· Sin ADMIN_CLAVE: se salta el 404 de proyecto ajeno");
  } else {
    const otro = cliente();
    const sesionAdmin = await otro("POST", "/identidad/sesion", { correo: ADMIN_CORREO, contrasena: ADMIN_CLAVE });
    exigir(sesionAdmin.estado === 200, `sesión del administrador → ${describir(sesionAdmin)}`);
    const ajeno = await otro("GET", `/proyectos/${proyectoId}/despliegues`);
    exigir(ajeno.estado === 404, `proyecto ajeno → ${describir(ajeno)}`);
    paso("Negativo: los despliegues de un proyecto ajeno responden 404");
  }

  // Al final: deja bloqueado este correo desde esta IP durante 15 minutos.
  const intruso = cliente();
  for (let fallo = 1; fallo <= FALLOS_ANTES_DEL_LIMITE; fallo += 1) {
    const intento = await intruso("POST", "/identidad/sesion", { correo: CORREO, contrasena: `mala-${fallo}` });
    exigir(intento.estado === 401, `fallo ${fallo} de contraseña → ${describir(intento)}`);
  }
  const sexto = await intruso("POST", "/identidad/sesion", { correo: CORREO, contrasena: CONTRASENA });
  const espera = Number(sexto.cabeceras.get("retry-after"));
  exigir(sexto.estado === 429 && sexto.json?.codigo === "DemasiadosIntentos", `sexto intento → ${describir(sexto)}`);
  exigir(Number.isInteger(espera) && espera > 0, `el 429 no trae Retry-After (${sexto.cabeceras.get("retry-after")})`);
  paso(`Negativo: el sexto intento responde 429 con Retry-After: ${espera} aunque la contraseña sea correcta`);
}

async function main() {
  const clienteNuevo = cliente();
  const proyectoId = await caminoFeliz(clienteNuevo);
  await negativos(clienteNuevo, proyectoId);
  console.log(`recorrido e2e ok (${pasos.length} pasos)`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof FalloRecorrido ? error.message : error.stack ?? error}`);
  process.exit(1);
});
