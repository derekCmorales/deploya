/** El único plan de una instalación autoalojada (datos-nucleo.md v2): sin precio ni vencimiento. */
export const CODIGO_AUTOALOJADO = "autoalojado";

/**
 * Sin límite de proyectos ni de construcciones. En JSON llega como `null` (Infinity no existe
 * en JSON): la web lo lee como «sin límite».
 */
export const SIN_LIMITE = Number.POSITIVE_INFINITY;
