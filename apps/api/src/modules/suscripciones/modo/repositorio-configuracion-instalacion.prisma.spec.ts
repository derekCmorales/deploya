import { Prisma } from "@prisma/client";
import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { LIMITES_POR_DEFECTO } from "./configuracion-instalacion";
import { RepositorioConfiguracionInstalacionPrisma } from "./repositorio-configuracion-instalacion.prisma";

function repositorio(delegados: Record<string, Record<string, jest.Mock>>): RepositorioConfiguracionInstalacionPrisma {
  return new RepositorioConfiguracionInstalacionPrisma(delegados as unknown as PrismaService);
}

describe("RepositorioConfiguracionInstalacionPrisma", () => {
  it("límites con Decimal convertido; sin fila, los de la columna", async () => {
    const conFila = jest.fn().mockResolvedValue({ cpuPorProyecto: new Prisma.Decimal("1.5"), memoriaMbPorProyecto: 2048, proyectosPorUsuario: null });
    const sinFila = jest.fn().mockResolvedValue(null);

    await expect(repositorio({ configuracionInstalacion: { findUnique: conFila } }).limites()).resolves.toEqual({
      cpuPorProyecto: 1.5,
      memoriaMbPorProyecto: 2048,
      proyectosPorUsuario: null,
    });
    await expect(repositorio({ configuracionInstalacion: { findUnique: sinFila } }).limites()).resolves.toEqual(LIMITES_POR_DEFECTO);
  });

  it("código: solo si hay hash y vencimiento", async () => {
    const vence = new Date("2026-10-24T03:30:00.000Z");
    const conHash = jest.fn().mockResolvedValue({ hashCodigo: "h", codigoVence: vence });
    const sinHash = jest.fn().mockResolvedValue({ hashCodigo: null, codigoVence: null });

    await expect(repositorio({ configuracionInstalacion: { findUnique: conHash } }).codigo()).resolves.toEqual({ hashCodigo: "h", codigoVence: vence });
    await expect(repositorio({ configuracionInstalacion: { findUnique: sinHash } }).codigo()).resolves.toBeNull();
  });

  it("borrar el código solo si sigue siendo el mismo, y contar administradores", async () => {
    const updateMany = jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const count = jest.fn().mockResolvedValue(1);
    const repo = repositorio({ configuracionInstalacion: { updateMany }, usuario: { count } });

    await expect(repo.borrarCodigoSiEs("h")).resolves.toBe(true);
    await expect(repo.borrarCodigoSiEs("h")).resolves.toBe(false);

    expect(updateMany).toHaveBeenCalledWith({ where: { id: "instalacion", hashCodigo: "h" }, data: { hashCodigo: null, codigoVence: null } });
    await expect(repo.hayAdministrador()).resolves.toBe(true);
    expect(count).toHaveBeenCalledWith({ where: { rol: "administrador" } });
  });
});

describe("RepositorioConfiguracionInstalacionPrisma · SP-17", () => {
  it("restaurar el código solo si no hay otro", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const codigo = { hashCodigo: "h", codigoVence: new Date("2026-10-24T03:30:00.000Z") };

    await repositorio({ configuracionInstalacion: { updateMany } }).restaurarCodigo(codigo);

    expect(updateMany).toHaveBeenCalledWith({ where: { id: "instalacion", hashCodigo: null }, data: codigo });
  });
});

describe("RepositorioConfiguracionInstalacionPrisma · SP-18", () => {
  it("política de registro: la de la fila o «invitacion» sin fila", async () => {
    const conFila = jest.fn().mockResolvedValue({ politicaRegistro: "cerrado" });
    const sinFila = jest.fn().mockResolvedValue(null);

    await expect(repositorio({ configuracionInstalacion: { findUnique: conFila } }).politicaRegistro()).resolves.toBe("cerrado");
    await expect(repositorio({ configuracionInstalacion: { findUnique: sinFila } }).politicaRegistro()).resolves.toBe("invitacion");
  });

  it("guardar política y límites crea la fila si no existe", async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const repo = repositorio({ configuracionInstalacion: { upsert } });

    await repo.guardarPoliticaRegistro("abierto");
    await repo.guardarLimites({ cpuPorProyecto: 0.5, memoriaMbPorProyecto: 512, proyectosPorUsuario: 3 });

    expect(upsert.mock.calls).toEqual([
      [{ where: { id: "instalacion" }, create: { politicaRegistro: "abierto", id: "instalacion" }, update: { politicaRegistro: "abierto" } }],
      [
        {
          where: { id: "instalacion" },
          create: { cpuPorProyecto: 0.5, memoriaMbPorProyecto: 512, proyectosPorUsuario: 3, id: "instalacion" },
          update: { cpuPorProyecto: 0.5, memoriaMbPorProyecto: 512, proyectosPorUsuario: 3 },
        },
      ],
    ]);
  });

  describe("correo de la instalación (SP-17)", () => {
    const SMTP = { host: "smtp.miempresa.com", puerto: 587, usuario: "deploya@miempresa.com", claveCifrada: "v1:iv:dato:tag", remitente: "deploya <no-responder@miempresa.com>" };
    const FILA_SMTP = { smtpHost: SMTP.host, smtpPuerto: 587, smtpUsuario: SMTP.usuario, smtpClaveCifrada: SMTP.claveCifrada, smtpRemitente: SMTP.remitente, sinCorreo: false };
    const leer = (fila: unknown) => repositorio({ configuracionInstalacion: { findUnique: jest.fn().mockResolvedValue(fila) } }).correo();

    it("sin fila o sin SMTP completo valen las SMTP_* del .env", async () => {
      await expect(leer(null)).resolves.toEqual({ tipo: "entorno" });
      await expect(leer({ ...FILA_SMTP, smtpClaveCifrada: null })).resolves.toEqual({ tipo: "entorno" });
    });

    it("lee el SMTP guardado (la clave sigue cifrada) y «sin correo» manda sobre lo demás", async () => {
      await expect(leer(FILA_SMTP)).resolves.toEqual({ tipo: "smtp", smtp: SMTP });
      await expect(leer({ ...FILA_SMTP, sinCorreo: true })).resolves.toEqual({ tipo: "sin-correo" });
    });

    it("guardar un SMTP apaga «sin correo» y «sin correo» borra el SMTP, creando la fila si no existe", async () => {
      const upsert = jest.fn().mockResolvedValue({});
      const repo = repositorio({ configuracionInstalacion: { upsert } });

      await repo.guardarCorreo({ tipo: "smtp", smtp: SMTP });
      await repo.guardarCorreo({ tipo: "sin-correo" });

      expect(upsert.mock.calls[0][0]).toEqual({ where: { id: "instalacion" }, create: { ...FILA_SMTP, id: "instalacion" }, update: FILA_SMTP });
      const sinCorreo = { smtpHost: null, smtpPuerto: null, smtpUsuario: null, smtpClaveCifrada: null, smtpRemitente: null, sinCorreo: true };
      expect(upsert.mock.calls[1][0]).toEqual({ where: { id: "instalacion" }, create: { ...sinCorreo, id: "instalacion" }, update: sinCorreo });
    });
  });
});
