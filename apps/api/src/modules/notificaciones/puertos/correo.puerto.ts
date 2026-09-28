import type { PlantillaCorreo } from "../dominio/plantilla-correo";

/**
 * Puerto de salida de M10 (ADR 0001). Quien lo implemente compone el mensaje con la
 * plantilla y lo transporta; si no logra entregarlo lanza `CorreoNoEnviado`.
 */
export abstract class CorreoPuerto {
  abstract enviar<D extends { enlace: string }>(destinatario: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void>;
}
