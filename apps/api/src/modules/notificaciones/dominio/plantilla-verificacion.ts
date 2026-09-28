import { PlantillaCorreo } from "./plantilla-correo";

export interface DatosVerificacion {
  nombre: string;
  correo: string;
  enlace: string;
}

/** Pantalla 24 · Verificación de cuenta (el enlace caduca en 24 horas). */
export class PlantillaVerificacion extends PlantillaCorreo<DatosVerificacion> {
  protected asunto(): string {
    return "Confirma tu correo en deploya";
  }

  protected titulo(): string {
    return "Confirma tu correo";
  }

  protected parrafo(datos: DatosVerificacion): string {
    return `Hola ${datos.nombre}, para activar tu cuenta en deploya confirma que ${datos.correo} es tuyo. El enlace caduca en 24 horas.`;
  }

  protected textoBoton(): string {
    return "Verificar correo";
  }

  protected aviso(): string {
    return "Si no creaste esta cuenta, ignora este correo.";
  }
}

export const PLANTILLA_VERIFICACION = new PlantillaVerificacion();
