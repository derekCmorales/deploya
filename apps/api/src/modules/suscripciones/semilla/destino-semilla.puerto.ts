import type { PlanSemilla, RolSemilla } from "./semilla";

export interface UsuarioParaGuardar {
  correo: string;
  nombre: string;
  rol: RolSemilla;
  hashContrasena: string;
}

/** Dónde escribe el seed. Cada operación es un upsert por clave natural. */
export abstract class DestinoSemilla {
  abstract guardarPlan(plan: PlanSemilla): Promise<void>;
  /** Crea la cuenta activa si no existe; nunca reescribe su contraseña. Devuelve el id. */
  abstract guardarUsuario(usuario: UsuarioParaGuardar): Promise<string>;
}
