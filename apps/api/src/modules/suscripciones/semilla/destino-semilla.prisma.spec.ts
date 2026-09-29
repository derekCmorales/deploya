import type { PrismaClient } from "@prisma/client";
import { DestinoSemillaPrisma } from "./destino-semilla.prisma";
import { planesSemilla } from "./semilla";

describe("DestinoSemillaPrisma", () => {
  it("guardarPlan hace upsert por codigo", async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const [sandbox] = planesSemilla();
    await new DestinoSemillaPrisma({ plan: { upsert } } as unknown as PrismaClient).guardarPlan(sandbox);
    expect(upsert).toHaveBeenCalledWith({ where: { codigo: "sandbox" }, update: sandbox, create: sandbox });
  });

  it("guardarUsuario hace upsert por correo, crea activa y no reescribe la contraseña", async () => {
    const upsert = jest.fn().mockResolvedValue({ id: "u-admin" });
    const usuario = { correo: "admin@deploya.app", nombre: "Administrador", rol: "administrador" as const, hashContrasena: "scrypt:ab:cd" };
    const id = await new DestinoSemillaPrisma({ usuario: { upsert } } as unknown as PrismaClient).guardarUsuario(usuario);
    expect(id).toBe("u-admin");
    const [{ where, update, create }] = upsert.mock.calls[0];
    expect(where).toEqual({ correo: "admin@deploya.app" });
    expect(update).not.toHaveProperty("hashContrasena");
    expect(update).toMatchObject({ rol: "administrador", estadoCuenta: "activa" });
    expect(create).toEqual({ ...usuario, estadoCuenta: "activa" });
  });
});
