import { Worker } from "bullmq";
import { COLA_CICLO, PROGRAMADOR_CICLO } from "./ciclo.constantes";
import { ColaCicloBullMq } from "./cola-ciclo.bullmq";

const cola = { upsertJobScheduler: jest.fn(), close: jest.fn() };
const consumidor = { close: jest.fn() };

jest.mock("bullmq", () => ({ Queue: jest.fn(() => cola), Worker: jest.fn(() => consumidor) }));

describe("M2-05 · ColaCicloBullMq", () => {
  beforeEach(() => jest.clearAllMocks());

  it("programa un solo trabajo repetible a las 00:05 UTC y consume con concurrencia 1", async () => {
    const manejador = jest.fn().mockResolvedValue(undefined);

    await new ColaCicloBullMq("redis://redis:6379").iniciar(manejador);
    const procesar = (Worker as unknown as jest.Mock).mock.calls[0][1] as () => Promise<unknown>;
    await procesar();

    expect(cola.upsertJobScheduler).toHaveBeenCalledWith(PROGRAMADOR_CICLO, { pattern: "5 0 * * *", tz: "UTC" }, { name: PROGRAMADOR_CICLO });
    expect(Worker).toHaveBeenCalledWith(COLA_CICLO, expect.any(Function), expect.objectContaining({ concurrency: 1 }));
    expect(manejador).toHaveBeenCalledTimes(1);
  });

  it("cerrar cierra la cola y el consumidor", async () => {
    const adaptador = new ColaCicloBullMq("redis://redis:6379");
    await adaptador.iniciar(jest.fn());

    await adaptador.cerrar();

    expect(cola.close).toHaveBeenCalled();
    expect(consumidor.close).toHaveBeenCalled();
  });
});
