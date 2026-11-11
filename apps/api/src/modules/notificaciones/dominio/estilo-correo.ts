/**
 * Paleta de los correos: tokens claros de `apps/web/src/app/globals.css` (design system v4.1)
 * pasados a hex, porque los clientes de correo (Gmail, Outlook) no entienden `oklch()` ni
 * variables CSS. Si cambia un token del tema claro, se recalcula aquí.
 */
export const COLOR_CORREO = {
  /** --background */
  fondo: "#f8f6f2",
  /** --card */
  tarjeta: "#fefdfb",
  /** --sunken */
  hundido: "#f2efe9",
  /** --border sobre --card */
  borde: "#e6e2dc",
  /** --foreground y --primary */
  texto: "#1a1510",
  /** --muted-foreground */
  tenue: "#5e5852",
  /** --faint */
  apagado: "#96918c",
  /** --primary-foreground */
  textoBoton: "#f8f6f2",
  /** --signal: la «a» de la marca y los enlaces */
  senal: "#0065b4",
} as const;

export const FUENTE_CORREO = "Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
export const FUENTE_MONO_CORREO = "'Geist Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** Ancho de la tarjeta: cabe en la vista previa de Gmail y Outlook sin desplazamiento. */
export const ANCHO_CORREO = 560;
