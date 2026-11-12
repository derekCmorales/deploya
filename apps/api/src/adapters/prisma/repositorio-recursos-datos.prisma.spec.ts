import { Prisma } from "@prisma/client";
import type { PrismaService } from "../../compartido/prisma/prisma.service";
import { TipoYaConectado } from "../../modules/datos/dominio/errores";
import { RepositorioRecursosDatosPrisma } from "./repositorio-recursos-datos.prisma";

const FILA = {
  id: "r1",
  proyectoId: "api",
  tipo: "postgres" as const,
  estado: "disponible" as const,
  detalle: null,
  contenedor: "deploya-datos-api-postgres",
  volumen: "deploya-datos-api-postgres",
  contrasenaCifrada: "v1:x",
  usoDiscoMb: 10,
  medidoEn: null,
  creado: new Date("2026-11-12T10:00:00.000Z"),
  actualizado: new Date("2026-11-12T10:00:00.000Z"),
  compartidos: [{ proyectoId: "worker" }],
};

function prismaDoble() {
  const recursoDatos = {
    create: jest.fn().mockResolvedValue(FILA),
    findUnique: jest.fn().mockResolvedValue(FILA),
    findMany: jest.fn().mockResolvedValue([FILA]),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  };
  const recursoDatosCompartido = { upsert: jest.fn(), deleteMany: jest.fn() };
  return { recursoDatos, recursoDatosCompartido, prisma: { recursoDatos, recursoDatosCompartido } as unknown as PrismaService };
}

const NUEVO = { proyectoId: "api", tipo: "postgres" as const, contenedor: "c", volumen: "c", contrasenaCifrada: "v1:x" };

describe("RepositorioRecursosDatosPrisma", () => {
  it("traduce la fila con sus compartidos al agregado", async () => {
    const { prisma } = prismaDoble();

    const recurso = await new RepositorioRecursosDatosPrisma(prisma).porId("r1");

    expect(recurso).toEqual(expect.objectContaining({ id: "r1", tipo: "postgres", estado: "disponible", compartidoCon: ["worker"], usoDiscoMb: 10 }));
    expect(recurso).not.toHaveProperty("actualizado");
  });

  it("un segundo recurso del mismo tipo en el proyecto (P2002) es TipoYaConectado, como en memoria (L)", async () => {
    const doble = prismaDoble();
    doble.recursoDatos.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("único", { code: "P2002", clientVersion: "6" }));

    await expect(new RepositorioRecursosDatosPrisma(doble.prisma).crear(NUEVO)).rejects.toThrow(TipoYaConectado);
  });

  it("otros errores de la base suben sin traducir", async () => {
    const doble = prismaDoble();
    doble.recursoDatos.create.mockRejectedValue(new Error("se cayó"));

    await expect(new RepositorioRecursosDatosPrisma(doble.prisma).crear(NUEVO)).rejects.toThrow("se cayó");
  });

  it("conectadosA busca propios o compartidos con el proyecto", async () => {
    const doble = prismaDoble();

    await new RepositorioRecursosDatosPrisma(doble.prisma).conectadosA("worker");

    expect(doble.recursoDatos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ proyectoId: "worker" }, { compartidos: { some: { proyectoId: "worker" } } }] } }),
    );
  });

  it("deDuenos sin proyectos no consulta la base", async () => {
    const doble = prismaDoble();

    expect(await new RepositorioRecursosDatosPrisma(doble.prisma).deDuenos([])).toEqual([]);
    expect(doble.recursoDatos.findMany).not.toHaveBeenCalled();
  });

  it("escrituras: crear, disponibles, compartir (upsert), dejar de compartir, estado, uso y eliminar", async () => {
    const doble = prismaDoble();
    const repositorio = new RepositorioRecursosDatosPrisma(doble.prisma);
    const medido = new Date("2026-11-12T10:05:00.000Z");

    await repositorio.crear(NUEVO);
    await repositorio.deDuenos(["api"]);
    await repositorio.disponibles();
    await repositorio.compartir("r1", "worker");
    await repositorio.dejarDeCompartir("r1", "worker");
    await repositorio.cambiarEstado("r1", "error", "falló");
    await repositorio.registrarUso("r1", 40, medido);
    await repositorio.eliminar("r1");

    expect(doble.recursoDatos.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { estado: "disponible" } }));
    expect(doble.recursoDatosCompartido.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { recursoId: "r1", proyectoId: "worker" } }));
    expect(doble.recursoDatosCompartido.deleteMany).toHaveBeenCalledWith({ where: { recursoId: "r1", proyectoId: "worker" } });
    expect(doble.recursoDatos.updateMany).toHaveBeenCalledWith({ where: { id: "r1" }, data: { estado: "error", detalle: "falló" } });
    expect(doble.recursoDatos.updateMany).toHaveBeenCalledWith({ where: { id: "r1" }, data: { usoDiscoMb: 40, medidoEn: medido } });
    expect(doble.recursoDatos.deleteMany).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
