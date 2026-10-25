import { Injectable } from "@nestjs/common";
import { cuotaDeSuscripcion } from "../dominio/catalogo";
import { SIN_LIMITE } from "../dominio/plan-autoalojado";
import type { Cuota, Suscripcion } from "../dominio/suscripcion";
import type { LimitesInstalacion } from "./configuracion-instalacion";
import { PoliticaCuotas } from "./politica-cuotas.puerto";
import { RepositorioConfiguracionInstalacion } from "./repositorio-configuracion-instalacion.puerto";

/** Nube: los límites son las columnas del plan contratado (como hasta hoy). */
@Injectable()
export class CuotasDelPlan extends PoliticaCuotas {
  async cuotaDe(suscripcion: Suscripcion): Promise<Cuota> {
    return cuotaDeSuscripcion(suscripcion);
  }
}

/** La cuota de una instalación autoalojada: los límites por proyecto de la 32 y sin cuota de construcciones. */
export function cuotaDeInstalacion(suscripcion: Suscripcion, limites: LimitesInstalacion): Cuota {
  return {
    plan: { codigo: suscripcion.plan.codigo, nombre: suscripcion.plan.nombre },
    estado: suscripcion.estado,
    vence: null,
    maxProyectos: limites.proyectosPorUsuario ?? SIN_LIMITE,
    cpus: limites.cpuPorProyecto,
    memoriaMb: limites.memoriaMbPorProyecto,
    construccionesMes: SIN_LIMITE,
  };
}

/**
 * Autoalojado (Adapter): mismo contrato que `CuotasDelPlan`, pero los límites salen de
 * `ConfiguracionInstalacion`. Se leen en cada `cuotaDe`: un cambio en la 32 aplica en el próximo
 * despliegue, no en el que ya corre.
 */
@Injectable()
export class LimitesDeInstalacion extends PoliticaCuotas {
  constructor(private readonly configuracion: RepositorioConfiguracionInstalacion) {
    super();
  }

  async cuotaDe(suscripcion: Suscripcion): Promise<Cuota> {
    return cuotaDeInstalacion(suscripcion, await this.configuracion.limites());
  }
}
