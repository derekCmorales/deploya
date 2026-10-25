import { motorDePrueba } from "../../../pruebas/motor";
import { AvisosPuerto, type AvisoDespliegue, type AvisoSuscripcion } from "../../notificaciones";
import { FalloDespliegue } from "../dominio/errores";
import { PipelineDespliegue } from "../pipeline/pipeline-despliegue";
import { AvisoDespliegueOyente } from "./aviso-despliegue.oyente";
import { avisoDeDespliegue, esAvisable } from "./aviso-despliegue";

class AvisosEspia extends AvisosPuerto {
  readonly despliegues: AvisoDespliegue[] = [];
  falla = false;
  async despliegueTerminado(aviso: AvisoDespliegue): Promise<void> {
    if (this.falla) throw new Error("SMTP caído");
    this.despliegues.push(aviso);
  }
  async suscripcionCambio(_aviso: AvisoSuscripcion): Promise<void> {}
}

/** El motor de prueba con el oyente de avisos registrado junto a la retención, como en el trabajador. */
function armar() {
  const motor = motorDePrueba();
  const avisos = new AvisosEspia();
  const oyente = new AvisoDespliegueOyente(motor.despliegues, motor.proyectos, avisos);
  const pipeline = new PipelineDespliegue(motor.despliegues, motor.proyectos, motor.reloj, motor.planes, [motor.retencion, oyente], motor.vigia);
  async function desplegar() {
    const creado = await motor.servicio.crearDespliegue("proyecto-1");
    motor.cola.tomar(creado.id);
    await pipeline.ejecutar({ despliegueId: creado.id, plan: "construccion" }, 0);
    return (await motor.despliegues.porId(creado.id))!;
  }
  return { motor, avisos, oyente, desplegar };
}

describe("SP-08 · El pipeline avisa Saludable y Fallido", () => {
  it("Despliegue saludable: el aviso llega al puerto con el proyecto, el número, el commit y la URL", async () => {
    const { avisos, desplegar } = armar();

    const despliegue = await desplegar();

    expect(despliegue.estado).toBe("saludable");
    expect(avisos.despliegues).toHaveLength(1);
    expect(avisos.despliegues[0]).toMatchObject({
      usuarioId: "usuario-1",
      proyecto: { id: "proyecto-1", nombre: "hola-deploya", subdominio: "hola-deploya" },
      despliegue: { numero: despliegue.numero, commit: despliegue.commit?.sha, estado: "saludable" },
      url: despliegue.url,
    });
    expect(avisos.despliegues[0].fallo).toBeUndefined();
  });

  it("Despliegue fallido: dice la etapa, la versión que sigue activa y las dos últimas líneas de la bitácora", async () => {
    const { motor, avisos, desplegar } = armar();
    const activo = await desplegar();
    motor.constructorImagen.lineas = ["12 npm run build", "sh: 1: tsc: not found"];
    motor.constructorImagen.error = new FalloDespliegue("construccion", "ERROR: el paso [5/5] terminó con código 127", 127);

    const fallido = await desplegar();

    expect(fallido.estado).toBe("fallido");
    const aviso = avisos.despliegues[1];
    expect(aviso.despliegue).toMatchObject({ numero: fallido.numero, estado: "fallido" });
    expect(aviso.fallo?.etapa).toBe("Construcción");
    expect(aviso.fallo?.versionActiva).toBe(activo.numero);
    expect(aviso.fallo?.ultimasLineas).toHaveLength(2);
    expect(aviso.fallo?.ultimasLineas.at(-1)).toMatch(/^\d+ ERROR: el paso \[5\/5\] terminó con código 127$/);
    expect(aviso.url).toBeUndefined();
  });

  it("Cancelado no avisa", async () => {
    const { oyente, avisos, desplegar } = armar();
    const despliegue = await desplegar();

    await oyente.alTerminar({ proyectoId: "proyecto-1", despliegueId: despliegue.id, estado: "cancelado" });
    await oyente.alTerminar({ proyectoId: "proyecto-1", despliegueId: despliegue.id, estado: "detenido" });

    expect(avisos.despliegues).toHaveLength(1);
  });

  it("un fallo del aviso no cambia el estado del despliegue", async () => {
    const { avisos, desplegar } = armar();
    avisos.falla = true;

    await expect(desplegar()).resolves.toMatchObject({ estado: "saludable" });
  });

  it("un despliegue o proyecto que ya no existe no avisa", async () => {
    const { oyente, avisos } = armar();

    await oyente.alTerminar({ proyectoId: "proyecto-1", despliegueId: "no-existe", estado: "saludable" });

    expect(avisos.despliegues).toEqual([]);
  });
});

describe("SP-08 · avisoDeDespliegue", () => {
  it("solo Saludable y Fallido son avisables", () => {
    expect(["saludable", "fallido", "cancelado", "detenido", "construyendo"].filter((e) => esAvisable(e as never))).toEqual(["saludable", "fallido"]);
  });

  it("un fallido sin etapa marcada ni activo se detiene en Recepción y sin versión activa", async () => {
    const { motor } = armar();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");
    const despliegue = (await motor.despliegues.porId(creado.id))!;

    const aviso = avisoDeDespliegue({ despliegue: { ...despliegue, commit: null, terminado: null }, proyecto: (await motor.proyectos.porId("proyecto-1"))!, estado: "fallido" });

    expect(aviso.despliegue).toMatchObject({ commit: "", duracionMs: 0 });
    expect(aviso.fallo).toEqual({ etapa: "Recepción", versionActiva: null, ultimasLineas: [] });
  });
});
