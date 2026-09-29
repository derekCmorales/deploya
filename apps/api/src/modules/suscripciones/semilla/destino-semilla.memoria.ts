import type { Plan } from "../dominio/plan";
import { DestinoSemilla, type UsuarioParaGuardar } from "./destino-semilla.puerto";
import type { PlanSemilla } from "./semilla";

export interface UsuarioGuardado extends UsuarioParaGuardar {
  id: string;
}

/** Doble para pruebas del seed. `planes` es la misma lista que leen los repositorios en memoria. */
export class DestinoSemillaMemoria extends DestinoSemilla {
  readonly planes: Plan[] = [];
  readonly usuarios: UsuarioGuardado[] = [];

  async guardarPlan(plan: PlanSemilla): Promise<void> {
    const i = this.planes.findIndex((p) => p.codigo === plan.codigo);
    const fila: Plan = { ...plan, id: `plan-${plan.codigo}`, activo: true };
    if (i === -1) this.planes.push(fila);
    else this.planes[i] = fila;
  }

  async guardarUsuario(usuario: UsuarioParaGuardar): Promise<string> {
    const existente = this.usuarios.find((u) => u.correo === usuario.correo);
    if (existente) {
      existente.nombre = usuario.nombre;
      existente.rol = usuario.rol;
      return existente.id;
    }
    const id = `usuario-${this.usuarios.length + 1}`;
    this.usuarios.push({ ...usuario, id });
    return id;
  }
}
