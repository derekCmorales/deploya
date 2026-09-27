import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Despliegue, LineaBitacora } from "../../modules/construccion/dominio/despliegue";
import { DespliegueNoEncontrado } from "../../modules/construccion/dominio/errores";
import { ETAPAS, type EstadoDespliegue, type EstadoEtapa, type Etapa } from "../../modules/construccion/dominio/estados";
import {
  RepositorioDespliegues,
  type CambiosDespliegue,
  type NuevoDespliegue,
} from "../../modules/construccion/puertos/repositorio-despliegues.puerto";

/**
 * Repositorio en memoria con la misma semántica que el de Prisma (numeración,
 * cinco etapas, bitácora ordenada). Sirve para pruebas y para desarrollar sin base.
 */
@Injectable()
export class RepositorioDesplieguesMemoria extends RepositorioDespliegues {
  private readonly despliegues = new Map<string, Despliegue>();
  private readonly lineas = new Map<string, LineaBitacora[]>();
  private readonly activos = new Map<string, string>();

  async crear(nuevo: NuevoDespliegue): Promise<Despliegue> {
    const despliegue: Despliegue = {
      id: randomUUID(),
      proyectoId: nuevo.proyectoId,
      numero: this.siguienteNumero(nuevo.proyectoId),
      estado: nuevo.estado,
      disparador: nuevo.disparador,
      rama: nuevo.rama,
      commit: null,
      artefactoId: null,
      contenedorId: null,
      url: null,
      cpus: null,
      memoriaMb: null,
      codigoSalida: null,
      motivoFallo: null,
      creado: nuevo.creado,
      terminado: null,
      etapas: ETAPAS.map((etapa) => ({ etapa, estado: "pendiente", iniciada: null, terminada: null })),
    };
    this.despliegues.set(despliegue.id, despliegue);
    this.lineas.set(despliegue.id, []);
    return structuredClone(despliegue);
  }

  async porId(id: string): Promise<Despliegue | null> {
    const despliegue = this.despliegues.get(id);
    return despliegue ? structuredClone(despliegue) : null;
  }

  async cambiarEstado(id: string, estado: EstadoDespliegue, cambios: CambiosDespliegue = {}): Promise<void> {
    const despliegue = this.obtener(id);
    Object.assign(despliegue, cambios, { estado });
  }

  async marcarEtapa(id: string, etapa: Etapa, estado: EstadoEtapa, marca: Date): Promise<void> {
    const registro = this.obtener(id).etapas.find((e) => e.etapa === etapa);
    if (!registro) return;
    registro.estado = estado;
    if (estado === "en-curso") registro.iniciada = marca;
    if (estado === "completada" || estado === "fallida") registro.terminada = marca;
  }

  async agregarLineas(id: string, lineas: LineaBitacora[]): Promise<void> {
    this.lineas.get(id)?.push(...structuredClone(lineas));
  }

  async lineasDesde(id: string, desde: number, limite: number): Promise<LineaBitacora[]> {
    const todas = this.lineas.get(id) ?? [];
    return structuredClone(todas.filter((l) => l.n > desde).slice(0, limite));
  }

  async ultimosDe(proyectoIds: string[]): Promise<Despliegue[]> {
    const ultimos = new Map<string, Despliegue>();
    for (const despliegue of this.despliegues.values()) {
      if (!proyectoIds.includes(despliegue.proyectoId)) continue;
      const actual = ultimos.get(despliegue.proyectoId);
      if (!actual || despliegue.numero > actual.numero) ultimos.set(despliegue.proyectoId, despliegue);
    }
    return structuredClone([...ultimos.values()]);
  }

  async activoDe(proyectoId: string): Promise<Despliegue | null> {
    const id = this.activos.get(proyectoId);
    return id ? this.porId(id) : null;
  }

  async marcarActivo(proyectoId: string, despliegueId: string): Promise<void> {
    this.activos.set(proyectoId, despliegueId);
  }

  private siguienteNumero(proyectoId: string): number {
    const numeros = [...this.despliegues.values()].filter((d) => d.proyectoId === proyectoId).map((d) => d.numero);
    return Math.max(0, ...numeros) + 1;
  }

  private obtener(id: string): Despliegue {
    const despliegue = this.despliegues.get(id);
    if (!despliegue) throw new DespliegueNoEncontrado(id);
    return despliegue;
  }
}
