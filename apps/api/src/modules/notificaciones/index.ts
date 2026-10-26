/**
 * API pública de M10: lo único que otros módulos importan de aquí. `AvisosModule` (en
 * `avisos/avisos.module.ts`) es el módulo que provee `AvisosPuerto`.
 */
export { CorreoNoEnviado } from "./dominio/errores";
export { PLANTILLA_RECUPERACION, type DatosRecuperacion } from "./dominio/plantilla-recuperacion";
export { PLANTILLA_VERIFICACION, type DatosVerificacion } from "./dominio/plantilla-verificacion";
export { CorreoPuerto } from "./puertos/correo.puerto";
export { PruebaCorreoPuerto, type SmtpEnClaro } from "./puertos/prueba-correo.puerto";
export { AvisosPuerto, type AvisoDespliegue, type AvisoSuscripcion } from "./puertos/avisos.puerto";
export { RegistroEnviosCorreo, type EnvioCorreo } from "./puertos/registro-envios.puerto";
