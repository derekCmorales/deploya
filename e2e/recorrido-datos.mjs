/**
 * Recorrido e2e de los recursos de datos administrados (feat/m5-recursos-datos) contra el compose real
 * y el dockerd de la máquina. Contrato: docs/contratos/recursos-datos.md.
 *
 * Registro → verificación (Mailpit) → plan Pro → proyecto A (repo público con Dockerfile) → Postgres y Redis
 * → despliegue → variables inyectadas, conexión desde la red del proyecto, persistencia tras redesplegar,
 * compartir con el proyecto B, GET conexion, `comandoInicio` en `docker inspect` y borrado del dueño
 * (contenedor y volumen). Necesita `docker` en el PATH y la API arriba.
 *
 *   API_URL=http://localhost:3001 MAILPIT_URL=http://localhost:8025 node e2e/recorrido-datos.mjs
 */
import { execFileSync } from "node:child_process";

const API = process.env.API_URL ?? "http://localhost:3001";
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
const REPOSITORIO = process.env.REPOSITORIO ?? "https://github.com/derekCmorales/hola-deploya";
const RAMA = process.env.RAMA ?? "main";
const IMAGEN_PSQL = "pgvector/pgvector:pg17";

const SUFIJO = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e3).toString(36)}`;
const CORREO = `datos-${SUFIJO}@deploya.test`;
const CONTRASENA = "Recorrido-E2e#2026";
const TARJETA = { titular: "Recorrido Datos", numero: "4242424242424242", vencimiento: "12/29", cvc: "123" };
const ESPERA_MAX_MS = 240_000;

class FalloRecorrido extends Error {}
const exigir = (condicion, mensaje) => {
  if (!condicion) throw new FalloRecorrido(mensaje);
};
let pasos = 0;
const paso = (texto) => console.log(`✓ ${++pasos}. ${texto}`);
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const describir = (r) => `${r.estado} ${JSON.stringify(r.json)?.slice(0, 300)}`;

function docker(...args) {
  return execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
const dockerOpcional = (...args) => {
  try {
    return docker(...args);
  } catch {
    return "";
  }
};

function cliente() {
  let cookie = "";
  return async (metodo, ruta, cuerpo) => {
    const r = await fetch(`${API}${ruta}`, {
      method: metodo,
      headers: { ...(cuerpo ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const puesta = r.headers.get("set-cookie");
    if (puesta) cookie = puesta.split(";")[0];
    const texto = await r.text();
    let json = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      json = { texto };
    }
    return { estado: r.status, json };
  };
}

async function esperar(descripcion, sonda) {
  const limite = Date.now() + ESPERA_MAX_MS;
  let ultimo;
  while (Date.now() < limite) {
    ultimo = await sonda();
    if (ultimo.listo) return ultimo.valor;
    await pausa(2_000);
  }
  throw new FalloRecorrido(`tiempo agotado: ${descripcion} (${JSON.stringify(ultimo?.valor)?.slice(0, 300)})`);
}

async function tokenDeVerificacion() {
  return esperar("correo de verificación en Mailpit", async () => {
    const busqueda = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${CORREO}`)}`)).json();
    const id = busqueda.messages?.[0]?.ID;
    if (!id) return { listo: false };
    const mensaje = await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json();
    const token = /token=([A-Za-z0-9_-]+)/.exec(`${mensaje.Text}\n${mensaje.HTML}`)?.[1];
    return { listo: Boolean(token), valor: token };
  });
}

async function desplegarYEsperar(pedir, proyectoId, numero) {
  const estado = await esperar(`despliegue #${numero} saludable`, async () => {
    const r = await pedir("GET", `/proyectos/${proyectoId}/despliegues/${numero}`);
    const e = r.json?.estado;
    exigir(e !== "fallido" && e !== "cancelado", `despliegue #${numero} ${e}: ${describir(r)}`);
    return { listo: e === "saludable", valor: e };
  });
  return estado;
}

/** `nombreContenedor` del motor: `deploya-<subdominio>-<número de despliegue>`. */
const contenedorApp = (subdominio, numero) => `deploya-${subdominio}-${numero}`;

