import type { PrismaService } from "../../../../compartido/prisma/prisma.service";
import { PurgaDatosVencidosPrisma } from "../../../../adapters/prisma/purga-datos-vencidos.prisma";
import { RegistroLimpiezaPrisma } from "./registro-limpieza.prisma";

const prismaDoble = (delegados: Record<string, unknown>) => delegados as unknown as PrismaService;
const CORTE = new Date("2026-10-31T00:35:00.000Z");
const CORTE_INACTIVAS = new Date("2026-10-24T00:35:00.000Z");

describe("EST-01b · Persistencia de la limpieza", () => {
  it("borra tokens de cuenta usados o vencidos antes del corte", async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 2 });

    await expect(new PurgaDatosVencidosPrisma(prismaDoble({ tokenCuenta: { deleteMany } })).purgarTokensCuenta(CORTE)).resolves.toBe(2);
    expect(deleteMany).toHaveBeenCalledWith({ where: { OR: [{ usadoEn: { lt: CORTE } }, { expira: { lt: CORTE } }] } });
  });

  it("borra sesiones revocadas o inactivas antes de sus cortes", async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });

    await expect(new PurgaDatosVencidosPrisma(prismaDoble({ sesion: { deleteMany } })).purgarSesiones(CORTE, CORTE_INACTIVAS)).resolves.toBe(1);
    expect(deleteMany).toHaveBeenCalledWith({ where: { OR: [{ revocadaEn: { lt: CORTE } }, { ultimaActividad: { lt: CORTE_INACTIVAS } }] } });
  });

  it("borra invitaciones usadas, revocadas o vencidas antes del corte", async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 0 });

    await expect(new PurgaDatosVencidosPrisma(prismaDoble({ invitacion: { deleteMany } })).purgarInvitaciones(CORTE)).resolves.toBe(0);
    expect(deleteMany).toHaveBeenCalledWith({ where: { OR: [{ usada: { lt: CORTE } }, { revocada: { lt: CORTE } }, { vence: { lt: CORTE } }] } });
  });

  it("guarda la última limpieza en la fila única, creándola si no existe", async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const limpieza = { ultimaLimpieza: CORTE, filasLimpiadas: 3 };

    await new RegistroLimpiezaPrisma(prismaDoble({ configuracionInstalacion: { upsert } })).guardar(limpieza);

    expect(upsert).toHaveBeenCalledWith({ where: { id: "instalacion" }, create: { ...limpieza, id: "instalacion" }, update: limpieza });
  });

  it("lee la última limpieza; null sin fila o sin corrida", async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({ ultimaLimpieza: CORTE, filasLimpiadas: 3 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ultimaLimpieza: null, filasLimpiadas: null });
    const registro = new RegistroLimpiezaPrisma(prismaDoble({ configuracionInstalacion: { findUnique } }));

    await expect(registro.ultima()).resolves.toEqual({ ultimaLimpieza: CORTE, filasLimpiadas: 3 });
    await expect(registro.ultima()).resolves.toBeNull();
    await expect(registro.ultima()).resolves.toBeNull();
    expect(findUnique).toHaveBeenCalledWith({ where: { id: "instalacion" }, select: { ultimaLimpieza: true, filasLimpiadas: true } });
  });
});
