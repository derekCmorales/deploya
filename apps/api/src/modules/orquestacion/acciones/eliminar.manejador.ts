import { Injectable } from "@nestjs/common";
import { EnrutamientoService } from "../../enrutamiento/enrutamiento.service";
import type { AccionContenedor } from "../dominio/accion-contenedor";
import { OrquestacionService } from "../orquestacion.service";
import { ManejadorAccion } from "./manejador-accion";

/**
 * Eliminar proyecto (M3-04): quita la ruta, los contenedores y las imágenes `deploya/<subdominio>:*`.
 * Idempotente: si ya no existen, no falla (el proyecto ya se borró de la base).
 */
@Injectable()
export class EliminarManejador extends ManejadorAccion {
  readonly tipo = "eliminar" as const;

  constructor(
    private readonly orquestacion: OrquestacionService,
    private readonly enrutamiento: EnrutamientoService,
  ) {
    super();
  }

  async ejecutar({ subdominio }: AccionContenedor): Promise<void> {
    await this.enrutamiento.retirar(subdominio);
    await this.orquestacion.eliminarRecursosDe(subdominio);
  }
}
