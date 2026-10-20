import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { ConstruccionService } from "../construccion.service";
import type { Despliegue, DespliegueCreado } from "../dominio/despliegue";
import { CommitDesconocido, DespliegueNoEncontrado, ProyectoNoEncontrado } from "../dominio/errores";
import { exigirCancelable, exigirReintentable } from "../dominio/politica-acciones";
import { transicionar } from "../dominio/transiciones-despliegue";
import { CancelacionesPuerto } from "../puertos/cancelaciones.puerto";
import { ColaConstruccionPuerto } from "../puertos/cola-construccion.puerto";
import { ProyectosLecturaPuerto } from "../puertos/proyectos-lectura.puerto";
import { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";

const TEXTO_CANCELADO = "Cancelado por el usuario";
const FORMATO_SHA = /^[0-9a-f]{7,40}$/i;

/**
 * Service Layer de M4-02: valida con `PoliticaAcciones` y delega. Cancelar un Encolado lo saca
 * de la cola; en curso deja la señal que el trabajador ve (`VigiaCancelacion`). Reintentar y
 * redesplegar son despliegues nuevos que pasan por los bloqueos de M5-03. Nunca toca Docker.
 */
@Injectable()
export class AccionesDespliegueService {
  constructor(
    private readonly despliegues: RepositorioDespliegues,
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly cola: ColaConstruccionPuerto,
    private readonly cancelaciones: CancelacionesPuerto,
    private readonly construccion: ConstruccionService,
    private readonly reloj: Reloj,
  ) {}

  /** `POST /despliegues/:id/cancelar`: el estado final lo confirma el polling de la web. */
  async cancelar(despliegueId: string, usuarioId: string): Promise<{ estado: "cancelado" }> {
    const despliegue = await this.despliegueDe(despliegueId, usuarioId);
    exigirCancelable(despliegue.estado);
    const salioDeLaCola = await this.cola.quitar(despliegue.id);
    if (salioDeLaCola) await this.cancelarSinEjecutar(despliegue);
    else await this.cancelaciones.pedir(despliegue.id);
    return { estado: "cancelado" };
  }

  /** `POST /despliegues/:id/reintentar`: mismo commit, `disparador = reintento`, cuenta como construcción. */
  async reintentar(despliegueId: string, usuarioId: string): Promise<DespliegueCreado> {
    const despliegue = await this.despliegueDe(despliegueId, usuarioId);
    exigirReintentable(despliegue.estado);
    return this.construccion.crearDespliegue(despliegue.proyectoId, "reintento", { commitSha: despliegue.commit?.sha });
  }

  /** `POST /proyectos/:id/redespliegues`: reconstruye un commit que ya se desplegó en el proyecto. */
  async redesplegar(proyectoId: string, commitSha: string, usuarioId: string): Promise<DespliegueCreado> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
    if (!FORMATO_SHA.test(commitSha)) throw new CommitDesconocido(commitSha);
    return this.construccion.crearDespliegue(proyecto.id, "redespliegue", { commitSha: commitSha.toLowerCase() });
  }

  /** Nadie lo había tomado: no hay trabajador que lo escriba, así que la API lo deja Cancelado. */
  private async cancelarSinEjecutar(despliegue: Despliegue): Promise<void> {
    await this.despliegues.agregarLineas(despliegue.id, [
      { n: 1, marca: this.reloj.ahora(), etapa: "recepcion", nivel: "aviso", texto: TEXTO_CANCELADO },
    ]);
    await this.despliegues.cambiarEstado(despliegue.id, transicionar(despliegue.estado, "cancelado"), { terminado: this.reloj.ahora() });
  }

  private async despliegueDe(despliegueId: string, usuarioId: string): Promise<Despliegue> {
    const despliegue = await this.despliegues.porId(despliegueId);
    if (!despliegue) throw new DespliegueNoEncontrado(despliegueId);
    const proyecto = await this.proyectos.porId(despliegue.proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new DespliegueNoEncontrado(despliegueId);
    return despliegue;
  }
}
