import { Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { transicionar } from "../../construccion/dominio/transiciones-despliegue";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { EnrutamientoService } from "../../enrutamiento/enrutamiento.service";
import { accionPermitida, type AccionContenedor } from "../dominio/accion-contenedor";
import { OrquestacionService } from "../orquestacion.service";
import { ManejadorAccion } from "./manejador-accion";

/** Detener: primero se retira la ruta (404 en vez de 502), luego el contenedor; el activo queda Detenido. */
@Injectable()
export class DetenerManejador extends ManejadorAccion {
  readonly tipo = "detener" as const;
  private readonly registro = new Logger(DetenerManejador.name);

  constructor(
    private readonly despliegues: RepositorioDespliegues,
    private readonly orquestacion: OrquestacionService,
    private readonly enrutamiento: EnrutamientoService,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async ejecutar({ proyectoId, subdominio }: AccionContenedor): Promise<void> {
    const activo = await this.despliegues.activoDe(proyectoId);
    if (!activo?.contenedorId || !accionPermitida(this.tipo, activo.estado)) {
      this.registro.warn(`Detener ${subdominio}: el activo ya no está Saludable; no se hace nada`);
      return;
    }
    await this.enrutamiento.retirar(subdominio);
    await this.orquestacion.detenerContenedor(activo.contenedorId);
    await this.despliegues.cambiarEstado(activo.id, transicionar(activo.estado, "detenido"), { terminado: this.reloj.ahora() });
  }
}
