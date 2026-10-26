import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CAMPOS_SMTP_VACIOS,
  debeIrAConfigurar,
  encabezadoPaso,
  erroresSmtp,
  mensajeCodigo,
  normalizarCodigo,
  pasoDeEntrada,
  pasoSiguiente,
  pasosVisibles,
  puedeGuardarCorreo,
  puedeVolver,
  seguridadDePuerto,
  smtpParaApi,
  TEXTO_CODIGO_VENCIDO,
  textoServidor,
  tiempoDeEntrega,
} from "../src/lib/asistente.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");
const DIR = "src/app/(auth)/configurar";
const COMPONENTES = ["asistente", "marco-paso", "paso-codigo", "paso-administrador", "paso-dominio", "paso-correo", "paso-registro"].map((n) =>
  leer(`${DIR}/_componentes/${n}.tsx`),
);
const TODO = [leer(`${DIR}/page.tsx`), ...COMPONENTES, leer("src/lib/asistente.ts")].join("\n");

const AUTOALOJADO_SIN_ADMIN = { modo: "autoalojado", configurada: false, cargando: false };
const AUTOALOJADO_CON_ADMIN = { modo: "autoalojado", configurada: true, cargando: false };
const SIN_SESION = { estado: "sin-sesion", rol: null };

test("31 · el recorrido completo: código → administrador → dominio → correo → registro → terminar", () => {
  let paso = 0;
  for (const evento of ["codigo-valido", "administrador-creado", "continuar", "correo-guardado"]) paso = pasoSiguiente(paso, evento);
  assert.equal(paso, 4);
  assert.equal(pasoSiguiente(paso, "continuar"), "terminado");
});

test("31 · un paso no avanza sin su respuesta de la API y no se vuelve a los pasos 1 y 2", () => {
  assert.equal(pasoSiguiente(0, "continuar"), 0, "sin el 204 del código no pasa al administrador");
  assert.equal(pasoSiguiente(1, "continuar"), 1);
  assert.equal(pasoSiguiente(3, "continuar"), 3, "el correo avanza solo al guardarse");
  assert.equal(pasoSiguiente(3, "atras"), 2);
  assert.equal(pasoSiguiente(4, "atras"), 3);
  assert.equal(pasoSiguiente(2, "atras"), 2, "el código ya se gastó: no hay vuelta");
  assert.deepEqual([0, 1, 2, 3, 4].map(puedeVolver), [false, false, false, true, true]);
});

test("Código válido", () => {
  assert.equal(pasoSiguiente(pasoDeEntrada(AUTOALOJADO_SIN_ADMIN, SIN_SESION), "codigo-valido"), 1);
});

test("31 · el código se envía como lo imprimió instalar.sh (mayúsculas, sin espacios)", () => {
  assert.equal(normalizarCodigo("  k7qp-m2xd "), "K7QP-M2XD");
  assert.match(leer(`${DIR}/_componentes/paso-codigo.tsx`), /const limpio = normalizarCodigo\(codigo\);/);
});

test("Código vencido", () => {
  assert.equal(mensajeCodigo("CodigoVencido"), "El código venció; genera otro con ./scripts/instalar.sh --codigo-nuevo");
  assert.equal(TEXTO_CODIGO_VENCIDO, mensajeCodigo("CodigoVencido"));
});

test("31 · los demás errores del código", () => {
  assert.match(mensajeCodigo("CodigoInvalido"), /no coincide/);
  assert.equal(mensajeCodigo("DemasiadosIntentosCodigo", { segundos: 540 }), "Demasiados intentos. Espera 9 min y vuelve a probar.");
  assert.equal(mensajeCodigo("DemasiadosIntentosCodigo"), "Demasiados intentos. Espera unos minutos.");
  assert.equal(mensajeCodigo("http-500"), "No pudimos comprobar el código. Intenta de nuevo.");
});

