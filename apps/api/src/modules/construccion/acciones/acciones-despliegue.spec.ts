import type { ArgumentsHost } from "@nestjs/common";
import { motorDePrueba } from "../../../pruebas/motor";
import { SuscripcionNoPermite } from "../../orquestacion/dominio/errores";
import { AccionesDespliegueController } from "./acciones-despliegue.controller";
import { ErroresMotorFilter } from "../despliegues.controller";
import {
  ClonFallido,
  CommitDesconocido,
  ConstruccionFallida,
  DespliegueNoEncontrado,
  ProyectoNoEncontrado,
  SoloSeReintentaUnFallido,
  YaNoSePuedeCancelar,
} from "../dominio/errores";
import { INTERVALO_VIGIA_MS } from "../dominio/motor.constantes";
import { PipelineDespliegue } from "../pipeline/pipeline-despliegue";
import { VigiaCancelacion } from "../pipeline/vigia-cancelacion";

type Motor = ReturnType<typeof motorDePrueba>;

async function fallido(motor: Motor) {
  motor.constructorImagen.error = new ConstruccionFallida(127, "sh: 1: tsc: not found");
  const despliegue = await motor.desplegar();
  motor.constructorImagen.error = null;
  return despliegue;
}

/** Corre un despliegue ya creado como el trabajador: toma el trabajo y recorre el plan. */
async function correr(motor: Motor, despliegueId: string): Promise<void> {
  motor.cola.tomar(despliegueId);
  await motor.pipeline.ejecutar({ despliegueId, plan: "construccion" }, 0);
}

describe("Cancelar (M4-02)", () => {
  afterEach(() => jest.useRealTimers());

  it("Cancelar encolado", async () => {
    const motor = motorDePrueba();
    const primero = await motor.desplegar();
    const encolado = await motor.servicio.crearDespliegue("proyecto-1");

    const respuesta = await motor.accionesDespliegue.cancelar(encolado.id, "usuario-1");

    const despliegue = await motor.despliegues.porId(encolado.id);
    expect(respuesta).toEqual({ estado: "cancelado" });
    expect(despliegue?.estado).toBe("cancelado");
    expect(despliegue?.terminado).not.toBeNull();
    expect(motor.cola.trabajos).toEqual([]);
    expect(motor.clonador.solicitudes).toHaveLength(1);
    expect(motor.constructorImagen.solicitudes).toHaveLength(1);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(primero.id);
    expect(await motor.cancelaciones.pedida(encolado.id)).toBe(false);
    expect((await motor.despliegues.lineasDesde(encolado.id, 0, 10)).map((l) => l.texto)).toEqual(["Cancelado por el usuario"]);
  });

  it("Cancelar un encolado que el trabajador ya tomó deja la señal y el trabajador lo corta antes de clonar", async () => {
    const motor = motorDePrueba();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");
    motor.cola.tomar(creado.id);

    await motor.accionesDespliegue.cancelar(creado.id, "usuario-1");
    expect(await motor.cancelaciones.pedida(creado.id)).toBe(true);
    expect((await motor.despliegues.porId(creado.id))?.estado).toBe("encolado");
    await motor.pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);

    const despliegue = await motor.despliegues.porId(creado.id);
    expect(despliegue?.estado).toBe("cancelado");
    expect(despliegue?.etapas.every((e) => e.estado === "pendiente")).toBe(true);
    expect(motor.clonador.solicitudes).toHaveLength(0);
  });

  it("Cancelar", async () => {
    jest.useFakeTimers();
    const motor = motorDePrueba();
    const activo = await motor.desplegar();
    motor.constructorImagen.colgado = true;
    const pipeline = new PipelineDespliegue(motor.despliegues, motor.proyectos, motor.reloj, motor.planes, [motor.retencion], new VigiaCancelacion(motor.cancelaciones));
    const creado = await motor.servicio.crearDespliegue("proyecto-1");
    motor.cola.tomar(creado.id);

    const corrida = pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);
    await jest.advanceTimersByTimeAsync(0);
    expect((await motor.despliegues.porId(creado.id))?.estado).toBe("construyendo");
    await motor.accionesDespliegue.cancelar(creado.id, "usuario-1");
    await jest.advanceTimersByTimeAsync(INTERVALO_VIGIA_MS);
    await corrida;

    const despliegue = await motor.despliegues.porId(creado.id);
    expect(despliegue?.estado).toBe("cancelado");
    expect(despliegue?.etapas.find((e) => e.etapa === "construccion")?.estado).toBe("fallida");
    expect(despliegue?.etapas.find((e) => e.etapa === "ejecucion")?.estado).toBe("pendiente");
    const lineas = await motor.despliegues.lineasDesde(creado.id, 0, 500);
    expect(lineas.at(-1)).toEqual(expect.objectContaining({ texto: "Cancelado por el usuario", etapa: "construccion" }));
    expect(motor.clonador.limpiados).toHaveLength(2);
    expect(motor.contenedores.creados).toHaveLength(1);
    expect(motor.artefactos.artefactos).toHaveLength(1);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(activo.id);
  });

  it("Cancelar tarde", async () => {
    const motor = motorDePrueba();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");
    await motor.despliegues.cambiarEstado(creado.id, "aprovisionando");

    await expect(motor.accionesDespliegue.cancelar(creado.id, "usuario-1")).rejects.toThrow(YaNoSePuedeCancelar);

    expect(await motor.cancelaciones.pedida(creado.id)).toBe(false);
    expect((await motor.despliegues.porId(creado.id))?.estado).toBe("aprovisionando");
  });

  it("una señal que llega cuando ya está en Aprovisionando no cancela nada", async () => {
    const motor = motorDePrueba();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");
    motor.cola.tomar(creado.id);
    motor.contenedores.alCrear = () => motor.cancelaciones.pedir(creado.id);

    await motor.pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);

    expect((await motor.despliegues.porId(creado.id))?.estado).toBe("saludable");
  });

  it("un despliegue ya terminado responde ya-no-se-puede-cancelar", async () => {
    const motor = motorDePrueba();
    const saludable = await motor.desplegar();

    await expect(motor.accionesDespliegue.cancelar(saludable.id, "usuario-1")).rejects.toThrow(YaNoSePuedeCancelar);
  });

  it("un despliegue de otro usuario o inexistente es 404", async () => {
    const motor = motorDePrueba();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");

    await expect(motor.accionesDespliegue.cancelar(creado.id, "otro-usuario")).rejects.toThrow(DespliegueNoEncontrado);
    await expect(motor.accionesDespliegue.cancelar("no-existe", "usuario-1")).rejects.toThrow(DespliegueNoEncontrado);
    expect((await motor.despliegues.porId(creado.id))?.estado).toBe("encolado");
  });
});

