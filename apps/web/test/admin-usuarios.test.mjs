import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  conceptoPagoAdmin,
  consultaUsuarios,
  cuerpoSuspension,
  DETALLE_MAXIMO,
  fechaAdmin,
  FILTRO_INICIAL,
  haceCuanto,
  inicialesDe,
  OPCIONES_SUSCRIPCION,
  sePuedeSuspender,
  textoAlta,
  textoSuspension,
  textoSuscripcionAdmin,
  textoTotal,
  totalPaginas,
} from "../src/lib/admin-usuarios.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (ruta) => readFileSync(join(root, ruta), "utf8");

test("25 · la consulta sin filtros es la ruta sola", () => {
  assert.equal(consultaUsuarios(FILTRO_INICIAL), "/admin/usuarios");
});

test("25 · la consulta lleva el correo normalizado, el estado y la página", () => {
  assert.equal(
    consultaUsuarios({ correo: "  TiendaDemo ", suscripcion: "vencida", pagina: 2 }),
    "/admin/usuarios?correo=tiendademo&suscripcion=vencida&pagina=2",
  );
  assert.equal(consultaUsuarios({ correo: "", suscripcion: "por-vencer", pagina: 1 }), "/admin/usuarios?suscripcion=por-vencer");
  assert.equal(consultaUsuarios({ correo: "ana+demo@x.gt", suscripcion: "todas", pagina: 1 }), "/admin/usuarios?correo=ana%2Bdemo%40x.gt");
});

test("25 · el filtro de suscripción ofrece Todas y los cinco estados del §4.4", () => {
  assert.deepEqual(
    OPCIONES_SUSCRIPCION.map((o) => o.texto),
    ["Todas", "Activa", "Por vencer", "Vencida", "Suspendida", "Cancelada"],
  );
});

test("25 · total con miles separados y páginas de 20", () => {
  assert.equal(textoTotal(1282), "1 282");
  assert.equal(textoTotal(42), "42");
  assert.equal(totalPaginas({ total: 41, porPagina: 20 }), 3);
  assert.equal(totalPaginas({ total: 0, porPagina: 20 }), 1);
});

test("25 · iniciales del panel", () => {
  assert.equal(inicialesDe("María Ríos", "maria.rios@cafeteriaaurora.com"), "MR");
  assert.equal(inicialesDe("derek calderón morales", "derek@tiendademo.com"), "DC");
  assert.equal(inicialesDe("Administrador", "admin@deploya.app"), "A");
  assert.equal(inicialesDe("   ", "pedro.castillo@fincaelsol.com"), "PE");
});

test("25 · alta, último acceso y suspensión del panel", () => {
  const ahora = new Date("2026-10-17T12:00:00.000Z");

  assert.equal(
    textoAlta({ creado: "2026-06-14T15:00:00.000Z", ultimoAcceso: "2026-10-11T09:00:00.000Z" }, ahora),
    "Alta 14 jun 2026 · último acceso hace 6 d",
  );
  assert.equal(textoAlta({ creado: "2026-06-14T15:00:00.000Z", ultimoAcceso: null }, ahora), "Alta 14 jun 2026 · sin accesos");
  assert.equal(haceCuanto("2026-10-17T09:00:00.000Z", ahora), "hace 3 h");
  assert.equal(haceCuanto("2026-10-17T11:48:00.000Z", ahora), "hace 12 min");
  assert.equal(haceCuanto("2026-10-17T11:59:30.000Z", ahora), "hace un momento");
  assert.equal(
    textoSuspension({ desde: "2026-09-21T10:00:00.000Z", motivo: null, contenedoresDetenidos: 3 }),
    "desde 21 sep · 3 contenedores detenidos",
  );
  assert.equal(textoSuspension({ desde: null, motivo: null, contenedoresDetenidos: 1 }), "1 contenedor detenido");
  assert.equal(conceptoPagoAdmin({ plan: "Pro", vigenciaDias: 30 }), "Plan Pro · 30 días");
  assert.equal(fechaAdmin("2026-09-03T23:30:00.000Z"), "03 sep 2026");
});

test("25b · solo se ofrece suspender a clientes no suspendidos", () => {
  assert.equal(sePuedeSuspender({ rol: "cliente", estadoCuenta: "activa" }), true);
  assert.equal(sePuedeSuspender({ rol: "cliente", estadoCuenta: "suspendida" }), false);
  assert.equal(sePuedeSuspender({ rol: "administrador", estadoCuenta: "activa" }), false);
});

test("25b · el cuerpo exige motivo y recorta el detalle", () => {
  assert.equal(cuerpoSuspension("", "algo"), null);
  assert.deepEqual(cuerpoSuspension("terminos", "  Tráfico de minería detectado en 2 contenedores. "), {
    motivo: "terminos",
    detalle: "Tráfico de minería detectado en 2 contenedores.",
  });
  assert.deepEqual(cuerpoSuspension("terminos", "   "), { motivo: "terminos", detalle: null });
  assert.equal(cuerpoSuspension("terminos", "x".repeat(DETALLE_MAXIMO + 20)).detalle.length, DETALLE_MAXIMO);
});

test("25 · la navegación muestra Administración solo al rol administrador y el stub /admin ya no existe", () => {
  const nav = leer("src/components/shell/nav-panel.tsx");

  assert.match(nav, /href: "\/admin\/usuarios", texto: "Administración"/);
  assert.match(nav, /usuario\?\.rol === "administrador" \? \[\.\.\.NAV_PANEL, NAV_ADMINISTRACION\] : NAV_PANEL/);
  assert.throws(() => leer("src/app/(admin)/admin/page.tsx"));
});

test("25 · texto de la suscripción en el panel", () => {
  const proyectos = [{ despliegue: "detenido" }, { despliegue: "detenido" }, { despliegue: "fallido" }];

  assert.equal(
    textoSuscripcionAdmin({ suscripcion: "suspendida", suscripcionDesde: "2026-09-21T00:05:00.000Z", vence: "2026-09-11T00:00:00.000Z", proyectos }),
    "desde 21 sep · 2 contenedores detenidos",
  );
  assert.equal(textoSuscripcionAdmin({ suscripcion: "vencida", suscripcionDesde: "2026-10-15T00:05:00.000Z", vence: null, proyectos: [] }), "desde 15 oct");
  assert.equal(textoSuscripcionAdmin({ suscripcion: "activa", suscripcionDesde: null, vence: "2026-11-03T10:00:00.000Z", proyectos }), "vence 03 nov 2026");
  assert.equal(textoSuscripcionAdmin({ suscripcion: "activa", suscripcionDesde: null, vence: null, proyectos: [] }), "sin vencimiento");
});
