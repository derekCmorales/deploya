export interface Destinatario {
  correo: string;
  nombre: string;
}

/**
 * Puerto estrecho de M10: a quién escribirle por su id de usuario. La cuenta es de M1; el
 * adaptador lo lee por el servicio que exporta identidad (regla 1 de datos-nucleo.md).
 */
export abstract class DestinatariosPuerto {
  abstract destinatarioDe(usuarioId: string): Promise<Destinatario | null>;
}
