import { Worker } from "bullmq";
import { ColaMuestreoBullMq } from "./cola-muestreo.bullmq";
import { COLA_MUESTREO, PROGRAMADOR_MUESTREO, programacionMuestreo } from "./metricas.constantes";

const cola = { upsertJobScheduler: jest.fn(), close: jest.fn() };
const consumidor = { close: jest.fn() };

jest.mock("bullmq", () => ({ Queue: jest.fn(() => cola), Worker: jest.fn(() => consumidor) }));

describe("ColaMuestreoBullMq", () => {
  beforeEach(() => jest.clearAllMocks());

  it("programa un tick cada 60 s y consume con concurrencia 1", async () => {
    const manejador = jest.fn().mockResolvedValue(undefined);

    await new ColaMuestreoBullMq("redis://redis:6379").iniciar(manejador);
    const procesar = (Worker as unknown as jest.Mock).mock.calls[0][1] as () => Promise<unknown>;
    await procesar();

    expect(cola.upsertJobScheduler).toHaveBeenCalledWith(PROGRAMADOR_MUESTREO, programacionMuestreo(), { name: PROGRAMADOR_MUESTREO });
    expect(Worker).toHaveBeenCalledWith(COLA_MUESTREO, expect.any(Function), expect.objectContaining({ concurrency: 1 }));
    expect(manejador).toHaveBeenCalledTimes(1);
  });

  it("cerrar cierra la cola y el consumidor", async () => {
    const adaptador = new ColaMuestreoBullMq("redis://redis:6379");
    await adaptador.iniciar(jest.fn());

    await adaptador.cerrar();

    expect(cola.close).toHaveBeenCalled();
    expect(consumidor.close).toHaveBeenCalled();
  });
});
