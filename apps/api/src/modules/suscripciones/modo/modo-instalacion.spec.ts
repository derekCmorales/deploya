import { Injectable } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { configuracionDesde } from "../../../adapters/configuracion-motor";
import { ColaCicloApagada } from "../ciclo/cola-ciclo.apagada";
import { ColaCicloMemoria } from "../ciclo/cola-ciclo.memoria";
import { COLA_POR_MODO } from "../ciclo/ciclo-trabajador.module";
import { TareaCicloDiaria } from "../ciclo/tarea-ciclo-diaria";
import type { CicloSuscripcionService } from "../ciclo/ciclo-suscripcion.service";
import { MODO_INSTALACION, modoInstalacionDesde, ModoInstalacionInvalido, porModo, type ModoInstalacion } from "./modo-instalacion";

abstract class Saludo {
  abstract decir(): string;
}

@Injectable()
class SaludoNube extends Saludo {
  decir(): string {
    return "nube";
  }
}

@Injectable()
class SaludoAutoalojado extends Saludo {
  decir(): string {
    return "autoalojado";
  }
}

async function saludoEn(modo: ModoInstalacion): Promise<string> {
  const modulo = await Test.createTestingModule({
    providers: [{ provide: MODO_INSTALACION, useValue: modo }, ...porModo(Saludo, { nube: SaludoNube, autoalojado: SaludoAutoalojado })],
  }).compile();
  return modulo.get(Saludo).decir();
}

describe("SP-06 · Modo de instalación", () => {
  it("Nube por defecto", () => {
    expect(modoInstalacionDesde({})).toBe("nube");
    expect(modoInstalacionDesde({ MODO_INSTALACION: " autoalojado " })).toBe("autoalojado");
  });

  it("un modo desconocido no arranca como nube en silencio", () => {
    expect(() => modoInstalacionDesde({ MODO_INSTALACION: "local" })).toThrow(ModoInstalacionInvalido);
  });

  it("porModo entrega la implementación del modo bajo el token del puerto", async () => {
    await expect(saludoEn("nube")).resolves.toBe("nube");
    await expect(saludoEn("autoalojado")).resolves.toBe("autoalojado");
  });

  it("El ciclo no corre", async () => {
    const cola = COLA_POR_MODO.autoalojado(configuracionDesde({}));
    const ejecutar = jest.fn();
    const tarea = new TareaCicloDiaria(cola, { ejecutar } as unknown as CicloSuscripcionService);

    await tarea.onApplicationBootstrap();

    expect(cola).toBeInstanceOf(ColaCicloApagada);
    expect(ejecutar).not.toHaveBeenCalled();
  });

  it("en la nube la tarea del ciclo sí se programa", async () => {
    const cola = COLA_POR_MODO.nube(configuracionDesde({}));
    const tarea = new TareaCicloDiaria(cola, { ejecutar: jest.fn() } as unknown as CicloSuscripcionService);

    await tarea.onApplicationBootstrap();

    expect(cola).toBeInstanceOf(ColaCicloMemoria);
    expect((cola as ColaCicloMemoria).programada).toBe(true);
  });
});
