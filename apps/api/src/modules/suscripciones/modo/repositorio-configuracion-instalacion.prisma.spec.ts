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

  it("borrar el código y contar administradores", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const count = jest.fn().mockResolvedValue(1);
    const repo = repositorio({ configuracionInstalacion: { updateMany }, usuario: { count } });

    await repo.borrarCodigo();

    expect(updateMany).toHaveBeenCalledWith({ where: { id: "instalacion" }, data: { hashCodigo: null, codigoVence: null } });
    await expect(repo.hayAdministrador()).resolves.toBe(true);
    expect(count).toHaveBeenCalledWith({ where: { rol: "administrador" } });
  });
});
