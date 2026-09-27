import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import type { Despliegue, DespliegueCreado, ProyectoDesplegable } from "./dominio/despliegue";
import { DespliegueNoEncontrado, ProyectoNoEncontrado } from "./dominio/errores";
import type { DisparadorDespliegue } from "./dominio/estados";
import { LINEAS_POR_PAGINA } from "./dominio/motor.constantes";
import { ColaConstruccionPuerto } from "./puertos/cola-construccion.puerto";
import { ProyectosLecturaPuerto } from "./puertos/proyectos-lectura.puerto";
import { RepositorioArtefactos } from "./puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "./puertos/repositorio-despliegues.puerto";
import { paginaBitacora, vistaDespliegue, type PaginaBitacora, type VistaDespliegue } from "./vista-despliegue";

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
    private readonly reloj: Reloj,
  ) {}

  /** Contrato interno M3 → M4: M3 ya validó al dueño al persistir el proyecto. */
  async crearDespliegue(proyectoId: string, disparador: DisparadorDespliegue = "manual"): Promise<DespliegueCreado> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto) throw new ProyectoNoEncontrado(proyectoId);
    return this.registrarYEncolar(proyecto, disparador);
  }

  /** `POST /proyectos/:id/despliegues`: un proyecto ajeno se trata como inexistente. */
  async desplegarComoDueno(proyectoId: string, usuarioId: string): Promise<DespliegueCreado> {
    const proyecto = await this.proyectoDe(proyectoId, usuarioId);
    return this.registrarYEncolar(proyecto, "manual");
  }

  async consultar(despliegueId: string, usuarioId: string): Promise<VistaDespliegue> {
    const despliegue = await this.despliegueDe(despliegueId, usuarioId);
    const artefacto = despliegue.artefactoId ? await this.artefactos.porId(despliegue.artefactoId) : null;
    const imagen = artefacto
      ? { numero: artefacto.numero, digest: artefacto.digest, tamanoBytes: artefacto.tamanoBytes, receta: artefacto.receta }
      : null;
    return vistaDespliegue(despliegue, imagen);
  }

  async bitacoraDesde(despliegueId: string, usuarioId: string, desde: number): Promise<PaginaBitacora> {
    const despliegue = await this.despliegueDe(despliegueId, usuarioId);
    const lineas = await this.despliegues.lineasDesde(despliegue.id, desde, LINEAS_POR_PAGINA);
    return paginaBitacora(lineas, desde, despliegue.estado);
  }

  private async registrarYEncolar(proyecto: ProyectoDesplegable, disparador: DisparadorDespliegue): Promise<DespliegueCreado> {
    const despliegue = await this.despliegues.crear({
      proyectoId: proyecto.id,
      disparador,
      rama: proyecto.rama,
      estado: "encolado",
      creado: this.reloj.ahora(),
    });
    await this.cola.encolar({ despliegueId: despliegue.id, plan: "construccion" });
    return { id: despliegue.id, numero: despliegue.numero, estado: despliegue.estado };
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
