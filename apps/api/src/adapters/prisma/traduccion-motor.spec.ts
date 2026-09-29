import { Prisma } from "@prisma/client";
import {
  artefactoDesdePrisma,
  despliegueDesdePrisma,
  estadoEtapaAPrisma,
  estadoEtapaDesdePrisma,
  type DespliegueConEtapas,
} from "./traduccion-motor";

const CREADO = new Date("2026-09-30T12:00:00.000Z");

function filaDespliegue(cambios: Partial<DespliegueConEtapas> = {}): DespliegueConEtapas {
  return {
    id: "d-1",
    proyectoId: "p-1",
    numero: 1,
    estado: "saludable",
    disparador: "alta",
    rama: "main",
    commitSha: "a1b2c3d",
    commitMensaje: "feat: hola",
    commitAutor: "Derek",
    artefactoId: "a-1",
    contenedorId: "c-1",
    url: "http://hola-deploya.localhost",
    cpus: new Prisma.Decimal(0.25),
    memoriaMb: 256,
    codigoSalida: null,
    motivoFallo: null,
    creado: CREADO,
    iniciado: null,
    terminado: CREADO,
    actualizado: CREADO,
    etapas: [
      { despliegueId: "d-1", etapa: "operacion", estado: "en_curso", iniciada: CREADO, terminada: null },
      { despliegueId: "d-1", etapa: "recepcion", estado: "completada", iniciada: CREADO, terminada: CREADO },
    ],
    ...cambios,
  };
}

describe("Traducción Prisma ↔ dominio del motor", () => {
  it("los estados de etapa cambian `_` por `-` en ambos sentidos", () => {
    expect(estadoEtapaAPrisma("en-curso")).toBe("en_curso");
    expect(estadoEtapaDesdePrisma("en_curso")).toBe("en-curso");
  });

  it("un despliegue trae su commit, los límites como número y las etapas en el orden del riel", () => {
    const despliegue = despliegueDesdePrisma(filaDespliegue());

    expect(despliegue.commit).toEqual({ sha: "a1b2c3d", mensaje: "feat: hola", autor: "Derek" });
    expect(despliegue.cpus).toBe(0.25);
    expect(despliegue.etapas.map((e) => [e.etapa, e.estado])).toEqual([
      ["recepcion", "completada"],
      ["operacion", "en-curso"],
    ]);
  });

  it("sin commit ni límites quedan en null", () => {
    const despliegue = despliegueDesdePrisma(filaDespliegue({ commitSha: null, cpus: null }));

    expect(despliegue.commit).toBeNull();
    expect(despliegue.cpus).toBeNull();
  });

  it("el tamaño del artefacto pasa de BigInt a número", () => {
    const artefacto = artefactoDesdePrisma({
      id: "a-1",
      proyectoId: "p-1",
      numero: 1,
      imagen: "deploya/hola-deploya:1",
      digest: "sha256:abc",
      tamanoBytes: BigInt(52_428_800),
      commitSha: "a1b2c3d",
      receta: "dockerfile",
      disponible: true,
      creado: CREADO,
    });

    expect(artefacto.tamanoBytes).toBe(52_428_800);
  });
});
