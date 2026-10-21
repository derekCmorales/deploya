import type { CodigoSemilla, PlanSemilla, RolSemilla } from "./semilla";

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
  /** Copia el hash del instalador. Devuelve false si ya hay administrador: no resucita el código. */
  abstract guardarCodigo(codigo: CodigoSemilla): Promise<boolean>;
}
