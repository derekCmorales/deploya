import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import type { Artefacto, Commit, DespliegueCreado, ProyectoDesplegable } from "../../construccion/dominio/despliegue";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import type { Etapa } from "../../construccion/dominio/estados";
import { ColaConstruccionPuerto } from "../../construccion/puertos/cola-construccion.puerto";
import { ProyectosLecturaPuerto } from "../../construccion/puertos/proyectos-lectura.puerto";
import { RepositorioArtefactos } from "../../construccion/puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { ArtefactoNoDisponible, ArtefactoYaActivo, DespliegueEnCurso } from "../dominio/errores";

/** Una reversión no clona ni construye: esas dos etapas llegan `omitida` (contrato v2). */
const ETAPAS_OMITIDAS: readonly Etapa[] = ["recepcion", "construccion"];

/** Lo que la pantalla 14 necesita saber de cada artefacto. */
export interface VistaArtefacto {
  id: string;
  numero: number;
  digest: string;
  tamanoBytes: number;
  receta: Artefacto["receta"];
  commit: { sha: string; mensaje: string };
  creado: Date;
  disponible: boolean;
  activo: boolean;
}

/**
 * Caso de uso de M5-04: valida y crea el despliegue `reversion`; no ejecuta nada. El trabajador
 * lo recorre con el plan `reversion` (Ejecución → Enrutamiento → Operación).
 */
@Injectable()
export class ReversionService {
  constructor(
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly artefactos: RepositorioArtefactos,
    private readonly despliegues: RepositorioDespliegues,
    private readonly cola: ColaConstruccionPuerto,
    private readonly reloj: Reloj,
  ) {}

  async revertir(proyectoId: string, artefactoId: string, usuarioId: string): Promise<DespliegueCreado> {
    const proyecto = await this.proyectoDe(proyectoId, usuarioId);
    const artefacto = await this.artefactos.porId(artefactoId);
    if (!artefacto || artefacto.proyectoId !== proyecto.id) throw new ArtefactoNoDisponible(artefactoId);
    if (!artefacto.disponible) throw new ArtefactoNoDisponible(artefactoId);
    const activo = await this.despliegues.activoDe(proyecto.id);
    if (activo?.artefactoId === artefacto.id) throw new ArtefactoYaActivo(artefacto.id);
    if (await this.despliegues.enCursoDe(proyecto.id)) throw new DespliegueEnCurso(proyecto.id);

    const despliegue = await this.despliegues.crear({
      proyectoId: proyecto.id,
      disparador: "reversion",
      rama: proyecto.rama,
      estado: "revirtiendo",
      creado: this.reloj.ahora(),
      artefactoId: artefacto.id,
      commit: await this.commitDe(proyecto.id, artefacto),
      etapasOmitidas: ETAPAS_OMITIDAS,
    });
    await this.cola.encolar({ despliegueId: despliegue.id, plan: "reversion" });
    return { id: despliegue.id, numero: despliegue.numero, estado: despliegue.estado };
  }

  /** `GET /proyectos/:id/artefactos`: los más recientes primero, con el activo marcado. */
  async artefactosDe(proyectoId: string, usuarioId: string): Promise<VistaArtefacto[]> {
    const proyecto = await this.proyectoDe(proyectoId, usuarioId);
    const [artefactos, activo] = await Promise.all([this.artefactos.deProyecto(proyecto.id), this.despliegues.activoDe(proyecto.id)]);
    return Promise.all(
      artefactos.map(async (artefacto) => ({
        id: artefacto.id,
        numero: artefacto.numero,
        digest: artefacto.digest,
        tamanoBytes: artefacto.tamanoBytes,
        receta: artefacto.receta,
        commit: { sha: artefacto.commitSha, mensaje: (await this.commitDe(proyecto.id, artefacto)).mensaje },
        creado: artefacto.creado,
        disponible: artefacto.disponible,
        activo: activo?.artefactoId === artefacto.id,
      })),
    );
  }

  /** El commit lo guardó el despliegue que construyó el artefacto (mismo número). */
  private async commitDe(proyectoId: string, artefacto: Artefacto): Promise<Commit> {
    const constructor = await this.despliegues.porNumero(proyectoId, artefacto.numero);
    return constructor?.commit ?? { sha: artefacto.commitSha, mensaje: "", autor: "" };
  }

  private async proyectoDe(proyectoId: string, usuarioId: string): Promise<ProyectoDesplegable> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
    return proyecto;
  }
}