test("Sesión al crear el administrador", () => {
  // Tras el 201 la sesión ya está iniciada: el asistente sigue en el correo sin pedir el login.
  assert.equal(pasoSiguiente(pasoSiguiente(1, "administrador-creado"), "continuar"), 3);
  // Si recarga la página con la sesión de administrador, vuelve a «Dominio y HTTPS».
  assert.equal(pasoDeEntrada(AUTOALOJADO_CON_ADMIN, { estado: "con-sesion", rol: "administrador" }), 2);
  const administrador = leer(`${DIR}/_componentes/paso-administrador.tsx`);
  assert.match(administrador, /await crearAdministrador\(codigo, correo\.trim\(\), contrasena\);\s*await alCrear\(\);/);
  assert.match(leer(`${DIR}/_componentes/asistente.tsx`), /await recargar\(\);\s*avanzar\("administrador-creado"\);/);
});

test("Ya configurada", () => {
  assert.equal(pasoDeEntrada(AUTOALOJADO_CON_ADMIN, SIN_SESION), "no-disponible");
  assert.equal(pasoDeEntrada(AUTOALOJADO_CON_ADMIN, { estado: "con-sesion", rol: "cliente" }), "no-disponible");
  assert.equal(pasoDeEntrada({ modo: "nube", configurada: true, cargando: false }, { estado: "con-sesion", rol: "administrador" }), "no-disponible");
  assert.equal(pasoDeEntrada({ ...AUTOALOJADO_CON_ADMIN, cargando: true }, SIN_SESION), "cargando");
  assert.equal(pasoDeEntrada(AUTOALOJADO_CON_ADMIN, { estado: "cargando", rol: null }), "cargando");
  assert.match(leer(`${DIR}/_componentes/asistente.tsx`), /if \(entrada === "no-disponible"\) notFound\(\);/);
});

test("31 · la raíz redirige a /configurar solo en autoalojado sin administrador", () => {
  assert.equal(debeIrAConfigurar(AUTOALOJADO_SIN_ADMIN), true);
  assert.equal(debeIrAConfigurar(AUTOALOJADO_CON_ADMIN), false);
  assert.equal(debeIrAConfigurar({ modo: "nube", configurada: true, cargando: false }), false);
  assert.equal(debeIrAConfigurar({ ...AUTOALOJADO_SIN_ADMIN, cargando: true }), false);
  assert.match(leer("src/app/page.tsx"), /<RedirigeAConfigurar \/>/);
});

test("Correo de prueba", () => {
  assert.equal(tiempoDeEntrega(1200), "en 1.2 s");
  assert.equal(tiempoDeEntrega(-3), "en 0.0 s");
  const correo = leer(`${DIR}/_componentes/paso-correo.tsx`);
  assert.match(correo, /Llegó a <span className="font-mono text-\[13px\]">\{correoAdministrador\}<\/span>/);
  assert.match(correo, /Mandamos uno a \{correoAdministrador\}/);
});

test("SMTP rechazado", () => {
  const correo = leer(`${DIR}/_componentes/paso-correo.tsx`);
  assert.match(correo, /e\.detalle\.error/, "muestra lo que respondió el servidor (502 { error })");
  assert.match(correo, /Corrige los datos o elige «Sin correo por ahora»\./);
  // Rechazado, el SMTP no se puede guardar; «Sin correo por ahora» sí.
  assert.equal(puedeGuardarCorreo("smtp", CAMPOS_SMTP_VACIOS, null), false);
  assert.equal(puedeGuardarCorreo("sin-correo", CAMPOS_SMTP_VACIOS, null), true);
});

test("Correo guardado sin editar archivos", () => {
  const campos = { host: " smtp.miempresa.com ", puerto: "587", usuario: "deploya@miempresa.com", contrasena: " clave ", remitente: "deploya <no-responder@miempresa.com>" };
  assert.equal(puedeGuardarCorreo("smtp", campos, campos), true, "con la prueba que llegó, «Continuar» guarda");
  assert.equal(puedeGuardarCorreo("smtp", { ...campos, puerto: "465" }, campos), false, "si cambió algo tras la prueba, hay que probar de nuevo");
  assert.deepEqual(smtpParaApi(campos), {
    host: "smtp.miempresa.com",
    puerto: 587,
    usuario: "deploya@miempresa.com",
    contrasena: " clave ",
    remitente: "deploya <no-responder@miempresa.com>",
  });
  assert.match(leer("src/lib/api-instalacion.ts"), /pedirApi\("\/instalacion\/correo", \{ metodo: "PATCH", cuerpo: eleccion \}\)/);
});

