/**
 * Lógica pura del asistente de primera configuración (pantalla 31, SP-17; contrato
 * instalacion.md § Primera configuración). Sin imports para probarla con `node --test`.
 */

export const RUTA_CONFIGURAR = "/configurar";
/** Al terminar, la configuración sigue en Admin · Instalación (32). */
export const RUTA_AL_TERMINAR = "/admin/instalacion";

export type Paso = 0 | 1 | 2 | 3 | 4;
export const TOTAL_PASOS = 5;

/** Solo se avanza con la respuesta de la API (regla de `Pasos`): cada evento la representa. */
export type Evento = "codigo-valido" | "administrador-creado" | "continuar" | "correo-guardado" | "atras";

/**
 * State: transiciones explícitas. No hay vuelta a los pasos 1 y 2: el código ya se gastó y la
 * cuenta ya existe. Un evento que no aplica deja el paso igual.
 */
const TRANSICIONES: Record<Paso, Partial<Record<Evento, Paso | "terminado">>> = {
  0: { "codigo-valido": 1 },
  1: { "administrador-creado": 2 },
  2: { continuar: 3 },
  3: { "correo-guardado": 4, atras: 2 },
  4: { continuar: "terminado", atras: 3 },
};

export function pasoSiguiente(paso: Paso, evento: Evento): Paso | "terminado" {
  return TRANSICIONES[paso][evento] ?? paso;
}

export function puedeVolver(paso: Paso): boolean {
  return TRANSICIONES[paso].atras !== undefined;
}

export function encabezadoPaso(paso: Paso): string {
  return `Paso ${paso + 1} de ${TOTAL_PASOS} · lo puedes cambiar después`;
}

export type Entrada = "cargando" | "no-disponible" | Paso;

/**
 * Dónde abre `/configurar` (contrato v1.6): sin administrador, en el código; con administrador y
 * sesión de administrador, en «Dominio y HTTPS»; si no, 404. En la nube, siempre 404.
 */
export function pasoDeEntrada(
  modo: { modo: "nube" | "autoalojado"; configurada: boolean; cargando: boolean },
  sesion: { estado: "cargando" | "con-sesion" | "sin-sesion" | "sin-conexion"; rol: string | null },
): Entrada {
  if (modo.cargando) return "cargando";
  if (modo.modo !== "autoalojado") return "no-disponible";
  if (!modo.configurada) return 0;
  if (sesion.estado === "cargando") return "cargando";
  return sesion.estado === "con-sesion" && sesion.rol === "administrador" ? 2 : "no-disponible";
}

/** La raíz manda al asistente mientras la instalación autoalojada no tenga administrador. */
export function debeIrAConfigurar(modo: { modo: "nube" | "autoalojado"; configurada: boolean; cargando: boolean }): boolean {
  return !modo.cargando && modo.modo === "autoalojado" && !modo.configurada;
}

export interface PasoVisible {
  titulo: string;
  detalle: string;
}

/** Los cinco pasos de la columna, con lo que ya se sabe de cada uno (ficha 31). */
export function pasosVisibles(paso: Paso, datos: { correoAdministrador: string | null; dominio: string | null }): PasoVisible[] {
  return [
    { titulo: "Código de configuración", detalle: paso > 0 ? "Verificado" : "Lo imprimió instalar.sh" },
    { titulo: "Cuenta de administrador", detalle: datos.correoAdministrador ?? "Correo y contraseña" },
    { titulo: "Dominio y HTTPS", detalle: datos.dominio ? `${datos.dominio} · comodín` : "Lo dejó listo instalar.sh" },
    { titulo: "Correo", detalle: "SMTP o sin correo" },
    { titulo: "Registro y límites", detalle: "Quién entra y cuánto usa" },
  ];
}

/**
 * `instalar.sh` imprime el código en mayúsculas (alfabeto sin 0/O ni 1/I) y la API compara el
 * sha256 del texto exacto: se recorta y se pasa a mayúsculas antes de enviarlo.
 */
export function normalizarCodigo(texto: string): string {
  return texto.trim().toUpperCase();
}

export const TEXTO_CODIGO_VENCIDO = "El código venció; genera otro con ./scripts/instalar.sh --codigo-nuevo";

