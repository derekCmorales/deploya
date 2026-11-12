import type { SuscripcionesService } from "../../suscripciones/suscripciones.service";
import { CuotaDatosSuscripciones } from "./cuota-datos.suscripciones";
import { GeneradorSecretosCrypto } from "./generador-secretos.crypto";
import { GeneradorSecretosFijo } from "./generador-secretos.fijo";

describe("Adaptadores de recursos de datos", () => {
  it("CuotaDatosSuscripciones toma de cuotaDe el estado y los límites de datos", async () => {
    const suscripciones = { cuotaDe: jest.fn().mockResolvedValue({ estado: "por-vencer", maxRecursosDatos: 10, discoDatosMb: 10240, cpus: 1 }) };

    const cuota = await new CuotaDatosSuscripciones(suscripciones as unknown as SuscripcionesService).deUsuario("u-1");

    expect(cuota).toEqual({ estado: "por-vencer", maxRecursosDatos: 10, discoDatosMb: 10240 });
    expect(suscripciones.cuotaDe).toHaveBeenCalledWith("u-1");
  });

  it("GeneradorSecretosCrypto: 32 caracteres [A-Za-z0-9] y distintos cada vez", () => {
    const generador = new GeneradorSecretosCrypto();

    const [a, b] = [generador.contrasena(32), generador.contrasena(32)];

    expect(a).toMatch(/^[A-Za-z0-9]{32}$/);
    expect(a).not.toBe(b);
  });

  it("GeneradorSecretosFijo cumple el mismo contrato de largo y alfabeto (L)", () => {
    expect(new GeneradorSecretosFijo().contrasena(32)).toMatch(/^[A-Za-z0-9]{32}$/);
  });
});
