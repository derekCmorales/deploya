import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { NombreCuenta } from "../dominio/nombre-cuenta";
import { NombreInvalido } from "../dominio/errores";
import { RepositorioSesionesMemoria } from "./repositorio-sesiones.memoria";
import { RepositorioSesionesPrisma } from "./repositorio-sesiones.prisma";
import { RepositorioUsuariosPrisma } from "./repositorio-usuarios.prisma";

const MARCA = new Date("2026-10-14T12:00:00.000Z");

describe("M1-06 · NombreCuenta", () => {
  it("recorta los espacios y acepta de 1 a 64 caracteres", () => {
    expect(NombreCuenta.de("  Derek Calderón  ").valor).toBe("Derek Calderón");
    expect(NombreCuenta.de("a").valor).toBe("a");
    expect(NombreCuenta.de("a".repeat(64)).valor).toHaveLength(64);
  });

  it("rechaza un nombre vacío o de 65 caracteres con NombreInvalido", () => {
    expect(() => NombreCuenta.de("   ")).toThrow(NombreInvalido);
    expect(() => NombreCuenta.de("a".repeat(65))).toThrow(NombreInvalido);
  });
});

describe("M1-07 · revocarTodasMenos y cambiarNombre", () => {
  it("en memoria cierra las sesiones abiertas de la cuenta salvo la indicada", async () => {
    const repositorio = new RepositorioSesionesMemoria();
    const base = { creada: MARCA, ultimaActividad: MARCA, agenteUsuario: null };
    const actual = await repositorio.crear({ ...base, usuarioId: "u-1", hashToken: "a" });
    const otra = await repositorio.crear({ ...base, usuarioId: "u-1", hashToken: "b" });
    const ajena = await repositorio.crear({ ...base, usuarioId: "u-2", hashToken: "c" });

    await repositorio.revocarTodasMenos("u-1", actual.id, MARCA);

    expect(repositorio.sesiones.get(actual.id)?.revocadaEn).toBeNull();
    expect(repositorio.sesiones.get(otra.id)?.revocadaEn).toEqual(MARCA);
    expect(repositorio.sesiones.get(ajena.id)?.revocadaEn).toBeNull();
  });

  it("en Prisma excluye la sesión actual y no reescribe las ya revocadas", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });

    await new RepositorioSesionesPrisma({ sesion: { updateMany } } as unknown as PrismaService).revocarTodasMenos("u-1", "s-1", MARCA);

    expect(updateMany).toHaveBeenCalledWith({
      where: { usuarioId: "u-1", revocadaEn: null, id: { not: "s-1" } },
      data: { revocadaEn: MARCA },
    });
  });

  it("cambiarNombre en Prisma guarda solo el nombre", async () => {
    const update = jest.fn().mockResolvedValue({});

    await new RepositorioUsuariosPrisma({ usuario: { update } } as unknown as PrismaService).cambiarNombre("u-1", "Derek Calderón");

    expect(update).toHaveBeenCalledWith({ where: { id: "u-1" }, data: { nombre: "Derek Calderón" } });
  });
});