async function main() {
  const pedir = cliente();
  const nombreA = `datos-a-${SUFIJO}`;
  const nombreB = `datos-b-${SUFIJO}`;
  let subA;
  let subB;
  const creados = [];
  try {
    exigir((await pedir("POST", "/identidad/registro", { correo: CORREO, contrasena: CONTRASENA, confirmacion: CONTRASENA })).estado === 201, "registro");
    const verificacion = await pedir("POST", "/identidad/verificacion", { token: await tokenDeVerificacion() });
    exigir(verificacion.estado === 200, `verificación ${describir(verificacion)}`);
    const sesion = await pedir("POST", "/identidad/sesion", { correo: CORREO, contrasena: CONTRASENA });
    exigir(sesion.estado === 200, `sesión ${describir(sesion)}`);
    paso("Usuario registrado, verificado por Mailpit y con sesión");

    const pro = await pedir("POST", "/suscripciones/contratar", { plan: "pro", vigenciaDias: 30, tarjeta: TARJETA });
    exigir(pro.estado === 200 && pro.json?.resultado === "aprobado", `plan Pro ${describir(pro)}`);
    paso("Plan Pro contratado (4242…)");

    const altaA = await pedir("POST", "/proyectos", { url: REPOSITORIO, rama: RAMA, nombre: nombreA });
    exigir(altaA.estado === 201, `alta A ${describir(altaA)}`);
    const idA = altaA.json.proyecto.id;
    subA = altaA.json.proyecto.subdominio;
    creados.push(subA);
    await desplegarYEsperar(pedir, idA, 1);
    paso(`Proyecto A (${subA}) desplegado desde ${REPOSITORIO}`);

    const pg = await pedir("POST", `/proyectos/${idA}/datos`, { tipo: "postgres" });
    const rd = await pedir("POST", `/proyectos/${idA}/datos`, { tipo: "redis" });
    exigir(pg.estado === 201 && rd.estado === 201, `crear datos ${describir(pg)} ${describir(rd)}`);
    await esperar("recursos disponibles", async () => {
      const r = await pedir("GET", `/proyectos/${idA}/datos`);
      const estados = (r.json?.recursos ?? []).map((x) => x.estado);
      exigir(!estados.includes("error"), `recurso en error ${describir(r)}`);
      return { listo: estados.length === 2 && estados.every((e) => e === "disponible"), valor: estados };
    });
    const hostPg = `deploya-datos-${subA}-postgres`;
    exigir(docker("inspect", "-f", "{{.State.Running}}", hostPg) === "true", "el contenedor de Postgres no corre");
    paso("Postgres y Redis `disponible` (contenedores corriendo)");

    const conexion = await pedir("GET", `/proyectos/${idA}/datos/${pg.json.id}/conexion`);
    const vars = conexion.json?.variables ?? {};
    exigir(conexion.estado === 200 && vars.DATABASE_URL && vars.PGPASSWORD && vars.PGHOST === hostPg, `conexion ${describir(conexion)}`);
    const conexionRedis = await pedir("GET", `/proyectos/${idA}/datos/${rd.json.id}/conexion`);
    exigir(conexionRedis.json?.variables?.REDIS_URL?.startsWith("redis://"), `conexion redis ${describir(conexionRedis)}`);
    paso("GET conexion devuelve DATABASE_URL/PG* y REDIS_URL");

    const red = `deploya-p-${subA}`;
    const psql = (url, sql) => docker("run", "--rm", "--network", red, IMAGEN_PSQL, "psql", url, "-tAc", sql);
    exigir(psql(vars.DATABASE_URL, "select 1") === "1", "select 1 desde la red del proyecto");
    psql(vars.DATABASE_URL, "create table if not exists persistencia(v text); insert into persistencia values ('sigue aqui')");
    paso(`Desde la red ${red} se conecta a Postgres y se crea una tabla`);

    exigir((await pedir("POST", `/proyectos/${idA}/despliegues`)).estado === 201, "redespliegue #2");
    await desplegarYEsperar(pedir, idA, 2);
    const app = contenedorApp(subA, 2);
    exigir(dockerOpcional("inspect", "-f", "{{.Name}}", app), `contenedor ${app} no encontrado`);
    const entorno = docker("inspect", "-f", "{{range .Config.Env}}{{println .}}{{end}}", app);
    for (const nombre of ["DATABASE_URL=", "REDIS_URL=", "DEPLOYA_POSTGRES_URL=", "DEPLOYA_REDIS_URL="]) {
      exigir(entorno.includes(`\n${nombre}`) || entorno.startsWith(nombre), `la app no tiene ${nombre}`);
    }
    paso(`El contenedor ${app} tiene DATABASE_URL, REDIS_URL y DEPLOYA_* inyectadas`);

    exigir(psql(vars.DATABASE_URL, "select v from persistencia") === "sigue aqui", "la tabla no persistió");
    paso("La data de Postgres persiste tras redesplegar");

    const altaB = await pedir("POST", "/proyectos", { url: REPOSITORIO, rama: RAMA, nombre: nombreB });
    exigir(altaB.estado === 201, `alta B ${describir(altaB)}`);
    const idB = altaB.json.proyecto.id;
    subB = altaB.json.proyecto.subdominio;
    creados.push(subB);
    await desplegarYEsperar(pedir, idB, 1);
    const compartido = await pedir("POST", `/proyectos/${idA}/datos/${pg.json.id}/compartir`, { proyectoId: idB });
    exigir(compartido.estado === 200, `compartir ${describir(compartido)}`);
    // La conexión a la red de B la hace el trabajador de forma asíncrona (cola de datos).
    await esperar("el recurso en las redes de A y B", async () => {
      const redes = docker("inspect", "-f", "{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}", hostPg);
      return { listo: redes.includes(`deploya-p-${subA}`) && redes.includes(`deploya-p-${subB}`), valor: redes };
    });
    paso("Postgres compartido: el contenedor de datos está en las redes de A y B");

    const patch = await pedir("PATCH", `/proyectos/${idA}`, { comandoInicio: "node server.js --e2e 'con espacio'" });
    exigir(patch.estado === 200, `PATCH comandoInicio ${describir(patch)}`);
    exigir((await pedir("POST", `/proyectos/${idA}/despliegues`)).estado === 201, "redespliegue #3");
    await desplegarYEsperar(pedir, idA, 3);
    const cmd = JSON.parse(docker("inspect", "-f", "{{json .Config.Cmd}}", contenedorApp(subA, 3)));
    exigir(JSON.stringify(cmd) === JSON.stringify(["node", "server.js", "--e2e", "con espacio"]), `Cmd = ${JSON.stringify(cmd)}`);
    paso("comandoInicio por PATCH se refleja en Cmd tras redesplegar");

    const borrado = await pedir("DELETE", `/proyectos/${idA}`, { confirmacion: nombreA });
    exigir(borrado.estado === 204, `eliminar A ${describir(borrado)}`);
    await esperar("contenedores y volúmenes del dueño eliminados", async () => {
      const resto = [dockerOpcional("ps", "-a", "--filter", `name=deploya-datos-${subA}`, "--format", "{{.Names}}"), dockerOpcional("volume", "ls", "-q", "--filter", `name=deploya-datos-${subA}`)].join("");
      return { listo: resto === "", valor: resto };
    });
    paso("Eliminar el proyecto dueño borra el contenedor y el volumen de datos");

    console.log(`recorrido de datos ok (${pasos} pasos)`);
  } finally {
    if (process.env.E2E_CONSERVAR !== "1") {
      for (const sub of creados) {
        for (const id of dockerOpcional("ps", "-aq", "--filter", `name=${sub}`).split("\n").filter(Boolean)) dockerOpcional("rm", "-f", id);
        for (const v of dockerOpcional("volume", "ls", "-q", "--filter", `name=deploya-datos-${sub}`).split("\n").filter(Boolean)) dockerOpcional("volume", "rm", "-f", v);
      }
    }
  }
}

main().catch((error) => {
  console.error(`✗ ${error instanceof FalloRecorrido ? error.message : (error.stack ?? error)}`);
  process.exit(1);
});
