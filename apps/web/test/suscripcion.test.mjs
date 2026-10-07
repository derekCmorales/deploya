import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  avisoEstado,
  erroresTarjeta,
  fechaCorta,
  fechaLarga,
  formatearNumeroTarjeta,
  formatearVencimiento,
  opcionesCambio,
  progresoVigencia,
  rangoVigencia,
  reinicioConsumo,
  rutaContratar,
  sinVigencia,
  subtituloOperacion,
  TARJETAS_PRUEBA,
  textoChipPlan,
  textoCuotaActual,
  textoDias,
  textoMonto,
  ultimos4,
  vigenciaDeParametro,
} from "../src/lib/suscripcion.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (p) => readFileSync(join(root, p), "utf8");

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : [p];
  });
}

const plan = (codigo, nombre, precio30) => ({
  codigo,
  nombre,
  descripcion: "",
  precio30,
  precio365: precio30 === 0 ? null : precio30 * 10,
  maxProyectos: 1,
  cpus: 1,
  memoriaMb: 256,
  construccionesMes: 30,
});
const CATALOGO = [plan("sandbox", "Sandbox", 0), plan("starter", "Starter", 5), plan("pro", "Pro", 15), plan("business", "Business", 40)];

test("08 · fechas de la vigencia en UTC como en el diseño", () => {
  assert.equal(fechaCorta("2026-09-03T12:00:00.000Z"), "03 sep");
  assert.equal(fechaLarga("2026-10-03T12:00:00.000Z"), "03 oct 2026");
  assert.equal(rangoVigencia("2026-09-24T12:00:00.000Z", "2026-10-24T12:00:00.000Z"), "24 sep → 24 oct 2026");
});

test("08 · barra de vigencia: posición de hoy entre inicio y fin", () => {
  const inicio = "2026-09-03T00:00:00.000Z";
  const vence = "2026-10-03T00:00:00.000Z";
  assert.equal(progresoVigencia(inicio, vence, new Date("2026-09-24T00:00:00.000Z")), 70);
  assert.equal(progresoVigencia(inicio, vence, new Date("2026-08-01T00:00:00.000Z")), 0);
  assert.equal(progresoVigencia(inicio, vence, new Date("2026-12-01T00:00:00.000Z")), 100);
});

test("08 · cuota, días y chip del plan", () => {
  assert.equal(textoCuotaActual({ precio: 5, vigenciaDias: 30 }), "USD 5.00 / 30 días · sin renovación automática");
  assert.equal(textoCuotaActual({ precio: 0, vigenciaDias: null }), "Sin costo · sin vencimiento");
  assert.equal(textoDias(9), "9 días");
  assert.equal(textoDias(1), "1 día");
  assert.equal(textoChipPlan({ plan: CATALOGO[1], diasRestantes: 9 }), "Starter · 9 días");
  assert.equal(textoChipPlan({ plan: CATALOGO[0], diasRestantes: null }), "Sandbox");
  assert.equal(textoMonto(40), "USD 40.00");
});

test("08 · Cambiar plan desde Starter: Pro y Business son ascenso, Sandbox es descenso", () => {
  const opciones = opcionesCambio(CATALOGO, { plan: CATALOGO[1], planSiguiente: null, estado: "activa" });
  assert.deepEqual(
    opciones.map((o) => [o.plan.nombre, o.tipo, o.precio]),
    [
      ["Sandbox", "descenso", "Sin costo"],
      ["Pro", "ascenso", "USD 15.00"],
      ["Business", "ascenso", "USD 40.00"],
    ],
  );
  assert.equal(opciones[1].texto, "Pagas USD 15.00 y arrancan 30 días nuevos.");
  assert.equal(opciones[0].texto, "Aplica cuando termine tu vigencia actual.");
});

test("08 · desde Sandbox todo es ascenso y un descenso programado se marca", () => {
  assert.ok(opcionesCambio(CATALOGO, { plan: CATALOGO[0], planSiguiente: null, estado: "activa" }).every((o) => o.tipo === "ascenso"));
  const desdePro = opcionesCambio(CATALOGO, { plan: CATALOGO[2], planSiguiente: { codigo: "sandbox", nombre: "Sandbox" }, estado: "activa" });
  assert.deepEqual(desdePro.filter((o) => o.programado).map((o) => o.plan.codigo), ["sandbox"]);
});

test("08 · Cambiar plan con la vigencia terminada: sin descenso a Sandbox, el resto se contrata desde hoy", () => {
  for (const estado of ["vencida", "suspendida", "cancelada"]) {
    const opciones = opcionesCambio(CATALOGO, { plan: CATALOGO[2], planSiguiente: null, estado });
    assert.deepEqual(
      opciones.map((o) => [o.plan.nombre, o.tipo]),
      [
        ["Starter", "contratacion"],
        ["Business", "ascenso"],
      ],
      estado,
    );
    assert.ok(opciones.every((o) => o.texto.startsWith("Pagas ")));
  }
});

test("08 · estados sin vigencia y su aviso", () => {
  assert.deepEqual(
    ["activa", "por-vencer", "vencida", "suspendida", "cancelada"].map(sinVigencia),
    [false, false, true, true, true],
  );
  assert.equal(avisoEstado("activa"), null);
  assert.equal(avisoEstado("por-vencer"), null);
  assert.equal(avisoEstado("vencida").titulo, "Tu vigencia terminó");
  assert.match(avisoEstado("vencida").texto, /gracia/);
  assert.equal(avisoEstado("suspendida").titulo, "Tu panel está en pausa");
  assert.doesNotMatch(avisoEstado("suspendida").texto, /siguen en línea/);
  assert.match(avisoEstado("cancelada").texto, /Contrata un plan/);
});

