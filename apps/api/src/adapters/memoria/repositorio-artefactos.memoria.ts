import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Artefacto } from "../../modules/construccion/dominio/despliegue";
import {
  RepositorioArtefactos,
  type NuevoArtefacto,
} from "../../modules/construccion/puertos/repositorio-artefactos.puerto";

@Injectable()
export class RepositorioArtefactosMemoria extends RepositorioArtefactos {
  readonly artefactos: Artefacto[] = [];

  async registrar(nuevo: NuevoArtefacto): Promise<Artefacto> {
    const artefacto: Artefacto = { ...nuevo, id: randomUUID(), disponible: true };
    this.artefactos.push(artefacto);
    return artefacto;
  }

  async porId(id: string): Promise<Artefacto | null> {
    return this.artefactos.find((a) => a.id === id) ?? null;
  }

  async deProyecto(proyectoId: string): Promise<Artefacto[]> {
    return this.artefactos.filter((a) => a.proyectoId === proyectoId).sort((a, b) => b.numero - a.numero);
  }

  async disponiblesDe(proyectoId: string): Promise<Artefacto[]> {
    return (await this.deProyecto(proyectoId)).filter((a) => a.disponible);
  }

  async marcarNoDisponible(id: string): Promise<void> {
    const artefacto = this.artefactos.find((a) => a.id === id);
    if (artefacto) artefacto.disponible = false;
  }
}
