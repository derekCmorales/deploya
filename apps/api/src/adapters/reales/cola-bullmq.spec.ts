import { Job } from "bullmq";
import { ColaBullMq, idTrabajoOperacion } from "./cola-bullmq";

const cola = { getJob: jest.fn(), add: jest.fn(), close: jest.fn() };

jest.mock("bullmq", () => ({ ...jest.requireActual("bullmq"), Queue: jest.fn(() => cola) }));

/** La validación de opciones de BullMQ, sin Redis: es la que corre en `Queue.add`. */
function validarComoBullMq(jobId: string): void {
  const opciones = { opts: { jobId }, queue: { opts: {} } };
  (Job.prototype as unknown as { validateOptions(this: unknown, datos: string): void }).validateOptions.call(opciones, "{}");
}

describe("ColaOperacionBullMq", () => {
  it("el jobId de una acción es aceptado por BullMQ (sin «:» ni enteros)", () => {
    const id = idTrabajoOperacion({ tipo: "reiniciar", proyectoId: "3f1c2b9e-7a64-4b8e-9b51-2f0d3c1a5e77", subdominio: "hola" });

    expect(id).toBe("reiniciar-3f1c2b9e-7a64-4b8e-9b51-2f0d3c1a5e77");
    expect(() => validarComoBullMq(id)).not.toThrow();
    expect(() => validarComoBullMq("p:reiniciar")).toThrow("Custom Id cannot contain :");
  });

  it("reiniciar y detener del mismo proyecto no comparten jobId", () => {
    const base = { proyectoId: "p", subdominio: "s" };

    expect(idTrabajoOperacion({ ...base, tipo: "reiniciar" })).not.toBe(idTrabajoOperacion({ ...base, tipo: "detener" }));
  });
});

describe("ColaBullMq.quitar (M4-02)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saca un trabajo que espera", async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    cola.getJob.mockResolvedValue({ remove });

    expect(await new ColaBullMq("redis://redis:6379").quitar("d1")).toBe(true);
    expect(cola.getJob).toHaveBeenCalledWith("d1");
    expect(remove).toHaveBeenCalled();
  });

  it("devuelve false si el trabajo ya no está", async () => {
    cola.getJob.mockResolvedValue(undefined);

    expect(await new ColaBullMq("redis://redis:6379").quitar("d1")).toBe(false);
  });

  it("devuelve false si el trabajador ya lo tomó (BullMQ no deja quitar uno bloqueado)", async () => {
    cola.getJob.mockResolvedValue({ remove: jest.fn().mockRejectedValue(new Error("Job d1 is locked")) });

    expect(await new ColaBullMq("redis://redis:6379").quitar("d1")).toBe(false);
  });
});
