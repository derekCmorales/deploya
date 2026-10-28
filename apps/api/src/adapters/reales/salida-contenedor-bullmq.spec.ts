import { aPeticion, consumirBitacoras, desdePeticion, deserializar, ESPERA_MAXIMA_BITACORA_MS, SalidaContenedorBullMq, serializar } from "./salida-contenedor-bullmq";

const trabajo = { waitUntilFinished: jest.fn(), remove: jest.fn(async () => undefined) };
const cola = { add: jest.fn(async () => trabajo), close: jest.fn() };
const eventos = { close: jest.fn() };
let procesador: ((t: { data: unknown }) => Promise<unknown>) | null = null;

jest.mock("bullmq", () => ({
  Queue: jest.fn(() => cola),
  QueueEvents: jest.fn(() => eventos),
  Worker: jest.fn((_nombre: string, fn: (t: { data: unknown }) => Promise<unknown>) => {
    procesador = fn;
    return { close: jest.fn() };
  }),
}));

const MARCA = new Date("2026-10-20T10:41:52.118Z");

describe("SalidaContenedorBullMq (SP-12)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("encola la lectura sin dejar rastro y espera la respuesta menos de 3 s", async () => {
    trabajo.waitUntilFinished.mockResolvedValue([{ marca: MARCA.toISOString(), texto: "INFO hola" }]);

    const lineas = await new SalidaContenedorBullMq("redis://redis:6379").leer("c-14", { desde: MARCA, max: 500 });

    expect(cola.add).toHaveBeenCalledWith(
      "leer",
      { contenedorId: "c-14", desde: MARCA.toISOString(), max: 500 },
      { attempts: 1, removeOnComplete: true, removeOnFail: true },
    );
    expect(trabajo.waitUntilFinished).toHaveBeenCalledWith(eventos, ESPERA_MAXIMA_BITACORA_MS);
    expect(lineas).toEqual([{ marca: MARCA, texto: "INFO hola" }]);
  });

  it("si el trabajador no responde a tiempo, quita la petición de la cola y falla", async () => {
    trabajo.waitUntilFinished.mockRejectedValue(new Error("timeout"));

    await expect(new SalidaContenedorBullMq("redis://redis:6379").leer("c-14", { desde: null, max: 500 })).rejects.toThrow("timeout");
    expect(trabajo.remove).toHaveBeenCalled();
  });

  it("el trabajador responde con `ContenedorPuerto.bitacora` y las fechas viajan como ISO", async () => {
    const leer = jest.fn(async () => [{ marca: MARCA, texto: "WARN lento" }]);
    consumirBitacoras("redis://redis:6379", leer);

    const respuesta = await procesador!({ data: aPeticion("c-14", { desde: null, max: 500 }) });

    expect(leer).toHaveBeenCalledWith("c-14", { desde: null, max: 500 });
    expect(respuesta).toEqual([{ marca: MARCA.toISOString(), texto: "WARN lento" }]);
  });

  it("serializar y deserializar son inversas", () => {
    const lineas = [{ marca: MARCA, texto: "INFO a" }];

    expect(deserializar(serializar(lineas))).toEqual(lineas);
    expect(desdePeticion(aPeticion("c", { desde: MARCA, max: 3 }))).toEqual({ desde: MARCA, max: 3 });
  });
});
