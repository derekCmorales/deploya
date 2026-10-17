import type { Artefacto } from "../../construccion/dominio/despliegue";
import { ARTEFACTOS_RETENIDOS, PoliticaRetencion } from "./politica-retencion";

function artefactos(...numeros: number[]): Artefacto[] {
  return numeros.map((numero) => ({
    id: `artefacto-${numero}`,
    proyectoId: "proyecto-1",
    numero,
    imagen: `deploya/hola-deploya:${numero}`,
    digest: `sha256:${numero}`,
    tamanoBytes: 1024,
    commitSha: "a".repeat(40),
    receta: "dockerfile",
    disponible: true,
    creado: new Date("2026-10-14T12:00:00Z"),
  }));
}

describe("PoliticaRetencion (M5-04)", () => {
  it("conserva cinco artefactos", () => {
    expect(ARTEFACTOS_RETENIDOS).toBe(5);
  });

  it("Retención de cinco", () => {
    const disponibles = artefactos(1, 2, 3, 4, 5, 6, 7);

    const retirados = PoliticaRetencion.aRetirar(disponibles, "artefacto-7");

    expect(retirados.map((a) => a.numero)).toEqual([1, 2]);
  });

  it("El activo nunca se retira", () => {
    const disponibles = artefactos(1, 2, 3, 4, 5, 6, 7, 8);

    const retirados = PoliticaRetencion.aRetirar(disponibles, "artefacto-2");

    expect(retirados.map((a) => a.numero)).toEqual([1, 3]);
  });

  it("no retira nada con cinco o menos", () => {
    expect(PoliticaRetencion.aRetirar(artefactos(1, 2, 3, 4, 5), "artefacto-5")).toEqual([]);
    expect(PoliticaRetencion.aRetirar([], null)).toEqual([]);
  });

  it("sin activo conocido se queda con los más recientes", () => {
    const retirados = PoliticaRetencion.aRetirar(artefactos(3, 1, 2), null, 2);

    expect(retirados.map((a) => a.numero)).toEqual([1]);
  });
});