test("31 · validación del SMTP y la pista del puerto", () => {
  assert.deepEqual(Object.keys(erroresSmtp({ ...CAMPOS_SMTP_VACIOS, puerto: "70000" })).sort(), ["host", "puerto", "remitente"]);
  assert.deepEqual(erroresSmtp({ host: "h", puerto: "587", usuario: "", contrasena: "", remitente: "r" }), {});
  assert.equal(seguridadDePuerto("587"), "STARTTLS");
  assert.equal(seguridadDePuerto("465"), "SSL/TLS");
});

test("31 · columna de pasos y encabezado", () => {
  assert.equal(encabezadoPaso(3), "Paso 4 de 5 · lo puedes cambiar después");
  assert.deepEqual(
    pasosVisibles(3, { correoAdministrador: "ops@miempresa.com", dominio: "apps.miempresa.com" }).map((p) => `${p.titulo} · ${p.detalle}`),
    [
      "Código de configuración · Verificado",
      "Cuenta de administrador · ops@miempresa.com",
      "Dominio y HTTPS · apps.miempresa.com · comodín",
      "Correo · SMTP o sin correo",
      "Registro y límites · Quién entra y cuánto usa",
    ],
  );
  assert.equal(textoServidor(3584), "3.5 GB de memoria libre");
  assert.equal(textoServidor(null), "Sin reporte todavía");
});

test("31 · textos de la ficha", () => {
  for (const texto of [
    "Configura tu instalación",
    "lo puedes cambiar después",
    "Código de configuración",
    "Verificado",
    "Cuenta de administrador",
    "Dominio y HTTPS",
    "SMTP o sin correo",
    "Registro y límites",
    "Quién entra y cuánto usa",
    "Versión",
    "Certificado",
    "Servidor",
    "¿Cómo manda correos esta instalación?",
    "Deploya manda la verificación de cuenta, la recuperación de contraseña y los avisos de despliegue.",
    "Con mi SMTP",
    "Sin correo por ahora",
    "Puerto",
    "STARTTLS",
    "Usuario",
    "Contraseña",
    "Remitente",
    "Enviar correo de prueba",
    "Llegó a",
    "Mandamos uno a",
    "Sin correo, deploya sigue funcionando",
    "Atrás",
    "Continuar",
  ]) {
    assert.ok(TODO.includes(texto), `falta «${texto}» en 31`);
  }
  // El párrafo largo del banner va partido en líneas en el JSX: se compara sin saltos.
  assert.ok(
    TODO.replace(/\s+/g, " ").includes(
      "Las cuentas nuevas se verifican desde Admin · Usuarios, los enlaces de recuperación los genera el administrador y los avisos de despliegue solo se ven en la app. Puedes configurarlo después en Instalación.",
    ),
  );
});

test("31 · los pasos 3 a 5 comparten una sola lectura de la instalación (la columna no pierde el dominio)", () => {
  assert.match(leer(`${DIR}/_componentes/asistente.tsx`), /useSondeo\(paso >= 2 \? leerInstalacion : null, nunca\)/);
  for (const paso of ["paso-dominio", "paso-registro"]) {
    const fuente = leer(`${DIR}/_componentes/${paso}.tsx`);
    assert.match(fuente, /instalacion: Sondeo<EstadoInstalacion>/);
    assert.doesNotMatch(fuente, /useAdminInstalacion/);
  }
});

test("31 · el paso 5 usa los bloques y endpoints de Admin · Instalación; sin fetch, hex ni any", () => {
  const registro = leer(`${DIR}/_componentes/paso-registro.tsx`);
  assert.match(registro, /<BloqueRegistro /);
  assert.match(registro, /<BloqueLimites /);
  for (const fuente of COMPONENTES) {
    assert.doesNotMatch(fuente, /\bfetch\(/);
    assert.doesNotMatch(fuente, /#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(fuente, /: any\b|as any\b/);
  }
});
