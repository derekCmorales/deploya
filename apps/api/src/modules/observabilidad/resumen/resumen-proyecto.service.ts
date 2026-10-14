import { Injectable } from "@nestjs/common";
import { ConstruccionService } from "../../construccion/construccion.service";
import type { Despliegue } from "../../construccion/dominio/despliegue";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { RepositorioArtefactos } from "../../construccion/puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import type { VistaDespliegue } from "../../construccion/vista-despliegue";
import { CuotaPlanPuerto } from "../../orquestacion/puertos/cuota-plan.puerto";
import { DetalleProyectoPuerto, type DetalleProyecto } from "../puertos/detalle-proyecto.puerto";
import { lineaTiempoDe, type HitoLineaTiempo } from "./linea-tiempo-despliegue";

/** Cuerpo de `GET /proyectos/:id/resumen` (contrato v3, pantalla 13). */
export interface ResumenProyecto {
  proyecto: {
    id: string;
    nombre: string;
    subdominio: string;
    /** Solo mientras el activo está Saludable. */
    url: string | null;
    repositorio: string;
    rama: string;
    receta: string | null;
    puertoInterno: number;
  };
  plan: { codigo: string; nombre: string };
  activo: VistaDespliegue | null;
  ultimo: VistaDespliegue | null;
  recursos: { cpus: number; memoriaMb: number } | null;
  lineaTiempo: HitoLineaTiempo[];
}

/**
 * Modelo de lectura de M7-02 (CQRS ligero): compone lo que ya exportan M3 (proyecto), M4
 * (despliegues y su vista) y M5 (plan). No escribe nada.
 */
@Injectable()
export class ResumenProyectoService {
  constructor(
    private readonly proyectos: DetalleProyectoPuerto,
    private readonly despliegues: RepositorioDespliegues,
    private readonly artefactos: RepositorioArtefactos,
    private readonly cuota: CuotaPlanPuerto,
    private readonly construccion: ConstruccionService,
  ) {}

  async resumen(proyectoId: string, usuarioId: string): Promise<ResumenProyecto> {
    const proyecto = await this.proyectoDe(proyectoId, usuarioId);
    const [activo, [ultimo], plan] = await Promise.all([
      this.despliegues.activoDe(proyecto.id),
      this.despliegues.ultimosDe([proyecto.id]),
      this.cuota.planDe(usuarioId),
    ]);
    const vistaActivo = activo ? await this.construccion.vistaDe(activo) : null;
    const vistaUltimo = ultimo ? await this.construccion.vistaDe(ultimo) : null;
    return {
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        subdominio: proyecto.subdominio,
        url: vistaActivo?.estado === "saludable" ? vistaActivo.url : null,
        repositorio: proyecto.urlRepositorio,
        rama: proyecto.rama,
        receta: vistaActivo?.imagen?.receta ?? vistaUltimo?.imagen?.receta ?? null,
        puertoInterno: proyecto.puertoInterno,
      },
      plan,
      activo: vistaActivo,
      ultimo: vistaUltimo,
      recursos: vistaActivo?.recursos ?? null,
      lineaTiempo: ultimo ? await this.lineaTiempo(proyecto.id, ultimo) : [],
    };
  }

  private async lineaTiempo(proyectoId: string, ultimo: Despliegue): Promise<HitoLineaTiempo[]> {
    const [artefacto, [previo]] = await Promise.all([
      ultimo.artefactoId ? this.artefactos.porId(ultimo.artefactoId) : null,
      this.despliegues.historialDe(proyectoId, "saludables", ultimo.numero, 1),
    ]);
    return lineaTiempoDe(ultimo, { artefacto, anterior: previo?.numero ?? null });
  }

  private async proyectoDe(proyectoId: string, usuarioId: string): Promise<DetalleProyecto> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
    return proyecto;
  }
}
