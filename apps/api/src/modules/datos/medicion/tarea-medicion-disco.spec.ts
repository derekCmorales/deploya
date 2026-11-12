import type { MotorDatosService } from "../motor-datos.service";
import { ColaMedicionDiscoMemoria } from "./cola-medicion.memoria";
import { TareaMedicionDisco } from "./tarea-medicion-disco";

describe("TareaMedicionDisco", () => {
  it("Medición periódica: al arrancar el trabajador programa el tick y cada tick mide los discos", async () => {
    const cola = new ColaMedicionDiscoMemoria();
    const motor = { medirDiscos: jest.fn().mockResolvedValue(2) };
    const tarea = new TareaMedicionDisco(cola, motor as unknown as MotorDatosService);

    await tarea.onApplicationBootstrap();
    await cola.correr();
    await tarea.onModuleDestroy();

    expect(motor.medirDiscos).toHaveBeenCalledTimes(1);
    expect(await cola.correr()).toBeUndefined();
  });
});
