import { Worker } from "bullmq";
import { configuracionDesde } from "../../../adapters/configuracion-motor";
import { ColaLimpiezaBullMq } from "./cola-limpieza.bullmq";
import { ColaLimpiezaMemoria } from "./cola-limpieza.memoria";
import { COLA_LIMPIEZA, PROGRAMADOR_LIMPIEZA } from "./limpieza.constantes";
import { colaLimpiezaPara } from "./limpieza-trabajador.module";

const cola = { upsertJobScheduler: jest.fn(), close: jest.fn() };
const consumidor = { close: jest.fn() };

jest.mock("bullmq", () => ({ Queue: jest.fn(() => cola), Worker: jest.fn(() => consumidor) }));

describe("EST-01b · ColaLimpiezaBullMq", () => {
  beforeEach(() => jest.clearAllMocks());

  it("programa un solo trabajo repetible a las 00:35 UTC y consume con concurrencia 1", async () => {
    const manejador = jest.fn().mockResolvedValue(undefined);

    await new ColaLimpiezaBullMq("redis://redis:6379").iniciar(manejador);
    const procesar = (Worker as unknown as jest.Mock).mock.calls[0][1] as () => Promise<unknown>;
    await procesar();

    expect(cola.upsertJobScheduler).toHaveBeenCalledWith(PROGRAMADOR_LIMPIEZA, { pattern: "35 0 * * *", tz: "UTC" }, { name: PROGRAMADOR_LIMPIEZA });
    expect(Worker).toHaveBeenCalledWith(COLA_LIMPIEZA, expect.any(Function), expect.objectContaining({ concurrency: 1 }));
    expect(manejador).toHaveBeenCalledTimes(1);
  });

  it("cerrar cierra la cola y el consumidor", async () => {
    const adaptador = new ColaLimpiezaBullMq("redis://redis:6379");
    await adaptador.iniciar(jest.fn());

    await adaptador.cerrar();

    expect(cola.close).toHaveBeenCalled();
    expect(consumidor.close).toHaveBeenCalled();
  });

  it("BullMQ con MOTOR_ADAPTADORES=docker y en memoria si no", () => {
    expect(colaLimpiezaPara(configuracionDesde({ MOTOR_ADAPTADORES: "docker" }))).toBeInstanceOf(ColaLimpiezaBullMq);
    expect(colaLimpiezaPara(configuracionDesde({}))).toBeInstanceOf(ColaLimpiezaMemoria);
  });
});
