import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { BloqueosService } from "../orquestacion/bloqueos.service";
import type { Commit, Despliegue, DespliegueCreado, ProyectoDesplegable } from "./dominio/despliegue";
import { CommitDesconocido, DespliegueNoEncontrado, ProyectoNoEncontrado } from "./dominio/errores";
import { DISPARADOR_SIN_CONSTRUCCION, type DisparadorDespliegue } from "./dominio/estados";
import { LINEAS_POR_PAGINA } from "./dominio/motor.constantes";
import { ColaConstruccionPuerto } from "./puertos/cola-construccion.puerto";
import { ProyectosLecturaPuerto } from "./puertos/proyectos-lectura.puerto";
import { RepositorioArtefactos } from "./puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "./puertos/repositorio-despliegues.puerto";
import {
  paginaBitacora,
  resumenDespliegue,
  vistaDespliegue,
  type PaginaBitacora,
  type ResumenDespliegue,
  type VistaDespliegue,
} from "./vista-despliegue";

export interface OpcionesDespliegue {
  /** Commit ya desplegado en el proyecto que se vuelve a clonar (reintentar, redesplegar). */
  commitSha?: string;
}

/**
 * Facade de M4: única puerta que usan M3 y la web. Registra y encola; nunca construye
 * (eso es del trabajador) ni toca Docker.
 */
@Injectable()
export class ConstruccionService {
  constructor(
    private readonly despliegues: RepositorioDespliegues,
    private readonly artefactos: RepositorioArtefactos,
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly cola: ColaConstruccionPuerto,
    private readonly bloqueos: BloqueosService,
    private readonly reloj: Reloj,
  ) {}

  /**
   * Contrato interno M3 → M4: M3 ya validó al dueño al persistir el proyecto. Con `commitSha`
   * (reintentar, redesplegar) el despliegue nace con ese commit y Recepción lo clona fijo.
   */
  async crearDespliegue(
    proyectoId: string,
    disparador: DisparadorDespliegue = "manual",
    opciones: OpcionesDespliegue = {},
  ): Promise<DespliegueCreado> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto) throw new ProyectoNoEncontrado(proyectoId);
    return this.registrarYEncolar(proyecto, disparador, await this.commitFijado(proyecto.id, opciones.commitSha));
  }

  /** `POST /proyectos/:id/despliegues`: un proyecto ajeno se trata como inexistente. */
  async desplegarComoDueno(proyectoId: string, usuarioId: string): Promise<DespliegueCreado> {
    const proyecto = await this.proyectoDe(proyectoId, usuarioId);
    return this.registrarYEncolar(proyecto, "manual");
  }

  async consultar(despliegueId: string, usuarioId: string): Promise<VistaDespliegue> {
    return this.vistaDe(await this.despliegueDe(despliegueId, usuarioId));
  }

  /** `GET /proyectos/:id/despliegues/:numero`: número inexistente o proyecto ajeno → 404. */
  async consultarPorNumero(proyectoId: string, numero: number, usuarioId: string): Promise<VistaDespliegue> {
    await this.proyectoDe(proyectoId, usuarioId);
    const despliegue = await this.despliegues.porNumero(proyectoId, numero);
    if (!despliegue) throw new DespliegueNoEncontrado(`${proyectoId}#${numero}`);
    return this.vistaDe(despliegue);
  }

  async bitacoraDesde(despliegueId: string, usuarioId: string, desde: number): Promise<PaginaBitacora> {
    const despliegue = await this.despliegueDe(despliegueId, usuarioId);
    const lineas = await this.despliegues.lineasDesde(despliegue.id, desde, LINEAS_POR_PAGINA);
    return paginaBitacora(lineas, desde, despliegue.estado);
  }

  /**
   * Contrato M3 → M4 para la lista (pantalla 10): el último despliegue de cada proyecto.
   * M3 ya filtró los proyectos del usuario; los que nunca se desplegaron no vienen.
   */
  async ultimosDespliegues(proyectoIds: string[]): Promise<Record<string, ResumenDespliegue>> {
    if (proyectoIds.length === 0) return {};
    const ultimos = await this.despliegues.ultimosDe(proyectoIds);
    return Object.fromEntries(ultimos.map((d) => [d.proyectoId, resumenDespliegue(d)]));
  }

  /** M5-03: se verifica antes de crear nada, así el cliente recibe el 409 al instante. */
  private async registrarYEncolar(
    proyecto: ProyectoDesplegable,
    disparador: DisparadorDespliegue,
    commit?: Commit,
  ): Promise<DespliegueCreado> {
    if (disparador !== DISPARADOR_SIN_CONSTRUCCION) await this.bloqueos.verificar(proyecto.usuarioId);
    const despliegue = await this.despliegues.crear({
      proyectoId: proyecto.id,
      disparador,
      rama: proyecto.rama,
      estado: "encolado",
      creado: this.reloj.ahora(),
      commit,
    });
    await this.cola.encolar({ despliegueId: despliegue.id, plan: "construccion" });
    return { id: despliegue.id, numero: despliegue.numero, estado: despliegue.estado };
  }

  /** El commit completo con el que se desplegó antes; sin él no hay nada que fijar (`commit-desconocido`). */
  private async commitFijado(proyectoId: string, commitSha: string | undefined): Promise<Commit | undefined> {
    if (!commitSha) return undefined;
    const previo = await this.despliegues.porCommit(proyectoId, commitSha);
    if (!previo?.commit) throw new CommitDesconocido(commitSha);
    return previo.commit;
  }

  private async vistaDe(despliegue: Despliegue): Promise<VistaDespliegue> {
    const artefacto = despliegue.artefactoId ? await this.artefactos.porId(despliegue.artefactoId) : null;
    const imagen = artefacto
      ? { numero: artefacto.numero, digest: artefacto.digest, tamanoBytes: artefacto.tamanoBytes, receta: artefacto.receta }
      : null;
    return vistaDespliegue(despliegue, imagen);
  }

  private async proyectoDe(proyectoId: string, usuarioId: string): Promise<ProyectoDesplegable> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
    return proyecto;
  }

  private async despliegueDe(despliegueId: string, usuarioId: string): Promise<Despliegue> {
    const despliegue = await this.despliegues.porId(despliegueId);
    if (!despliegue) throw new DespliegueNoEncontrado(despliegueId);
    const proyecto = await this.proyectos.porId(despliegue.proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new DespliegueNoEncontrado(despliegueId);
    return despliegue;
  }
}
