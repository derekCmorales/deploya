import { motorDePrueba, proyectoDemo } from "../../pruebas/motor";
import { SaludNoAlcanzada } from "../construccion/dominio/errores";
import { limitesDesde } from "./dominio/limites-contenedor";

describe("OrquestacionService", () => {
  it("Arranque con cuota: los valores de cuotaDe (Sandbox) llegan a ContenedorPuerto.crear", async () => {
    const motor = motorDePrueba();

    await motor.orquestacion.aprovisionar({ proyecto: proyectoDemo(), numero: 3, imagen: "deploya/hola-deploya:3", variables: {} });

    expect(motor.cuota.consultados).toEqual(["usuario-1"]);
    expect(motor.contenedores.creados[0]).toEqual(expect.objectContaining({ cpus: 0.25, memoriaMb: 256, imagen: "deploya/hola-deploya:3" }));
  });

  it("Arranque con cuota: Sandbox se traduce a NanoCpus 250000000 y Memory 268435456", () => {
    expect(limitesDesde({ cpus: 0.25, memoriaMb: 256 })).toEqual({ nanoCpus: 250_000_000, memoriaBytes: 268_435_456 });
  });

  it("Sin privilegios y en su red: la especificación pide la red deploya-p-<subdominio>", async () => {
    const motor = motorDePrueba();

    await motor.orquestacion.aprovisionar({ proyecto: proyectoDemo(), numero: 1, imagen: "img", variables: {} });

    expect(motor.contenedores.creados[0]).toEqual(
      expect.objectContaining({ nombre: "deploya-hola-deploya-1", red: "deploya-p-hola-deploya", puertoInterno: 8080 }),
    );
  });

  it("aplica otro plan si la cuota cambia (Pro: 1 vCPU y 1 GB)", async () => {
    const motor = motorDePrueba();
    motor.cuota.recursos = { plan: "pro", cpus: 1, memoriaMb: 1024 };

    const { recursos } = await motor.orquestacion.aprovisionar({ proyecto: proyectoDemo(), numero: 1, imagen: "img", variables: {} });

    expect(recursos).toEqual({ plan: "pro", cpus: 1, memoriaMb: 1024 });
  });

  it("Contenedor que no responde: elimina el contenedor y lanza SaludNoAlcanzada", async () => {
    const motor = motorDePrueba();
    motor.salud.resultado = { ok: false, estadoHttp: null, milisegundos: 60_000, detalle: "timeout" };

    await expect(
      motor.orquestacion.aprovisionar({ proyecto: proyectoDemo(), numero: 1, imagen: "img", variables: {} }),
    ).rejects.toThrow(SaludNoAlcanzada);
    expect(motor.contenedores.eliminados).toEqual(["contenedor-deploya-hola-deploya-1"]);
  });
});
