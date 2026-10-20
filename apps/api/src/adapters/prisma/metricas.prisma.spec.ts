import type { PrismaService } from "../../compartido/prisma/prisma.service";
import { RepositorioDesplieguesPrisma } from "./repositorio-despliegues.prisma";
import { MuestrasMetricasPrisma } from "./muestras-metricas.prisma";

function prismaDoble(delegados: Record<string, unknown>): PrismaService {
  return delegados as unknown as PrismaService;
}

describe("Persistencia de métricas", () => {
  it("tiemposDe lee los últimos y los devuelve del más antiguo al más reciente", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repo = new RepositorioDesplieguesPrisma(prismaDoble({ despliegue: { findMany } }));

    await expect(repo.tiemposDe("p-1", 14)).resolves.toEqual([]);

    expect(findMany).toHaveBeenCalledWith({
      where: { proyectoId: "p-1" },
      orderBy: { numero: "desc" },
      take: 14,
      include: { etapas: true },
    });
  });

  it("activosSaludables solo pide el activo Saludable con contenedor", async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: "d1", contenedorId: "c1" },
      { id: "d2", contenedorId: null },
    ]);
    const repo = new RepositorioDesplieguesPrisma(prismaDoble({ despliegue: { findMany } }));

    await expect(repo.activosSaludables()).resolves.toEqual([{ despliegueId: "d1", contenedorId: "c1" }]);
    expect(findMany).toHaveBeenCalledWith({
      where: { estado: "saludable", contenedorId: { not: null }, proyectoActivo: { isNot: null } },
      select: { id: true, contenedorId: true },
    });
  });

  it("entraronDesde filtra por proyecto y fecha", async () => {
    const desde = new Date("2026-10-20T00:00:00.000Z");
    const filas = [{ numero: 14, creado: desde }];
    const findMany = jest.fn().mockResolvedValue(filas);
    const repo = new RepositorioDesplieguesPrisma(prismaDoble({ despliegue: { findMany } }));

    await expect(repo.entraronDesde("p-1", desde)).resolves.toEqual(filas);
    expect(findMany).toHaveBeenCalledWith({
      where: { proyectoId: "p-1", creado: { gte: desde } },
      select: { numero: true, creado: true },
      orderBy: { creado: "asc" },
    });
  });

  it("guardar, leer y purgar pasan por MuestraMetrica", async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const findMany = jest.fn().mockResolvedValue([
      { despliegueId: "d1", tomada: new Date("2026-10-20T17:00:00.000Z"), cpu: { toNumber: () => 0.12 }, memoriaMb: 430, despliegue: { numero: 14 } },
    ]);
    const deleteMany = jest.fn().mockResolvedValue({ count: 3 });
    const muestras = new MuestrasMetricasPrisma(prismaDoble({ muestraMetrica: { create, findMany, deleteMany } }));
    const tomada = new Date("2026-10-20T17:00:00.000Z");

    await muestras.guardar({ despliegueId: "d1", tomada, cpu: 0.12, memoriaMb: 430 });
    await expect(muestras.deProyecto("p-1", tomada)).resolves.toEqual([
      { despliegueId: "d1", tomada, cpu: 0.12, memoriaMb: 430, version: 14 },
    ]);
    await expect(muestras.purgarAntesDe(tomada)).resolves.toBe(3);

    expect(create).toHaveBeenCalledWith({ data: { despliegueId: "d1", tomada, cpu: 0.12, memoriaMb: 430 } });
    expect(deleteMany).toHaveBeenCalledWith({ where: { tomada: { lt: tomada } } });
  });
});