const SEGUNDOS_POR_MINUTO = 60;

/** Respuesta de `POST /instalacion/codigo` o `/administrador` que no fue 2xx → texto bajo el campo. */
export function mensajeCodigo(codigo: string, detalle: { segundos?: unknown } = {}): string {
  if (codigo === "CodigoVencido") return TEXTO_CODIGO_VENCIDO;
  if (codigo === "CodigoInvalido") return "El código no coincide. Cópialo tal como lo imprimió instalar.sh.";
  if (codigo === "PrimeraConfiguracionNoDisponible") return "Esta instalación ya tiene administrador.";
  if (codigo === "DemasiadosIntentosCodigo") {
    const minutos = typeof detalle.segundos === "number" ? Math.max(1, Math.ceil(detalle.segundos / SEGUNDOS_POR_MINUTO)) : null;
    return minutos ? `Demasiados intentos. Espera ${minutos} min y vuelve a probar.` : "Demasiados intentos. Espera unos minutos.";
  }
  return "No pudimos comprobar el código. Intenta de nuevo.";
}

export type ModoCorreo = "smtp" | "sin-correo";

export const OPCIONES_CORREO: { valor: ModoCorreo; texto: string }[] = [
  { valor: "smtp", texto: "Con mi SMTP" },
  { valor: "sin-correo", texto: "Sin correo por ahora" },
];

export interface CamposSmtp {
  host: string;
  puerto: string;
  usuario: string;
  contrasena: string;
  remitente: string;
}

export interface SmtpParaApi {
  host: string;
  puerto: number;
  usuario: string;
  contrasena: string;
  remitente: string;
}

export const CAMPOS_SMTP_VACIOS: CamposSmtp = { host: "", puerto: "587", usuario: "", contrasena: "", remitente: "" };

const PUERTO_SSL = 465;
const PUERTO_MAXIMO = 65535;

/** Lo que va bajo «Puerto»: 465 abre cifrado; los demás suben a TLS con STARTTLS. */
export function seguridadDePuerto(puerto: string): string {
  return Number(puerto) === PUERTO_SSL ? "SSL/TLS" : "STARTTLS";
}

export type ErroresSmtp = Partial<Record<keyof CamposSmtp, string>>;

export function erroresSmtp(campos: CamposSmtp): ErroresSmtp {
  const errores: ErroresSmtp = {};
  if (!campos.host.trim()) errores.host = "Escribe el servidor SMTP.";
  const puerto = Number(campos.puerto);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > PUERTO_MAXIMO) errores.puerto = "Un número entre 1 y 65535.";
  if (!campos.remitente.trim()) errores.remitente = "Escribe quién firma los correos.";
  return errores;
}

export function smtpParaApi(campos: CamposSmtp): SmtpParaApi {
  return {
    host: campos.host.trim(),
    puerto: Number(campos.puerto),
    usuario: campos.usuario.trim(),
    contrasena: campos.contrasena,
    remitente: campos.remitente.trim(),
  };
}

const MS_POR_SEGUNDO = 1000;

/** «en 1.2 s» del resultado de la prueba (ficha 31). */
export function tiempoDeEntrega(ms: number): string {
  return `en ${(Math.max(0, ms) / MS_POR_SEGUNDO).toFixed(1)} s`;
}

/**
 * «Continuar» del paso Correo: sin correo, siempre; con SMTP, solo si la prueba llegó con
 * exactamente los datos que se van a guardar (se termina con correo probado o sin correo).
 */
export function puedeGuardarCorreo(modo: ModoCorreo, campos: CamposSmtp, probado: CamposSmtp | null): boolean {
  if (modo === "sin-correo") return true;
  return probado !== null && (Object.keys(campos) as (keyof CamposSmtp)[]).every((campo) => campos[campo] === probado[campo]);
}

const GB_EN_MB = 1024;

/** «Servidor» de «Dominio y HTTPS»: la memoria libre que mide el trabajador, si ya reportó. */
export function textoServidor(memoriaLibreMb: number | null): string {
  if (memoriaLibreMb === null) return "Sin reporte todavía";
  return `${(memoriaLibreMb / GB_EN_MB).toFixed(1)} GB de memoria libre`;
}
