import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { RepositorioSesionesMemoria } from "./repositorio-sesiones.memoria";
import { RepositorioSesionesPrisma } from "./repositorio-sesiones.prisma";
import { RepositorioTokensCuentaMemoria } from "./repositorio-tokens-cuenta.memoria";
import { RepositorioTokensCuentaPrisma } from "./repositorio-tokens-cuenta.prisma";
import { RepositorioUsuariosMemoria } from "./repositorio-usuarios.memoria";
import { RepositorioUsuariosPrisma } from "./repositorio-usuarios.prisma";

const AHORA = new Date("2026-10-07T12:00:00.000Z");
const LUEGO = new Date("2026-10-07T12:30:00.000Z");

function prismaDoble(delegados: Record<string, Record<string, jest.Mock>>): PrismaService {
  return delegados as unknown as PrismaService;
}

describe("M1-05 · repositorios en memoria", () => {
  it("invalidarVigentes marca solo los tokens sin usar de ese usuario y tipo", async () => {
    const tokens = new RepositorioTokensCuentaMemoria();
    const nuevo = (usuarioId: string, tipo: "verificacion" | "recuperacion", hashToken: string) =>
      tokens.crear({ usuarioId, tipo, hashToken, expira: LUEGO, creado: AHORA });
    await nuevo("u-1", "recuperacion", "a");
    const yaUsado = await nuevo("u-1", "recuperacion", "b");
    await tokens.marcarUsado(yaUsado.id, AHORA);
    await nuevo("u-1", "verificacion", "c");
    await nuevo("u-2", "recuperacion", "d");

    await tokens.invalidarVigentes("u-1", "recuperacion", LUEGO);

    expect((await tokens.porHuella("a"))?.usadoEn).toEqual(LUEGO);
    expect((await tokens.porHuella("b"))?.usadoEn).toEqual(AHORA);
    expect((await tokens.porHuella("c"))?.usadoEn).toBeNull();
    expect((await tokens.porHuella("d"))?.usadoEn).toBeNull();
  });

  it("cambiarHash reemplaza solo el hash de esa cuenta", async () => {
    const usuarios = new RepositorioUsuariosMemoria();
    const usuario = await usuarios.crear({
      correo: "a@b.co",
      nombre: "A",
      hashContrasena: "viejo",
      rol: "cliente",
      estadoCuenta: "activa",
      creado: AHORA,
    });

    await usuarios.cambiarHash(usuario.id, "nuevo");
    await usuarios.cambiarHash("inexistente", "x");

    expect(await usuarios.porId(usuario.id)).toEqual({ ...usuario, hashContrasena: "nuevo" });
  });

  it("revocarTodasDe cierra las sesiones abiertas de la cuenta y respeta las ya cerradas y las ajenas", async () => {
    const sesiones = new RepositorioSesionesMemoria();
    const abrir = (usuarioId: string, hashToken: string) =>
      sesiones.crear({ usuarioId, hashToken, creada: AHORA, ultimaActividad: AHORA, agenteUsuario: null });
    const abierta = await abrir("u-1", "a");
    const cerrada = await abrir("u-1", "b");
    await sesiones.revocar(cerrada.id, AHORA);
    const ajena = await abrir("u-2", "c");

    await sesiones.revocarTodasDe("u-1", LUEGO);

    expect(sesiones.sesiones.get(abierta.id)?.revocadaEn).toEqual(LUEGO);
    expect(sesiones.sesiones.get(cerrada.id)?.revocadaEn).toEqual(AHORA);
    expect(sesiones.sesiones.get(ajena.id)?.revocadaEn).toBeNull();
  });
});

describe("M1-05 · repositorios Prisma", () => {
  it("invalidarVigentes actualiza en bloque los tokens sin usar del usuario y tipo", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 2 });

    await new RepositorioTokensCuentaPrisma(prismaDoble({ tokenCuenta: { updateMany } })).invalidarVigentes("u-1", "recuperacion", LUEGO);

    expect(updateMany).toHaveBeenCalledWith({ where: { usuarioId: "u-1", tipo: "recuperacion", usadoEn: null }, data: { usadoEn: LUEGO } });
  });

  it("cambiarHash escribe solo el hash", async () => {
    const update = jest.fn().mockResolvedValue({});

    await new RepositorioUsuariosPrisma(prismaDoble({ usuario: { update } })).cambiarHash("u-1", "nuevo");

    expect(update).toHaveBeenCalledWith({ where: { id: "u-1" }, data: { hashContrasena: "nuevo" } });
  });

  it("revocarTodasDe marca las sesiones abiertas de la cuenta", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 3 });

    await new RepositorioSesionesPrisma(prismaDoble({ sesion: { updateMany } })).revocarTodasDe("u-1", LUEGO);

    expect(updateMany).toHaveBeenCalledWith({ where: { usuarioId: "u-1", revocadaEn: null }, data: { revocadaEn: LUEGO } });
  });
});
