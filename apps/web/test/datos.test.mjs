import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  clienteDatos,
  confirmacionRecursoCoincide,
  discoCercaDelLimite,
  errorDeDatos,
  fraccionDisco,
  hayRecursoCreando,
  limiteAlcanzado,
  opcionesCrear,
  proyectosParaCompartir,
  textoAvisoDisco,
  textoHost,
  textoLimite,
  textoMb,
  textoMotivo,
} from "../src/lib/datos.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..", "..");
const leer = (ruta) => readFileSync(join(root, ruta), "utf8");
const COMPONENTES = "src/app/(projects)/projects/_componentes";

const POSTGRES = {
  id: "rd-1",
  tipo: "postgres",
  nombre: "PostgreSQL 17 + pgvector",
  estado: "disponible",
  detalle: null,
  host: "deploya-datos-api-tienda-postgres",
  puerto: 5432,
  urlPublica: null,
  esDueno: true,
  proyectoDueno: { id: "p-1", nombre: "api-tienda" },
  compartidoCon: [{ id: "p-2", nombre: "worker-tienda" }],
  usoDiscoMb: 1900,
  limiteDiscoMb: 2048,
  variablesInyectadas: ["DATABASE_URL", "PGHOST"],
  creado: "2026-11-10T10:00:00Z",
};

const lista = (parcial = {}) => ({
  recursos: [],
  limite: { usados: 0, maximo: 3 },
  tiposDisponibles: ["postgres", "redis", "s3"],
  ...parcial,
});

/** Doble de `pedirApi`: guarda cada llamada y devuelve lo que se le dé. */
function pedirFalso(respuesta = {}) {
  const llamadas = [];
  const pedir = async (ruta, opciones) => {
    llamadas.push({ ruta, ...opciones });
    return respuesta;
  };
  return { pedir, llamadas };
}

test("18 · estado vacío: sin recursos, una tarjeta habilitada por cada tipo disponible", () => {
  assert.deepEqual(opcionesCrear(lista()), [
    { tipo: "postgres", habilitada: true, motivo: null },
    { tipo: "redis", habilitada: true, motivo: null },
    { tipo: "s3", habilitada: true, motivo: null },
  ]);
  assert.match(leer(`${COMPONENTES}/panel-datos.tsx`), /Agrega una base de datos administrada: PostgreSQL con pgvector, Redis o almacenamiento S3\. Sus datos sobreviven a redespliegues y reversiones\./);
});

test("18 · un tipo ya conectado (propio o compartido) deshabilita su tarjeta", () => {
  const opciones = opcionesCrear(lista({ recursos: [POSTGRES], limite: { usados: 1, maximo: 3 }, tiposDisponibles: ["redis", "s3"] }));
  assert.deepEqual(opciones.find((o) => o.tipo === "postgres"), { tipo: "postgres", habilitada: false, motivo: "ya-conectado" });
  assert.equal(opciones.find((o) => o.tipo === "redis").habilitada, true);
  assert.equal(textoMotivo("ya-conectado"), "Ya conectado");
});

test("18 · al llegar al tope del plan todas las tarjetas quedan deshabilitadas por límite", () => {
  const llena = lista({ recursos: [POSTGRES], limite: { usados: 1, maximo: 1 } });
  assert.equal(limiteAlcanzado(llena.limite), true);
  assert.deepEqual(
    opcionesCrear(llena).map((o) => o.motivo),
    ["ya-conectado", "limite", "limite"],
  );
  assert.equal(textoLimite({ usados: 1, maximo: 1 }), "1 / 1 base de datos del plan");
  assert.equal(textoLimite({ usados: 2, maximo: 3 }), "2 / 3 bases de datos del plan");
  assert.match(leer(`${COMPONENTES}/panel-datos.tsx`), /href=\{RUTA_PLANES\}/);
});

test("18 · un tipo que la API no ofrece ni está conectado no tiene tarjeta", () => {
  assert.deepEqual(opcionesCrear(lista({ tiposDisponibles: ["postgres"] })).map((o) => o.tipo), ["postgres"]);
});

test("18 · el sondeo sigue solo mientras algún recurso está «creando»", () => {
  assert.equal(hayRecursoCreando({ recursos: [POSTGRES] }), false);
  assert.equal(hayRecursoCreando({ recursos: [POSTGRES, { ...POSTGRES, id: "rd-2", estado: "creando" }] }), true);
  assert.match(leer("src/hooks/use-datos-proyecto.ts"), /useSondeo<ListaRecursosDatos>\(leer, hayRecursoCreando\)/);
});

