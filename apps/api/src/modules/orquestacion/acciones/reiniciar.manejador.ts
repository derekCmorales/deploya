import { Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import type { Despliegue, ProyectoDesplegable } from "../../construccion/dominio/despliegue";
import { FalloDespliegue } from "../../construccion/dominio/errores";
import type { EstadoDespliegue } from "../../construccion/dominio/estados";
import { nombreContenedor } from "../../construccion/dominio/motor.constantes";
import { transicionar } from "../../construccion/dominio/transiciones-despliegue";
import { ProyectosLecturaPuerto } from "../../construccion/puertos/proyectos-lectura.puerto";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { EnrutamientoService } from "../../enrutamiento/enrutamiento.service";
import { accionPermitida, type AccionContenedor } from "../dominio/accion-contenedor";
import { OrquestacionService } from "../orquestacion.service";
import { ManejadorAccion } from "./manejador-accion";

/**
 * Reiniciar sin reconstruir: el mismo contenedor del despliegue activo vuelve a arrancar,
 * pasa la salud y se publica otra vez. No crea despliegue ni consume construcciones.
 * Saludable → Detenido → Aprovisionando → Publicando → Saludable (o Fallido con motivo).
 */
@Injectable()
export class ReiniciarManejador extends ManejadorAccion {
  readonly tipo = "reiniciar" as const;
  private readonly registro = new Logger(ReiniciarManejador.name);

  constructor(
    private readonly despliegues: RepositorioDespliegues,
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly orquestacion: OrquestacionService,
    private readonly enrutamiento: EnrutamientoService,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async ejecutar({ proyectoId, subdominio }: AccionContenedor): Promise<void> {
    const [activo, proyecto] = await Promise.all([this.despliegues.activoDe(proyectoId), this.proyectos.porId(proyectoId)]);
    if (!activo?.contenedorId || !proyecto || !accionPermitida(this.tipo, activo.estado)) {
      this.registro.warn(`Reiniciar ${subdominio}: no hay un activo Saludable o Detenido; no se hace nada`);
      return;
    }
    let estado = activo.estado;
    try {
      if (estado === "saludable") estado = await this.detener(activo, proyecto);
      estado = await this.pasar(activo.id, estado, "aprovisionando");
      const host = nombreContenedor(proyecto.subdominio, activo.numero);
      await this.orquestacion.reanudar(activo.contenedorId, host, proyecto.puertoInterno);
      estado = await this.pasar(activo.id, estado, "publicando");
      const url = await this.enrutamiento.publicar({ subdominio: proyecto.subdominio, host, puerto: proyecto.puertoInterno });
      await this.despliegues.cambiarEstado(activo.id, transicionar(estado, "saludable"), { url, terminado: this.reloj.ahora() });
    } catch (error) {
      if (!(error instanceof FalloDespliegue)) throw error;
      await this.despliegues.cambiarEstado(activo.id, transicionar(estado, "fallido"), {
        motivoFallo: error.motivo,
        terminado: this.reloj.ahora(),
      });
    }
  }

  private async detener(activo: Despliegue, proyecto: ProyectoDesplegable): Promise<EstadoDespliegue> {
    await this.enrutamiento.retirar(proyecto.subdominio);
    await this.orquestacion.detenerContenedor(activo.contenedorId ?? "");
    return this.pasar(activo.id, activo.estado, "detenido");
  }

  private async pasar(id: string, de: EstadoDespliegue, a: EstadoDespliegue): Promise<EstadoDespliegue> {
    const nuevo = transicionar(de, a);
    await this.despliegues.cambiarEstado(id, nuevo);
    return nuevo;
  }
}
