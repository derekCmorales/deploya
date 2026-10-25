import { Prisma } from "@prisma/client";
import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { condicionDe, ConsultaUsuariosPrisma } from "./consulta-usuarios.prisma";
import { CuentasSuspensionPrisma } from "./cuentas-suspension.prisma";

function prismaDoble(delegados: Record<string, unknown>): PrismaService {
  return delegados as unknown as PrismaService;
}

const CREADO = new Date("2026-06-14T15:00:00.000Z");
const fila = {
  id: "u-maria",
  correo: "maria.rios@cafeteriaaurora.com",
  nombre: "María Ríos",
  rol: "cliente",
  estadoCuenta: "suspendida",
  motivoSuspension: "Uso que incumple los términos de servicio.",
  creado: CREADO,
  suscripcion: { estado: "por_vencer", estadoDesde: new Date("2026-10-14T15:00:00.000Z"), vence: new Date("2026-10-21T15:00:00.000Z"), plan: { nombre: "Pro" } },
  proyectos: [
    { id: "p1", nombre: "menu-aurora", subdominio: "menu-aurora", despliegueActivo: { estado: "detenido" } },
    { id: "p2", nombre: "landing", subdominio: "landing", despliegueActivo: null },
  ],
  pagos: [{ id: "pg1", creado: CREADO, plan: { nombre: "Pro" }, vigenciaDias: 30, monto: new Prisma.Decimal("15.00"), moneda: "USD", estado: "aprobado" }],
  sesiones: [{ ultimaActividad: new Date("2026-10-11T09:30:00.000Z") }],
  accionesRecibidas: [{ creado: new Date("2026-09-21T10:00:00.000Z") }],
};

describe("ConsultaUsuariosPrisma", () => {
  it("el filtro arma correo sin mayúsculas y el estado en formato Prisma", () => {
    expect(condicionDe({ correo: "tiendademo", suscripcion: "por-vencer", pagina: 1 })).toEqual({
      correo: { contains: "tiendademo", mode: "insensitive" },
      suscripcion: { is: { estado: "por_vencer" } },
    });
    expect(condicionDe({ correo: null, suscripcion: null, pagina: 1 })).toEqual({});
  });

  it("buscar cuenta el total aparte y salta las páginas anteriores", async () => {
    const count = jest.fn().mockReturnValue("contar");
    const findMany = jest.fn().mockReturnValue("leer");
    const $transaction = jest.fn().mockResolvedValue([42, [fila]]);
    const consulta = new ConsultaUsuariosPrisma(prismaDoble({ usuario: { count, findMany }, $transaction }));

    const pagina = await consulta.buscar({ correo: null, suscripcion: "vencida", pagina: 3 });

    expect($transaction).toHaveBeenCalledWith(["contar", "leer"]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 40, take: 20, orderBy: [{ creado: "desc" }, { id: "asc" }] }));
    expect(pagina).toEqual({
      total: 42,
      pagina: 3,
      porPagina: 20,
      usuarios: [
        {
          id: "u-maria",
          correo: "maria.rios@cafeteriaaurora.com",
          nombre: "María Ríos",
          rol: "cliente",
          estadoCuenta: "suspendida",
          plan: "Pro",
          suscripcion: "por-vencer",
          creado: CREADO,
        },
      ],
    });
  });

  it("detalle trae proyectos, pagos, último acceso y la suspensión en una sola consulta", async () => {
    const findUnique = jest.fn().mockResolvedValueOnce(fila).mockResolvedValueOnce(null);
    const consulta = new ConsultaUsuariosPrisma(prismaDoble({ usuario: { findUnique } }));

    const detalle = await consulta.detalle("u-maria");

    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(detalle).toMatchObject({
      ultimoAcceso: new Date("2026-10-11T09:30:00.000Z"),
      suscripcionDesde: new Date("2026-10-14T15:00:00.000Z"),
      suspension: { desde: new Date("2026-09-21T10:00:00.000Z"), motivo: fila.motivoSuspension, contenedoresDetenidos: 1 },
      proyectos: [{ nombre: "menu-aurora", despliegue: "detenido" }, { nombre: "landing", despliegue: null }],
      pagos: [{ plan: "Pro", monto: 15, estado: "aprobado" }],
    });
    await expect(consulta.detalle("u-nadie")).resolves.toBeNull();
  });

  it("una cuenta activa sin suscripción ni sesiones", async () => {
    const findUnique = jest.fn().mockResolvedValue({ ...fila, estadoCuenta: "activa", suscripcion: null, sesiones: [], accionesRecibidas: [] });

    const detalle = await new ConsultaUsuariosPrisma(prismaDoble({ usuario: { findUnique } })).detalle("u-maria");

    expect(detalle).toMatchObject({ plan: null, suscripcion: null, vence: null, suscripcionDesde: null, ultimoAcceso: null, suspension: null });
  });
});

