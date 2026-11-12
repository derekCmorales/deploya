/** Token de Nest con el dominio público del enrutador de borde (`DOMINIO_BASE`, `ESQUEMA_PUBLICO`). */
export const DOMINIO_DATOS = Symbol("DOMINIO_DATOS");

/** Contraseña de cada recurso: 32 caracteres `[A-Za-z0-9]` (recursos-datos.md). */
export const LARGO_CONTRASENA = 32;

/** Cola BullMQ de los comandos de datos (crear, eliminar, conectar…): la consume el trabajador. */
export const COLA_DATOS = "datos";
