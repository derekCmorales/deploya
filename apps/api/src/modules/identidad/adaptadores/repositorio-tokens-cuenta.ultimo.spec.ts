import type { PrismaService } from "../../../compartido/prisma/prisma.service";
import { RepositorioTokensCuentaMemoria } from "./repositorio-tokens-cuenta.memoria";
import { RepositorioTokensCuentaPrisma } from "./repositorio-tokens-cuenta.prisma";

const T0 = new Date("2026-10-07T12:00:00.000Z");
const mas = (ms: number) => new Date(T0.getTime() + ms);

describe("M1-04 · RepositorioTokensCuenta.ultimoDe", () => {
  it("en memoria devuelve el más reciente de ese usuario y tipo, usado o no", async () => {
    const repositorio = new RepositorioTokensCuentaMemoria();
    const base = { usuarioId: "u-1", expira: mas(86_400_000) };
    await repositorio.crear({ ...base, tipo: "verificacion", hashToken: "a", creado: T0 });
    const segundo = await repositorio.crear({ ...base, tipo: "verificacion", hashToken: "b", creado: mas(1000) });
    await repositorio.crear({ ...base, tipo: "recuperacion", hashToken: "c", creado: mas(2000) });
    await repositorio.crear({ ...base, usuarioId: "u-2", tipo: "verificacion", hashToken: "d", creado: mas(3000) });
    await repositorio.marcarUsado(segundo.id, mas(1500));

    await expect(repositorio.ultimoDe("u-1", "verificacion")).resolves.toMatchObject({ hashToken: "b" });
    await expect(repositorio.ultimoDe("u-3", "verificacion")).resolves.toBeNull();
  });

  it("en Prisma pide el primero ordenado por creado descendente", async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const repositorio = new RepositorioTokensCuentaPrisma({ tokenCuenta: { findFirst } } as unknown as PrismaService);

    await expect(repositorio.ultimoDe("u-1", "verificacion")).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith({ where: { usuarioId: "u-1", tipo: "verificacion" }, orderBy: { creado: "desc" } });
  });
});
