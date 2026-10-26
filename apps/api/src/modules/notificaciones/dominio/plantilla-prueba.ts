import { PlantillaCorreo } from "./plantilla-correo";

export interface DatosPrueba {
  enlace: string;
}

/**
 * Correo de prueba del asistente 31: confirma que el SMTP elegido entrega. El botón no vuelve al
 * asistente: abriría otra pestaña sin lo que se lleva escrito; se sigue en la pestaña original.
 */
export class PlantillaPrueba extends PlantillaCorreo<DatosPrueba> {
  protected asunto(): string {
    return "Tu correo de deploya funciona";
  }

  protected titulo(): string {
    return "Tu correo de deploya funciona";
  }

  protected parrafo(): string {
    return "Este es el correo de prueba de la configuración de tu instalación. Con este servidor van a salir la verificación de cuenta, la recuperación de contraseña y los avisos de despliegue. Vuelve a la pestaña donde estás configurando deploya para continuar.";
  }

  protected textoBoton(): string {
    return "Abrir deploya";
  }

  protected aviso(): string {
    return "Lo mandó quien está configurando deploya en tu servidor.";
  }
}

export const PLANTILLA_PRUEBA = new PlantillaPrueba();
