import type { PrismaService } from "../../compartido/prisma/prisma.service";
import { RepositorioDesplieguesMemoria } from "../memoria/repositorio-despliegues.memoria";
import { RepositorioDesplieguesPrisma } from "./repositorio-despliegues.prisma";

const MARCA = new Date("2026-10-25T12:00:00.000Z");
const linea = (n: number) => ({ n, marca: MARCA, etapa: "construccion" as const, nivel: "info" as const, texto: `línea ${n}` });

describe("ultimasLineas (SP-08)", () => {
  it("Prisma pide las últimas por n descendente y las devuelve en orden", async () => {
    const findMany = jest.fn().mockResolvedValue([linea(14), linea(13)]);
    const repo = new RepositorioDesplieguesPrisma({ lineaBitacora: { findMany } } as unknown as PrismaService);

    await expect(repo.ultimasLineas("d-1", 2)).resolves.toEqual([linea(13), linea(14)]);
    expect(findMany).toHaveBeenCalledWith({ where: { despliegueId: "d-1" }, orderBy: { n: "desc" }, take: 2 });
  });

  it("en memoria, las mismas: las últimas en orden de n", async () => {
    const repo = new RepositorioDesplieguesMemoria();
    const { id } = await repo.crear({ proyectoId: "p-1", disparador: "manual", rama: "main", estado: "encolado", creado: MARCA });
    await repo.agregarLineas(id, [linea(1), linea(2), linea(3)]);

    await expect(repo.ultimasLineas(id, 2)).resolves.toEqual([linea(2), linea(3)]);
    await expect(repo.ultimasLineas("otro", 2)).resolves.toEqual([]);
  });
});
