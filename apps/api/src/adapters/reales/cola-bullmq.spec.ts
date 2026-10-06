import { Job } from "bullmq";
import { idTrabajoOperacion } from "./cola-bullmq";

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
