import { Prisma, type Plan as PlanFila } from "@prisma/client";
import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { RepositorioPagosPrisma } from "./repositorio-pagos.prisma";
import { RepositorioPlanesPrisma } from "./repositorio-planes.prisma";
import { RepositorioSuscripcionesPrisma } from "./repositorio-suscripciones.prisma";
import { estadoAPrisma, estadoDesdePrisma } from "./traduccion-prisma";

const STARTER: PlanFila = {
  id: "plan-starter",
  codigo: "starter",
  nombre: "Starter",
  descripcion: "Para un servicio pequeño en producción.",
  precio30: new Prisma.Decimal("5.00"),
  precio365: new Prisma.Decimal("50.00"),
  maxProyectos: 3,
  cpus: new Prisma.Decimal("0.50"),
  memoriaMb: 512,
  construccionesMes: 150,
  orden: 2,
  activo: true,
};

function prismaDoble(delegados: Record<string, Record<string, jest.Mock>>): PrismaService {
  return delegados as unknown as PrismaService;
}

describe("traducción en el borde de Prisma", () => {
  it("por_vencer ↔ por-vencer", () => {
    expect(estadoDesdePrisma("por_vencer")).toBe("por-vencer");
    expect(estadoAPrisma("por-vencer")).toBe("por_vencer");
    expect(estadoDesdePrisma("activa")).toBe("activa");
  });
});

describe("RepositorioPlanesPrisma", () => {
  it("convierte Decimal a number y null se conserva", async () => {
    const findMany = jest.fn().mockResolvedValue([STARTER, { ...STARTER, codigo: "sandbox", precio365: null }]);
    const [starter, sandbox] = await new RepositorioPlanesPrisma(prismaDoble({ plan: { findMany } })).todos();
    expect(starter).toMatchObject({ precio30: 5, precio365: 50, cpus: 0.5 });
    expect(sandbox.precio365).toBeNull();
  });

  it("porCodigo devuelve null si no existe", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    await expect(new RepositorioPlanesPrisma(prismaDoble({ plan: { findUnique } })).porCodigo("oro")).resolves.toBeNull();
    expect(findUnique).toHaveBeenCalledWith({ where: { codigo: "oro" } });
  });

  it("porCodigo traduce la fila encontrada", async () => {
    const findUnique = jest.fn().mockResolvedValue(STARTER);
    await expect(new RepositorioPlanesPrisma(prismaDoble({ plan: { findUnique } })).porCodigo("starter")).resolves.toMatchObject({
      codigo: "starter",
      precio30: 5,
    });
  });
});

describe("RepositorioSuscripcionesPrisma", () => {
  const inicio = new Date("2026-09-30T12:00:00.000Z");

  it("crearSiNoExiste hace upsert por usuarioId sin tocar la existente", async () => {
    const upsert = jest.fn().mockResolvedValue({});
    await new RepositorioSuscripcionesPrisma(prismaDoble({ suscripcion: { upsert } })).crearSiNoExiste({
      usuarioId: "u1",
      planId: "plan-sandbox",
      estado: "activa",
      vigenciaDias: null,
      inicio,
      vence: null,
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { usuarioId: "u1" },
      update: {},
      create: { usuarioId: "u1", planId: "plan-sandbox", estado: "activa", estadoDesde: inicio, vigenciaDias: null, inicio, vence: null },
    });
  });

  it("deUsuario traduce estado y plan; null si no hay", async () => {
    const fila = {
      id: "s1",
      usuarioId: "u1",
      planId: STARTER.id,
      plan: STARTER,
      estado: "por_vencer",
      estadoDesde: inicio,
      vigenciaDias: 30,
      inicio,
      vence: inicio,
      planSiguienteId: null,
      creado: inicio,
      actualizado: inicio,
    };
    const findUnique = jest.fn().mockResolvedValueOnce(fila).mockResolvedValueOnce(null);
    const repositorio = new RepositorioSuscripcionesPrisma(prismaDoble({ suscripcion: { findUnique } }));
    await expect(repositorio.deUsuario("u1")).resolves.toMatchObject({ estado: "por-vencer", plan: { codigo: "starter", cpus: 0.5 } });
    await expect(repositorio.deUsuario("u2")).resolves.toBeNull();
  });
});