test("18 · host interno, disco en MB/GB y aviso desde el 90 %", () => {
  assert.equal(textoHost(POSTGRES), "deploya-datos-api-tienda-postgres:5432");
  assert.deepEqual([300, 512, 1024, 1536, 2048, 25600].map(textoMb), ["300 MB", "512 MB", "1 GB", "1.5 GB", "2 GB", "25 GB"]);
  assert.equal(discoCercaDelLimite(POSTGRES), true);
  assert.equal(textoAvisoDisco(POSTGRES), "El disco está al 93 % de 2 GB");
  assert.equal(discoCercaDelLimite({ usoDiscoMb: 1800, limiteDiscoMb: 2048 }), false);
  assert.equal(discoCercaDelLimite({ usoDiscoMb: null, limiteDiscoMb: 2048 }), false);
  assert.equal(fraccionDisco({ usoDiscoMb: null, limiteDiscoMb: 2048 }), null);
});

test("18 · compartir: el selector excluye al dueño y a los ya conectados", () => {
  const proyectos = [
    { id: "p-1", nombre: "api-tienda" },
    { id: "p-2", nombre: "worker-tienda" },
    { id: "p-3", nombre: "panel-tienda" },
  ];
  assert.deepEqual(proyectosParaCompartir(proyectos, POSTGRES), [{ id: "p-3", nombre: "panel-tienda" }]);
  assert.deepEqual(proyectosParaCompartir(proyectos.slice(0, 2), POSTGRES), []);
});

test("18 · eliminar exige escribir el tipo exacto", () => {
  assert.equal(confirmacionRecursoCoincide("postgres", "postgres"), true);
  assert.equal(confirmacionRecursoCoincide("postgres", "  postgres "), true);
  assert.equal(confirmacionRecursoCoincide("postgres", "Postgres"), false);
  assert.equal(confirmacionRecursoCoincide("s3", "redis"), false);
  const dialogos = leer(`${COMPONENTES}/dialogos-datos.tsx`);
  assert.match(dialogos, /Los datos se pierden para siempre/);
  assert.match(dialogos, /!confirmacionRecursoCoincide\(recurso\.tipo, escrito\)/);
});

test("18 · un recurso compartido (esDueno=false) dice de quién es y solo se desconecta", () => {
  const tarjeta = leer(`${COMPONENTES}/tarjeta-recurso-datos.tsx`);
  assert.match(tarjeta, /Pertenece a \{recurso\.proyectoDueno\.nombre\}/);
  assert.match(tarjeta, /recurso\.esDueno \? <EliminarRecurso .* : <DesconectarRecurso/);
  assert.match(tarjeta, /recurso\.esDueno \? <CompartirRecurso/);
});

test("18 · 409 del contrato con mensajes claros, en MAYÚSCULAS o kebab-case", () => {
  assert.equal(errorDeDatos("LIMITE_RECURSOS_DATOS", "x").tipo, "limite");
  assert.equal(errorDeDatos("limite-recursos-datos", "x").tipo, "limite");
  assert.match(errorDeDatos("LIMITE_RECURSOS_DATOS", "x").titulo, /límite de bases de datos/);
  assert.equal(errorDeDatos("TIPO_YA_CONECTADO", "x").tipo, "tipo-conectado");
  assert.deepEqual(errorDeDatos("SUSCRIPCION_BLOQUEADA", "Tu suscripción está vencida."), {
    tipo: "bloqueo",
    titulo: "Tu suscripción no permite crear bases de datos",
    mensaje: "Tu suscripción está vencida.",
  });
  assert.equal(errorDeDatos("suscripcion-no-permite", "x").tipo, "bloqueo");
  assert.deepEqual(errorDeDatos("sin-conexion", "Sin red."), { tipo: "aviso", titulo: "No pudimos completar la operación", mensaje: "Sin red." });
  assert.match(leer(`${COMPONENTES}/panel-datos.tsx`), /<BannerBloqueo codigo=\{CODIGO_BLOQUEO\}/);
});

test("18 · cliente: listar y crear contra /proyectos/:id/datos", async () => {
  const { pedir, llamadas } = pedirFalso();
  const cliente = clienteDatos(pedir);
  await cliente.listar("p-1");
  await cliente.crear("p-1", "redis");
  assert.deepEqual(llamadas, [
    { ruta: "/proyectos/p-1/datos" },
    { ruta: "/proyectos/p-1/datos", metodo: "POST", cuerpo: { tipo: "redis" } },
  ]);
});