test("08 · el consumo se reinicia el día 1 del mes siguiente en UTC", () => {
  assert.equal(fechaCorta(reinicioConsumo(new Date("2026-10-07T23:00:00.000Z"))), "01 nov");
  assert.equal(fechaLarga(reinicioConsumo(new Date("2026-12-31T23:59:59.000Z"))), "01 ene 2027");
});

test("07 · ruta de contratar y vigencia del parámetro", () => {
  assert.equal(rutaContratar("pro"), "/planes/contratar?plan=pro&vigencia=30");
  assert.equal(rutaContratar("pro", "365"), "/planes/contratar?plan=pro&vigencia=365");
  assert.equal(vigenciaDeParametro("365"), "365");
  assert.equal(vigenciaDeParametro(null), "30");
  assert.equal(vigenciaDeParametro("7"), "30");
});

test("07 · subtítulo del resumen según la operación", () => {
  const base = { desde: { codigo: "sandbox", nombre: "Sandbox" }, plan: { codigo: "starter", nombre: "Starter" } };
  assert.equal(subtituloOperacion({ ...base, tipo: "ascenso" }), "Ascenso desde Sandbox");
  assert.equal(subtituloOperacion({ ...base, tipo: "contratacion" }), "Contratación desde Sandbox");
  assert.equal(subtituloOperacion({ ...base, tipo: "renovacion" }), "Renovación de Starter");
});

test("07 · la tarjeta se formatea mientras se escribe y se valida como en la API", () => {
  assert.equal(formatearNumeroTarjeta("4242424242424242999"), "4242 4242 4242 4242");
  assert.equal(formatearNumeroTarjeta("4000 00"), "4000 00");
  assert.equal(formatearVencimiento("1228"), "12 / 28");
  assert.equal(formatearVencimiento("1"), "1");
  assert.equal(ultimos4("4000 0000 0000 0002"), "0002");
  assert.deepEqual(erroresTarjeta({ titular: "Derek", numero: "4242 4242 4242 4242", vencimiento: "12 / 28", cvc: "123" }), {});
  assert.deepEqual(Object.keys(erroresTarjeta({ titular: " ", numero: "4242", vencimiento: "13 / 28", cvc: "1" })), [
    "titular",
    "numero",
    "vencimiento",
    "cvc",
  ]);
});

test("07 · las tres tarjetas de prueba del spec", () => {
  assert.deepEqual(
    TARJETAS_PRUEBA.map((t) => `${t.numero} · ${t.efecto}`),
    ["4242 4242 4242 4242 · aprueba", "4000 0000 0000 0002 · rechaza", "4000 0000 0000 3220 · tarda 5 s"],
  );
});

test("/suscripcion y /planes/contratar existen, piden sesión y la navegación lleva a Suscripción", () => {
  for (const p of ["src/app/(billing)/suscripcion/page.tsx", "src/app/(billing)/planes/contratar/page.tsx"]) {
    assert.ok(existsSync(join(root, p)), `falta ${p}`);
    assert.match(leer(p), /RequiereSesion/);
  }
  assert.match(leer("src/components/shell/nav-panel.tsx"), /href: "\/suscripcion", texto: "Suscripción"/);
  assert.doesNotMatch(leer("src/app/(billing)/planes/_componentes/tabla-planes.tsx"), /disabled title=/);
});

test("los textos fijos de las fichas 07, 07b y 08 están en las pantallas", () => {
  const pantalla = archivos(join(root, "src/app/(billing)"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  for (const texto of [
    "Cobro · Suscripción",
    "Plan actual",
    "Vigencia",
    "restantes",
    "Renovar ahora",
    "Cambiar plan",
    "Consumo del período",
    "Se reinicia el",
    "Al límite",
    "Límite del plan",
    "Construcciones",
    "Si llegas al límite, no podrás crear más proyectos ni lanzar más construcciones este mes.",
    "El nuevo plan empieza hoy",
    "Cobro · Contratar",
    "Confirma tu plan",
    "Revisa el resumen y confirma el pago con la tarjeta de prueba.",
    "Resumen",
    "se aplica al aprobar",
    "Total",
    "Pasarela simulada",
    "No se realiza ningún cobro real. Solo acepta tarjetas de prueba.",
    "Datos de la tarjeta",
    "Número de tarjeta",
    "Tarjetas de prueba",
    "Al confirmar aceptas los términos del plan.",
    "Confirmar pago",
    "Confirmando el pago",
    "No cierres esta ventana.",
    "Orden creada",
    "Autorizando con la pasarela",
    "Aplicando cuota del plan",
    "Pago aprobado",
    "Las nuevas cuotas se aplicaron de inmediato.",
    "Comprobante",
    "Ir a proyectos",
    "Pago rechazado",
    "No se aplicó ningún cambio a tu plan.",
    "Motivo",
    "Cambiar tarjeta",
    "Intentar de nuevo",
  ]) {
    assert.ok(pantalla.includes(texto), `falta «${texto}»`);
  }
});

test("las pantallas de cobro no hacen fetch, no usan colores de Tailwind ni any", () => {
  const dir = join(root, "src/app/(billing)");
  for (const f of [...archivos(dir), join(root, "src/hooks/use-suscripcion.ts")].filter((p) => /\.tsx?$/.test(p))) {
    const codigo = readFileSync(f, "utf8");
    assert.doesNotMatch(codigo, /\bfetch\(/, `fetch en ${f}`);
    assert.doesNotMatch(codigo, /\b(?:bg|text|border)-(?:red|green|emerald|blue|yellow|amber|slate|gray)-\d/, `color de Tailwind en ${f}`);
    assert.doesNotMatch(codigo, /:\s*any\b|<any>/, `any en ${f}`);
  }
});