describe("Reintentar y redesplegar (M4-02)", () => {
  it("Reintentar un fallido", async () => {
    const motor = motorDePrueba();
    const roto = await fallido(motor);

    const creado = await motor.accionesDespliegue.reintentar(roto.id, "usuario-1");
    await correr(motor, creado.id);

    const reintento = await motor.despliegues.porId(creado.id);
    expect(creado).toEqual({ id: expect.any(String), numero: 2, estado: "encolado" });
    expect(reintento).toEqual(expect.objectContaining({ disparador: "reintento", estado: "saludable" }));
    expect(reintento?.commit?.sha).toBe(roto.commit?.sha);
    expect(motor.clonador.solicitudes.at(-1)?.commitSha).toBe(roto.commit?.sha);
    expect(await motor.despliegues.contarConstruccionesDesde("usuario-1", new Date(0))).toBe(2);
  });

  it("Reintentar un fallido sin commit (el clon falló) parte de la rama", async () => {
    const motor = motorDePrueba();
    motor.clonador.error = new ClonFallido("no se pudo clonar");
    const roto = await motor.desplegar();
    motor.clonador.error = null;

    const creado = await motor.accionesDespliegue.reintentar(roto.id, "usuario-1");
    await correr(motor, creado.id);

    expect(motor.clonador.solicitudes.at(-1)?.commitSha).toBeUndefined();
    expect((await motor.despliegues.porId(creado.id))?.estado).toBe("saludable");
  });

  it("Reintentar uno saludable", async () => {
    const motor = motorDePrueba();
    const saludable = await motor.desplegar();

    await expect(motor.accionesDespliegue.reintentar(saludable.id, "usuario-1")).rejects.toThrow(SoloSeReintentaUnFallido);

    expect(await motor.despliegues.ultimosDe(["proyecto-1"])).toEqual([expect.objectContaining({ numero: 1 })]);
  });

  it("Redesplegar reconstruye", async () => {
    const motor = motorDePrueba();
    const primero = await motor.desplegar();

    const creado = await motor.accionesDespliegue.redesplegar("proyecto-1", primero.commit?.sha ?? "", "usuario-1");
    await correr(motor, creado.id);

    const redespliegue = await motor.despliegues.porId(creado.id);
    expect(redespliegue).toEqual(expect.objectContaining({ numero: 2, disparador: "redespliegue", estado: "saludable" }));
    expect(motor.clonador.solicitudes.at(-1)?.commitSha).toBe(primero.commit?.sha);
    expect(motor.constructorImagen.solicitudes).toHaveLength(2);
    expect(await motor.despliegues.contarConstruccionesDesde("usuario-1", new Date(0))).toBe(2);
  });

  it("Commit desconocido", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();

    await expect(motor.accionesDespliegue.redesplegar("proyecto-1", "deadbeef".repeat(5), "usuario-1")).rejects.toThrow(CommitDesconocido);
    await expect(motor.accionesDespliegue.redesplegar("proyecto-1", "no es un sha", "usuario-1")).rejects.toThrow(CommitDesconocido);

    expect(await motor.despliegues.ultimosDe(["proyecto-1"])).toEqual([expect.objectContaining({ numero: 1 })]);
  });

  it("Redesplegar en un proyecto ajeno es 404", async () => {
    const motor = motorDePrueba();
    const primero = await motor.desplegar();

    await expect(motor.accionesDespliegue.redesplegar("proyecto-1", primero.commit?.sha ?? "", "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
  });

  it("Bloqueo por suscripción", async () => {
    const motor = motorDePrueba();
    const roto = await fallido(motor);
    motor.cuota.permiso = { estado: "vencida", construccionesMes: 30 };

    await expect(motor.accionesDespliegue.reintentar(roto.id, "usuario-1")).rejects.toThrow(SuscripcionNoPermite);
    await expect(motor.accionesDespliegue.redesplegar("proyecto-1", roto.commit?.sha ?? "", "usuario-1")).rejects.toThrow(SuscripcionNoPermite);

    expect(await motor.despliegues.ultimosDe(["proyecto-1"])).toEqual([expect.objectContaining({ numero: 1 })]);
  });
});

describe("Rutas de M4-02", () => {
  it("cancelar responde 200, reintentar y redesplegar 201 con el despliegue nuevo", async () => {
    const motor = motorDePrueba();
    const roto = await fallido(motor);
    const controlador = new AccionesDespliegueController(motor.accionesDespliegue);
    const encolado = await motor.servicio.crearDespliegue("proyecto-1");

    expect(Reflect.getMetadata("__httpCode__", AccionesDespliegueController.prototype.cancelar)).toBe(200);
    expect(await controlador.cancelar(encolado.id, "usuario-1")).toEqual({ estado: "cancelado" });
    expect(await controlador.reintentar(roto.id, "usuario-1")).toEqual({ id: expect.any(String), numero: 3, estado: "encolado" });
    expect(await controlador.redesplegar("proyecto-1", { commitSha: roto.commit?.sha }, "usuario-1")).toEqual({
      id: expect.any(String),
      numero: 4,
      estado: "encolado",
    });
  });

  it("redesplegar sin commitSha responde 400", () => {
    const controlador = new AccionesDespliegueController(motorDePrueba().accionesDespliegue);

    expect(() => controlador.redesplegar("proyecto-1", {}, "usuario-1")).toThrow("commitSha es obligatorio");
  });

  it("el filtro traduce los rechazos a 409 con su código y lo desconocido a 404", () => {
    const respuestas: { estado: number; cuerpo: unknown }[] = [];
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: (estado: number) => ({ json: (cuerpo: unknown) => respuestas.push({ estado, cuerpo }) }),
        }),
      }),
    } as unknown as ArgumentsHost;
    const filtro = new ErroresMotorFilter();

    filtro.catch(new YaNoSePuedeCancelar("aprovisionando"), host);
    filtro.catch(new SoloSeReintentaUnFallido("saludable"), host);
    filtro.catch(new CommitDesconocido("abc"), host);
    filtro.catch(new DespliegueNoEncontrado("x"), host);

    expect(respuestas.map((r) => [r.estado, (r.cuerpo as { codigo: string }).codigo])).toEqual([
      [409, "ya-no-se-puede-cancelar"],
      [409, "solo-se-reintenta-un-fallido"],
      [409, "commit-desconocido"],
      [404, "DespliegueNoEncontrado"],
    ]);
  });
});
