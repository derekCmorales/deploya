import { Worker } from "bullmq";
import { ColaMedicionDiscoBullMq } from "./cola-medicion.bullmq";
import { CADA_MS_MEDICION_DISCO, COLA_MEDICION_DISCO, PROGRAMADOR_MEDICION_DISCO } from "./cola-medicion.puerto";

const cola = { upsertJobScheduler: jest.fn(), close: jest.fn() };
const consumidor = { close: jest.fn() };

jest.mock("bullmq", () => ({ Queue: jest.fn(() => cola), Worker: jest.fn(() => consumidor) }));

describe("ColaMedicionDiscoBullMq", () => {
  beforeEach(() => jest.clearAllMocks());

  it("programa un tick cada 5 min y consume con concurrencia 1", async () => {
    const manejador = jest.fn().mockResolvedValue(undefined);

    await new ColaMedicionDiscoBullMq("redis://redis:6379").iniciar(manejador);
    const procesar = (Worker as unknown as jest.Mock).mock.calls[0][1] as () => Promise<unknown>;
    await procesar();

    expect(cola.upsertJobScheduler).toHaveBeenCalledWith(PROGRAMADOR_MEDICION_DISCO, { every: CADA_MS_MEDICION_DISCO }, { name: PROGRAMADOR_MEDICION_DISCO });
    expect(Worker).toHaveBeenCalledWith(COLA_MEDICION_DISCO, expect.any(Function), expect.objectContaining({ concurrency: 1 }));
    expect(manejador).toHaveBeenCalledTimes(1);
  });

  it("cerrar cierra la cola y el consumidor", async () => {
    const adaptador = new ColaMedicionDiscoBullMq("redis://redis:6379");
    await adaptador.iniciar(jest.fn());

    await adaptador.cerrar();

    expect(cola.close).toHaveBeenCalled();
    expect(consumidor.close).toHaveBeenCalled();
  });
});