test("18 · cliente: conexión, compartir, dejar de compartir y eliminar con confirmación", async () => {
  const { pedir, llamadas } = pedirFalso({ variables: { REDIS_URL: "redis://…" } });
  const cliente = clienteDatos(pedir);
  const conexion = await cliente.conexion("p-1", "rd-1");
  await cliente.compartir("p-1", "rd-1", "p-3");
  await cliente.dejarDeCompartir("p-1", "rd-1", "p-2");
  await cliente.eliminar("p-1", "rd-1", "postgres");
  assert.deepEqual(conexion, { variables: { REDIS_URL: "redis://…" } });
  assert.deepEqual(llamadas, [
    { ruta: "/proyectos/p-1/datos/rd-1/conexion" },
    { ruta: "/proyectos/p-1/datos/rd-1/compartir", metodo: "POST", cuerpo: { proyectoId: "p-3" } },
    { ruta: "/proyectos/p-1/datos/rd-1/compartir/p-2", metodo: "DELETE" },
    { ruta: "/proyectos/p-1/datos/rd-1", metodo: "DELETE", cuerpo: { confirmacion: "postgres" } },
  ]);
});

test("18 · cliente: un 409 de la API sube tal cual para que el hook lo traduzca", async () => {
  const rechazo = Object.assign(new Error("Límite"), { codigo: "LIMITE_RECURSOS_DATOS", estado: 409 });
  const cliente = clienteDatos(async () => {
    throw rechazo;
  });
  await assert.rejects(cliente.crear("p-1", "s3"), (e) => e === rechazo);
});

test("18 · la pestaña Datos existe, está en las pestañas del proyecto y usa el cliente HTTP de la web", () => {
  assert.ok(existsSync(join(root, "src/app/(projects)/projects/[proyecto]/datos/page.tsx")));
  const marco = leer(`${COMPONENTES}/marco-proyecto.tsx`);
  assert.match(marco, /`\/projects\/\$\{proyectoId\}\/datos`/);
  assert.ok(marco.indexOf(">\n          Datos\n") > marco.indexOf(">\n          Variables\n"), "Datos va después de Variables");
  assert.ok(marco.indexOf(">\n          Datos\n") < marco.indexOf(">\n          Configuración\n"), "Datos va antes de Configuración");
  assert.match(leer("src/hooks/use-datos-proyecto.ts"), /clienteDatos\(pedirApi\)/);
});

test("18 · «Ver conexión» avisa del siguiente despliegue y ofrece redesplegar", () => {
  const dialogos = leer(`${COMPONENTES}/dialogos-datos.tsx`);
  assert.match(dialogos, /Las variables se aplican en el siguiente despliegue/);
  assert.match(dialogos, /<BotonDesplegar proyectoId=\{proyectoId\}/);
  assert.match(dialogos, /<CopyField value=\{valor\}/);
});

test("18 · el estado del recurso tiene su badge canónico, distinto de despliegue y suscripción", () => {
  const estados = leer("src/components/deploya/estados.ts");
  assert.match(estados, /ESTADOS_RECURSO_DATOS = \["creando", "disponible", "detenido", "error"\]/);
  assert.match(leer("src/app/sistema/page.tsx"), /<EstadoRecursoDatos key=\{e\} estado=\{e\} \/>/);
});

test("13 · el resumen muestra una tarjeta Datos y 11d anuncia que los recursos salen antes del despliegue #1", () => {
  assert.match(leer(`${COMPONENTES}/panel-resumen.tsx`), /<TarjetaDatosResumen proyectoId=\{proyectoId\} \/>/);
  assert.match(leer(`${COMPONENTES}/paso-revisar.tsx`), /Los recursos de datos se crean antes del despliegue #1 y siguen en la pestaña Datos\./);
  assert.match(leer(`${COMPONENTES}/asistente-alta.tsx`), /<PasoDatos alta=\{alta\} lista=\{lista\} \/>/);
});

test("18 · la ficha de la pestaña Datos está en el design system", () => {
  assert.ok(existsSync(join(repo, "docs/diseno/pantallas/18-Proyecto-datos.md")));
  assert.match(readFileSync(join(repo, "docs/diseno/pantallas/README.md"), "utf8"), /18-Proyecto-datos\.md/);
});

test("18 · en autoalojado (maximo null) no hay tope de bases de datos", () => {
  const libre = lista({ recursos: [POSTGRES], limite: { usados: 1, maximo: null } });
  assert.equal(limiteAlcanzado(libre.limite), false);
  assert.equal(textoLimite({ usados: 1, maximo: null }), "1 base de datos · sin límite");
});
