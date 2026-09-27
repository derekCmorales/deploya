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
}
