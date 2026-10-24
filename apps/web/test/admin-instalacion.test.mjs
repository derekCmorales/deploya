import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  fechaRestaurar,
  nombreComprobacion,
  proyectosDesdeTexto,
  textoCapacidad,
  textoComprobado,
  textoMemoria,
  textoPrograma,
  textoRegistro,
  textoUltimoRespaldo,
  textoVenceInvitacion,
} from "../src/lib/admin-instalacion.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (ruta) => readFileSync(join(root, ruta), "utf8");
const AHORA = new Date("2026-10-24T12:00:00.000Z");

test("32 · Estado: nombres de las comprobaciones y «Comprobado hace 1 min»", () => {
  assert.deepEqual(["docker", "dns", "certificado", "disco", "correo"].map(nombreComprobacion), ["Docker", "Dominio comodín", "Certificado", "Disco", "Correo"]);
  assert.equal(textoComprobado("2026-10-24T11:59:20.000Z", AHORA), "Comprobado hace 1 min");
  assert.equal(textoComprobado("2026-10-24T09:00:00.000Z", AHORA), "Comprobado hace 3 h");
});

test("32 · Registro: el texto de cada política y cuándo vence una invitación", () => {
  assert.equal(textoRegistro("cerrado"), "Nadie puede registrarse. Las cuentas existentes siguen entrando.");
  assert.equal(textoVenceInvitacion("2026-10-30T13:00:00.000Z", AHORA), "vence en 6 días");
  assert.equal(textoVenceInvitacion("2026-10-25T13:00:00.000Z", AHORA), "vence mañana");
  assert.equal(textoVenceInvitacion("2026-10-24T20:00:00.000Z", AHORA), "vence hoy");
});

test("32 · Límites: memoria, capacidad del servidor y proyectos por usuario", () => {
  assert.deepEqual([512, 1024, 2048].map(textoMemoria), ["512 MB", "1 GB", "2 GB"]);
  assert.deepEqual(textoCapacidad({ capacidad: 3, memoriaLibreMb: 4096 }, 1024), {
    titulo: "En este servidor caben unos 3 proyectos activos con 1 GB cada uno",
    texto: "Quedan 4 GB en total y deploya usa cerca de 1 GB. Aplica en el próximo despliegue de cada proyecto.",
  });
  assert.match(textoCapacidad({ capacidad: null, memoriaLibreMb: null }, 1024).titulo, /Todavía no sabemos/);
  assert.equal(proyectosDesdeTexto(""), null);
  assert.equal(proyectosDesdeTexto("Sin límite"), null);
  assert.equal(proyectosDesdeTexto(" 5 "), 5);
  assert.equal(proyectosDesdeTexto("0"), undefined);
  assert.equal(proyectosDesdeTexto("dos"), undefined);
});

test("32 · Respaldos: último respaldo, programa y fecha para restaurar", () => {
  assert.equal(textoUltimoRespaldo("2026-10-24T03:00:00.000Z", AHORA), "hoy, 03:00");
  assert.equal(textoUltimoRespaldo("2026-10-23T03:00:00.000Z", AHORA), "ayer, 03:00");
  assert.equal(textoUltimoRespaldo("2026-10-20T03:00:00.000Z", AHORA), "20 oct 2026, 03:00");
  assert.equal(textoUltimoRespaldo(null, AHORA), "Todavía no hay respaldos");
  assert.equal(textoPrograma({ programa: "diario", conserva: 7 }), "Diario · guarda 7");
  assert.equal(fechaRestaurar("2026-10-20T03:00:00.000Z"), "2026-10-20");
});

test("32 · Solo en autoalojado: la ruta existe, da 404 si la API dice 404 y el administrador la ve en la navegación", () => {
  assert.ok(existsSync(join(root, "src/app/(admin)/admin/instalacion/page.tsx")));
  assert.match(leer("src/app/(admin)/admin/instalacion/_componentes/instalacion-contenedor.tsx"), /estado === HTTP_NO_ENCONTRADO\) notFound\(\)/);
  assert.match(leer("src/components/shell/nav-panel.tsx"), /autoalojado: \[NAV_INSTALACION\]/);
});
