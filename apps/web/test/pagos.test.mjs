import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AVISO_SIMULADO,
  fechaHoraPago,
  fechaPago,
  filaPorDefecto,
  LEYENDA_COMPROBANTE,
  metodoPago,
  montoPago,
  rutaComprobantePdf,
  subtituloSinPagos,
  textoVigenciaPago,
} from "../src/lib/pagos.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

const fila = (id, estado, fecha) => ({
  id,
  fecha,
  concepto: "Plan Starter · 30 días",
  plan: "Starter",
  monto: 5,
  moneda: "USD",
  estado,
  comprobante: estado === "aprobado" ? `DPY-2026-00014${id}` : null,
  vigencia: null,
  tarjeta: "•••• 4242",
  titular: "Derek Calderón",
});

test("09 · formato de monto", () => {
  assert.equal(montoPago(5, "USD"), "USD 5.00");
  assert.equal(montoPago(150, "USD"), "USD 150.00");
  assert.equal(montoPago(15.5, "USD"), "USD 15.50");
});

test("09 · formato de fecha en UTC", () => {
  assert.equal(fechaPago("2026-09-03T16:10:00.000Z"), "03 sep 2026");
  assert.equal(fechaPago("2026-12-31T23:59:00.000Z"), "31 dic 2026");
  assert.equal(fechaHoraPago("2026-09-03T16:10:00.000Z"), "03 sep 2026, 16:10");
  assert.equal(textoVigenciaPago({ desde: "2026-09-03T16:10:00.000Z", hasta: "2026-10-03T16:10:00.000Z" }), "03 sep → 03 oct 2026");
  assert.equal(metodoPago("•••• 4242"), "Prueba •••• 4242");
});

test("09 · la fila por defecto es el pago aprobado más reciente", () => {
  const filas = [fila("3", "rechazado", "2026-10-03T10:00:00Z"), fila("2", "aprobado", "2026-09-03T16:10:00Z"), fila("1", "aprobado", "2026-08-03T10:00:00Z")];

  assert.equal(filaPorDefecto(filas)?.id, "2");
  assert.equal(filaPorDefecto([fila("9", "rechazado", "2026-10-03T10:00:00Z")])?.id, "9");
  assert.equal(filaPorDefecto([]), null);
});

test("09b · subtítulo de una cuenta nueva y textos de la ficha", () => {
  assert.equal(subtituloSinPagos("Sandbox"), "Cuenta nueva · plan Sandbox");
  assert.equal(subtituloSinPagos(null), "Cuenta nueva");
  assert.equal(AVISO_SIMULADO, "Todos los cobros son simulados; los comprobantes no tienen valor fiscal.");
  assert.equal(LEYENDA_COMPROBANTE, "Pago simulado · sin cobro real ni valor fiscal.");
});

test("09 · el PDF se descarga desde la API con la ruta del pago", () => {
  assert.equal(rutaComprobantePdf("3f1c-2b9e"), "/suscripciones/pagos/3f1c-2b9e/comprobante.pdf");
  assert.match(leer("src/app/(billing)/pagos/_componentes/panel-comprobante.tsx"), /href=\{`\$\{URL_API\}\$\{rutaComprobantePdf\(pago\.id\)\}`\} download/);
});

test("09 · la pestaña Historial de pagos ya enlaza a /pagos y 09b ofrece «Ver planes»", () => {
  const cabecera = leer("src/app/(billing)/_componentes/cabecera-cobro.tsx");
  const contenedor = leer("src/app/(billing)/pagos/_componentes/pagos-contenedor.tsx");

  assert.match(cabecera, /<Link href=\{RUTA_PAGOS\}[^>]*>\s*Historial de pagos/);
  assert.doesNotMatch(cabecera, /aria-disabled/);
  for (const texto of ["Aún no hay pagos", "Cuando contrates un plan, aquí verás cada cobro con su comprobante.", "Ver planes"]) {
    assert.ok(contenedor.includes(texto), `falta «${texto}»`);
  }
});