describe("CuentasSuspensionPrisma", () => {
  it("cuenta lee rol, estado y el estado de la suscripción", async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: "u1", rol: "cliente", estadoCuenta: "suspendida", suscripcion: { estado: "por_vencer" } });

    const cuenta = await new CuentasSuspensionPrisma(prismaDoble({ usuario: { findUnique } })).cuenta("u1");

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { id: true, rol: true, estadoCuenta: true, suscripcion: { select: { estado: true } } },
    });
    expect(cuenta).toEqual({ id: "u1", rol: "cliente", estadoCuenta: "suspendida", suscripcion: "por-vencer" });
  });

  it("cuenta sin fila ni suscripción", async () => {
    const sinFila = jest.fn().mockResolvedValue(null);
    const sinSuscripcion = jest.fn().mockResolvedValue({ id: "u2", rol: "administrador", estadoCuenta: "activa", suscripcion: null });

    await expect(new CuentasSuspensionPrisma(prismaDoble({ usuario: { findUnique: sinFila } })).cuenta("u1")).resolves.toBeNull();
    await expect(new CuentasSuspensionPrisma(prismaDoble({ usuario: { findUnique: sinSuscripcion } })).cuenta("u2")).resolves.toMatchObject({
      suscripcion: null,
    });
  });

  it("reactivar escribe cuenta y acción en una sola transacción (SP-05)", async () => {
    const marca = new Date("2026-10-24T16:20:00.000Z");
    const update = jest.fn().mockReturnValue("cuenta");
    const create = jest.fn().mockReturnValue("accion");
    const $transaction = jest.fn().mockResolvedValue([]);
    const prisma = prismaDoble({ usuario: { update }, accionAdministrativa: { create }, $transaction });

    await new CuentasSuspensionPrisma(prisma).reactivar({ adminId: "u-admin", usuarioId: "u-maria", detalle: "Eran pruebas de carga.", marca });

    expect($transaction).toHaveBeenCalledWith(["cuenta", "accion"]);
    expect(update).toHaveBeenCalledWith({ where: { id: "u-maria" }, data: { estadoCuenta: "activa", motivoSuspension: null } });
    expect(create).toHaveBeenCalledWith({
      data: {
        adminId: "u-admin",
        usuarioAfectadoId: "u-maria",
        accion: "reactivar-cuenta",
        motivo: "reactivacion",
        detalle: "Eran pruebas de carga.",
        creado: marca,
      },
    });
  });

  it("suspender escribe cuenta, sesiones y acción en una sola transacción", async () => {
    const marca = new Date("2026-10-17T16:20:00.000Z");
    const update = jest.fn().mockReturnValue("cuenta");
    const updateMany = jest.fn().mockReturnValue("sesiones");
    const create = jest.fn().mockReturnValue("accion");
    const $transaction = jest.fn().mockResolvedValue([]);
    const prisma = prismaDoble({ usuario: { update }, sesion: { updateMany }, accionAdministrativa: { create }, $transaction });

    await new CuentasSuspensionPrisma(prisma).suspender({
      adminId: "u-admin",
      usuarioId: "u-maria",
      motivo: "terminos",
      textoMotivo: "Uso que incumple los términos de servicio.",
      detalle: null,
      marca,
    });

    expect($transaction).toHaveBeenCalledWith(["cuenta", "sesiones", "accion"]);
    expect(update).toHaveBeenCalledWith({
      where: { id: "u-maria" },
      data: { estadoCuenta: "suspendida", motivoSuspension: "Uso que incumple los términos de servicio." },
    });
    expect(updateMany).toHaveBeenCalledWith({ where: { usuarioId: "u-maria", revocadaEn: null }, data: { revocadaEn: marca } });
    expect(create).toHaveBeenCalledWith({
      data: { adminId: "u-admin", usuarioAfectadoId: "u-maria", accion: "suspender-cuenta", motivo: "terminos", detalle: null, creado: marca },
    });
  });
});
