import { Logger } from "@nestjs/common";
import { motorDePrueba, proyectoDemo } from "../../../pruebas/motor";
import type { Despliegue } from "../dominio/despliegue";
import { ConstruccionFallida } from "../dominio/errores";
import { avisoDeDespliegue } from "./aviso-despliegue";

describe("SP-08 · El pipeline avisa Saludable y Fallido (AvisoDespliegueOyente)", () => {
  it("Despliegue saludable: el aviso llega al puerto con el proyecto, la versión, el commit y la URL", async () => {
    const motor = motorDePrueba();

    const despliegue = await motor.desplegar();

    expect(motor.avisos.despliegues).toEqual([
      {
        usuarioId: "usuario-1",
        proyecto: { id: "proyecto-1", nombre: "hola-deploya", subdominio: "hola-deploya" },
        despliegue: { numero: 1, commit: despliegue.commit?.sha, estado: "saludable", duracionMs: 0 },
        url: despliegue.url,
      },
    ]);
    expect(despliegue.url).toEqual(expect.any(String));
  });

  it("Despliegue fallido: el aviso lleva la etapa «Construcción», la versión #1 que sigue activa y las dos últimas líneas", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    motor.constructorImagen.error = new ConstruccionFallida(127, "sh: 1: tsc: not found");

    const despliegue = await motor.desplegar();

    const lineas = await motor.despliegues.lineasDesde(despliegue.id, 0, 500);
    const esperadas = lineas.slice(-2).map((l) => `${l.n} ${l.texto}`);
    expect(motor.avisos.despliegues[1]).toEqual(
      expect.objectContaining({
        despliegue: expect.objectContaining({ numero: 2, estado: "fallido" }),
        fallo: { etapa: "Construcción", versionActiva: 1, ultimasLineas: esperadas },
      }),
    );
    expect(esperadas[1]).toContain(despliegue.motivoFallo);
  });

  it("Cancelado no avisa", async () => {
    const motor = motorDePrueba();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");
    motor.cola.tomar(creado.id);
    await motor.accionesDespliegue.cancelar(creado.id, "usuario-1");

    await motor.pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);

    expect((await motor.despliegues.porId(creado.id))?.estado).toBe("cancelado");
    expect(motor.avisos.despliegues).toEqual([]);
  });

  it("Error del SMTP: si el aviso falla, el despliegue conserva su estado y el error queda en la bitácora del API", async () => {
    const motor = motorDePrueba();
    motor.avisos.error = new Error("535 credenciales inválidas");
    const advertencia = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("saludable");
    expect(advertencia).toHaveBeenCalledWith(expect.stringContaining("535 credenciales inválidas"));
    advertencia.mockRestore();
  });
});

describe("SP-08 · avisoDeDespliegue", () => {
  const CREADO = new Date("2026-10-24T12:00:00.000Z");

  function despliegue(cambios: Partial<Despliegue>): Despliegue {
    return {
      id: "d-15",
      proyectoId: "proyecto-1",
      numero: 15,
      estado: "fallido",
      disparador: "manual",
      rama: "main",
      commit: { sha: "a1b2c3d4e5f6", mensaje: "m", autor: "a" },
      artefactoId: null,
      contenedorId: null,
      url: null,
      cpus: null,
      memoriaMb: null,
      codigoSalida: null,
      motivoFallo: "x",
      creado: CREADO,
      terminado: new Date(CREADO.getTime() + 161_000),
      etapas: [{ etapa: "operacion", estado: "fallida", iniciada: CREADO, terminada: CREADO }],
      ...cambios,
    };
  }

  it("la duración es de la creación al final y un Saludable sin URL no inventa una", () => {
    const aviso = avisoDeDespliegue({ proyecto: proyectoDemo(), despliegue: { ...despliegue({}), estado: "saludable" }, activo: null, lineas: [] });

    expect(aviso.despliegue.duracionMs).toBe(161_000);
    expect(aviso).not.toHaveProperty("url");
    expect(aviso).not.toHaveProperty("fallo");
  });

  it("si el que falló ya era el activo (falla en Operación), no promete otra versión activa", () => {
    const fallido = { ...despliegue({}), estado: "fallido" as const };

    const aviso = avisoDeDespliegue({ proyecto: proyectoDemo(), despliegue: fallido, activo: fallido, lineas: [] });

    expect(aviso.fallo).toEqual({ etapa: "Operación", versionActiva: null, ultimasLineas: [] });
  });
});
