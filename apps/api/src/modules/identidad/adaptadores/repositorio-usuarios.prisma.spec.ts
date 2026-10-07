import type { Usuario as UsuarioFila } from "@prisma/client";
import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { ACCION_SUSPENDER_CUENTA, RepositorioUsuariosPrisma } from "./repositorio-usuarios.prisma";

const FILA: UsuarioFila = {
  id: "u-1",
  correo: "derek@tiendademo.com",
  nombre: "Derek",
  hashContrasena: "hash",
  rol: "cliente",
  estadoCuenta: "suspendida",
  motivoSuspension: "Uso que incumple los términos de servicio (§7.2).",
  creado: new Date("2026-09-01T12:00:00.000Z"),
  actualizado: new Date("2026-09-22T15:00:00.000Z"),
};

function repositorioCon(findUnique: jest.Mock): RepositorioUsuariosPrisma {
  return new RepositorioUsuariosPrisma({ usuario: { findUnique } } as unknown as PrismaService);
}

describe("M1-04 · RepositorioUsuariosPrisma: motivo y fecha de la suspensión", () => {
  it("pide solo la acción suspender-cuenta más reciente y la usa como fecha", async () => {
    const desde = new Date("2026-09-22T15:00:00.000Z");
    const findUnique = jest.fn().mockResolvedValue({ ...FILA, accionesRecibidas: [{ creado: desde }] });

    const usuario = await repositorioCon(findUnique).porCorreo("derek@tiendademo.com");

    expect(usuario).toMatchObject({ motivoSuspension: FILA.motivoSuspension, suspendidaDesde: desde });
    expect(findUnique).toHaveBeenCalledWith({
      where: { correo: "derek@tiendademo.com" },
      include: {
        accionesRecibidas: { where: { accion: ACCION_SUSPENDER_CUENTA }, orderBy: { creado: "desc" }, take: 1, select: { creado: true } },
      },
    });
  });

  it("sin ninguna acción registrada la fecha es null (por ejemplo, suspendida a mano en el seed)", async () => {
    const findUnique = jest.fn().mockResolvedValue({ ...FILA, motivoSuspension: null, accionesRecibidas: [] });

    await expect(repositorioCon(findUnique).porId("u-1")).resolves.toMatchObject({ motivoSuspension: null, suspendidaDesde: null });
  });

  it("un usuario inexistente sigue siendo null", async () => {
    await expect(repositorioCon(jest.fn().mockResolvedValue(null)).porId("nadie")).resolves.toBeNull();
  });
});
