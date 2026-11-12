import { Injectable } from "@nestjs/common";
import { EnrutamientoService } from "../../enrutamiento/enrutamiento.service";
import type { AccionContenedor } from "../dominio/accion-contenedor";
import { OrquestacionService } from "../orquestacion.service";
import { RecursosDatosDespliegue } from "../puertos/recursos-datos-despliegue.puerto";
import { ManejadorAccion } from "./manejador-accion";

/**
 * Eliminar proyecto (M3-04): quita la ruta, los contenedores y las imágenes `deploya/<subdominio>:*`, y
 * sus recursos de datos con su volumen (los compartidos con él solo se desconectan). Las filas caen en
 * cascada en la base, pero Docker no: por eso se limpia aquí.
 * Idempotente: si ya no existen, no falla (el proyecto ya se borró de la base).
 */
@Injectable()
export class EliminarManejador extends ManejadorAccion {
  readonly tipo = "eliminar" as const;

  constructor(
    private readonly orquestacion: OrquestacionService,
    private readonly enrutamiento: EnrutamientoService,
    private readonly datos: RecursosDatosDespliegue,
  ) {
    super();
  }

  async ejecutar({ subdominio }: AccionContenedor): Promise<void> {
    await this.enrutamiento.retirar(subdominio);
    await this.orquestacion.eliminarRecursosDe(subdominio);
    await this.datos.liberarProyecto(subdominio);
  }
}
