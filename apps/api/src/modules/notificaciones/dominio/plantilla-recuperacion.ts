import { PlantillaCorreo } from "./plantilla-correo";

export interface DatosRecuperacion {
  enlace: string;
}

/** Pantalla 24 · Recuperación de contraseña (un solo uso, caduca en 30 minutos). */
export class PlantillaRecuperacion extends PlantillaCorreo<DatosRecuperacion> {
  protected asunto(): string {
    return "Restablece tu contraseña de deploya";
  }

  protected titulo(): string {
    return "Restablece tu contraseña";
  }

  protected parrafo(): string {
    return "Pediste crear una contraseña nueva. El enlace sirve una sola vez y caduca en 30 minutos.";
  }

  protected textoBoton(): string {
    return "Crear contraseña nueva";
  }

  protected aviso(): string {
    return "Si no lo pediste, no hagas nada: tu contraseña sigue igual.";
  }
}

export const PLANTILLA_RECUPERACION = new PlantillaRecuperacion();