describe("RepositorioSuscripcionesPrisma · cambios", () => {
  const ahora = new Date("2026-09-24T12:00:00.000Z");
  const fila = {
    id: "s1",
    usuarioId: "u1",
    planId: STARTER.id,
    plan: STARTER,
    planSiguiente: { ...STARTER, id: "plan-sandbox", codigo: "sandbox", nombre: "Sandbox" },
    estado: "activa",
    estadoDesde: ahora,
    vigenciaDias: 30,
    inicio: ahora,
    vence: ahora,
    planSiguienteId: "plan-sandbox",
    creado: ahora,
    actualizado: ahora,
  };

  it("actualizar traduce el estado y devuelve la suscripción con sus planes", async () => {
    const update = jest.fn().mockResolvedValue(fila);
    const cambio = { planId: "plan-starter", estado: "por-vencer" as const, estadoDesde: ahora, vigenciaDias: 30, inicio: ahora, vence: ahora, planSiguienteId: null };
    const suscripcion = await new RepositorioSuscripcionesPrisma(prismaDoble({ suscripcion: { update } })).actualizar("s1", cambio);
    expect(update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { ...cambio, estado: "por_vencer" },
      include: { plan: true, planSiguiente: true },
    });
    expect(suscripcion.planSiguiente).toMatchObject({ codigo: "sandbox" });
  });

  it("programarDescenso solo toca planSiguienteId", async () => {
    const update = jest.fn().mockResolvedValue(fila);
    await new RepositorioSuscripcionesPrisma(prismaDoble({ suscripcion: { update } })).programarDescenso("s1", "plan-sandbox");
    expect(update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { planSiguienteId: "plan-sandbox" }, include: { plan: true, planSiguiente: true } });
  });
});

describe("RepositorioPagosPrisma", () => {
  const creado = new Date("2026-09-24T12:00:00.000Z");
  const nuevo = {
    usuarioId: "u1",
    suscripcionId: "s1",
    planId: "plan-pro",
    concepto: "cambio-plan" as const,
    vigenciaDias: 30,
    monto: 15,
    estado: "aprobado" as const,
    motivoRechazo: null,
    tarjetaUltimos4: "4242",
    creado,
  };

  function transaccional(count: jest.Mock, create: jest.Mock): PrismaService {
    const tx = { pago: { count, create } };
    return { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  }

  it("un aprobado lleva el siguiente comprobante del año y el concepto en formato Prisma", async () => {
    const count = jest.fn().mockResolvedValue(183);
    const create = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({ ...data, id: "p1", monto: new Prisma.Decimal("15.00") }),
    );
    const pago = await new RepositorioPagosPrisma(transaccional(count, create)).registrar(nuevo);
    expect(count).toHaveBeenCalledWith({ where: { numeroComprobante: { startsWith: "DPY-2026-" } } });
    expect(create.mock.calls[0][0].data).toMatchObject({ concepto: "cambio_plan", moneda: "USD", numeroComprobante: "DPY-2026-000184" });
    expect(pago).toMatchObject({ id: "p1", concepto: "cambio-plan", monto: 15, numeroComprobante: "DPY-2026-000184" });
  });

  it("un rechazado no lleva comprobante (I2)", async () => {
    const count = jest.fn();
    const create = jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: "p2", monto: new Prisma.Decimal("15.00") }));
    const pago = await new RepositorioPagosPrisma(transaccional(count, create)).registrar({ ...nuevo, estado: "rechazado", motivoRechazo: "x" });
    expect(count).not.toHaveBeenCalled();
    expect(pago.numeroComprobante).toBeNull();
  });
});
