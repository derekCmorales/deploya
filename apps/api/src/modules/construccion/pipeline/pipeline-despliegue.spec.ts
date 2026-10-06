import { Logger } from "@nestjs/common";
import { motorDePrueba, proyectoDemo } from "../../../pruebas/motor";
import { ClonFallido, ConstruccionFallida, DespliegueNoEncontrado, TiempoConstruccionAgotado } from "../dominio/errores";

describe("PipelineDespliegue (plan construcción, puertos en stub)", () => {
  it("Construcción exitosa: registra el artefacto #n con imagen, digest y tamaño y llega a Saludable", async () => {
    const motor = motorDePrueba();

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("saludable");
    expect(motor.artefactos.artefactos).toEqual([
      expect.objectContaining({ numero: 1, imagen: "deploya/hola-deploya:1", digest: motor.constructorImagen.imagen.digest, tamanoBytes: 48_000_000 }),
    ]);
    expect(despliegue.etapas.every((e) => e.estado === "completada")).toBe(true);
    expect(motor.constructorImagen.solicitudes[0]).toEqual(
      expect.objectContaining({ etiqueta: "deploya/hola-deploya:1", rutaDockerfile: "Dockerfile", tiempoMaximoMs: 600_000 }),
    );
  });

  it("Construcción fallida: código 127 deja Fallido, la etapa fallida y la última línea en error", async () => {
    const motor = motorDePrueba();
    motor.constructorImagen.error = new ConstruccionFallida(127, "sh: 1: tsc: not found");

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("fallido");
    expect(despliegue.codigoSalida).toBe(127);
    expect(despliegue.etapas.find((e) => e.etapa === "construccion")?.estado).toBe("fallida");
    const lineas = await motor.despliegues.lineasDesde(despliegue.id, 0, 500);
    expect(lineas.at(-1)).toEqual(expect.objectContaining({ nivel: "error", etapa: "construccion" }));
    expect(motor.contenedores.creados).toHaveLength(0);
  });

  it("Construcción fallida: la versión activa del proyecto no cambia", async () => {
    const motor = motorDePrueba();
    const primero = await motor.desplegar();
    motor.constructorImagen.error = new ConstruccionFallida(127, "tsc: not found");

    await motor.desplegar();

    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(primero.id);
    expect(motor.contenedores.detenidos).toHaveLength(0);
  });

  it("Tiempo de construcción agotado: Fallido con motivo y sin código de salida", async () => {
    const motor = motorDePrueba();
    motor.constructorImagen.error = new TiempoConstruccionAgotado();

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("fallido");
    expect(despliegue.motivoFallo).toBe("Tiempo de construcción agotado");
    expect(despliegue.codigoSalida).toBeNull();
  });

  it("Repositorio que no se puede clonar: Fallido en Recepción con el motivo de git", async () => {
    const motor = motorDePrueba();
    motor.clonador.error = new ClonFallido("Remote branch nope not found");

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("fallido");
    expect(despliegue.etapas.find((e) => e.etapa === "recepcion")?.estado).toBe("fallida");
    expect(despliegue.motivoFallo).toContain("Remote branch nope not found");
  });

  it("Stack no reconocido: sin Dockerfile ni receta, Fallido en Recepción con el motivo y la pista", async () => {
    const motor = motorDePrueba();
    motor.clonador.archivos = new Map([["LEEME.md", "hola"]]);

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("fallido");
    expect(despliegue.etapas.find((e) => e.etapa === "recepcion")?.estado).toBe("fallida");
    expect(despliegue.motivoFallo).toBe("Falta Dockerfile y no se reconoce el stack: agrega un Dockerfile en la raíz del repositorio");
    expect(motor.constructorImagen.solicitudes).toHaveLength(0);
  });

  it("Construcción con receta: escribe Dockerfile.deploya, la bitácora dice el stack y el artefacto guarda receta = node", async () => {
    const motor = motorDePrueba();
    motor.clonador.archivos = new Map([["package.json", JSON.stringify({ scripts: { start: "node server.js" } })]]);

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("saludable");
    expect(motor.clonador.escritos).toEqual([
      expect.objectContaining({ directorio: `/tmp/deploya/${despliegue.id}`, ruta: "Dockerfile.deploya" }),
    ]);
    expect(motor.constructorImagen.solicitudes[0].rutaDockerfile).toBe("Dockerfile.deploya");
    expect(motor.artefactos.artefactos[0].receta).toBe("node");
    expect(motor.recetas.recetas.get("proyecto-1")).toBe("node");
    const textos = (await motor.despliegues.lineasDesde(despliegue.id, 0, 500)).map((l) => l.texto);
    expect(textos).toContain("Stack detectado: Node.js 22 · receta Deploya");
  });

  it("El Dockerfile manda: no escribe Dockerfile.deploya y construye con el del repositorio", async () => {
    const motor = motorDePrueba();
    motor.clonador.archivos.set("package.json", JSON.stringify({ scripts: { start: "node server.js" } }));

    const despliegue = await motor.desplegar();

    expect(motor.clonador.escritos).toHaveLength(0);
    expect(motor.constructorImagen.solicitudes[0].rutaDockerfile).toBe("Dockerfile");
    expect(motor.artefactos.artefactos[0].receta).toBe("dockerfile");
    const textos = (await motor.despliegues.lineasDesde(despliegue.id, 0, 500)).map((l) => l.texto);
    expect(textos).toContain("Dockerfile detectado (Dockerfile)");
  });

  it("Contenedor saludable: publica, detiene el anterior y el nuevo pasa a ser el activo", async () => {
    const motor = motorDePrueba();
    const primero = await motor.desplegar();

    const segundo = await motor.desplegar();

    expect(segundo.estado).toBe("saludable");
    expect(motor.contenedores.detenidos).toEqual([primero.contenedorId]);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(segundo.id);
    const lineas = await motor.despliegues.lineasDesde(segundo.id, 0, 500);
    expect(lineas.at(-1)?.texto).toBe("Contenedor #1 detenido · #2 atiende el tráfico");
  });

  it("Contenedor que no responde: elimina el contenedor nuevo, Fallido y la versión anterior sigue", async () => {
    const motor = motorDePrueba();
    const primero = await motor.desplegar();
    motor.salud.resultado = { ok: false, estadoHttp: null, milisegundos: 60_000, detalle: "connect ECONNREFUSED" };

    const segundo = await motor.desplegar();

    expect(segundo.estado).toBe("fallido");
    expect(segundo.motivoFallo).toBe("No respondió en 60 s: connect ECONNREFUSED");
    expect(motor.contenedores.eliminados).toEqual(["contenedor-deploya-hola-deploya-2"]);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(primero.id);
    expect(motor.enrutamiento.publicadas).toHaveLength(1);
  });

  it("Publicación: la ruta apunta al contenedor que pasó la salud y el despliegue guarda la URL", async () => {
    const motor = motorDePrueba();

    const despliegue = await motor.desplegar();

    expect(motor.enrutamiento.publicadas).toEqual([{ subdominio: "hola-deploya", host: "deploya-hola-deploya-1", puerto: 8080 }]);
    expect(despliegue.url).toBe("http://hola-deploya.localhost");
    expect(motor.salud.objetivos[0]).toEqual({ host: "deploya-hola-deploya-1", puerto: 8080, ruta: "/", tiempoMaximoMs: 60_000 });
  });

  it("Renombrar no cambia la URL: el siguiente despliegue se publica en el mismo subdominio", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    motor.proyectos.agregar(proyectoDemo());

    const segundo = await motor.desplegar();

    expect(segundo.url).toBe("http://hola-deploya.localhost");
  });

  it("si falla el enrutamiento, elimina el contenedor nuevo y queda Fallido en Enrutamiento", async () => {
    const motor = motorDePrueba();
    motor.enrutamiento.error = new Error("volumen de Traefik no montado");

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("fallido");
    expect(despliegue.etapas.find((e) => e.etapa === "enrutamiento")?.estado).toBe("fallida");
    expect(motor.contenedores.eliminados).toEqual(["contenedor-deploya-hola-deploya-1"]);
  });

  it("un error inesperado deja Fallido con motivo genérico, sin filtrar detalles internos", async () => {
    const motor = motorDePrueba();
    motor.clonador.error = new TypeError("boom");
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("fallido");
    expect(despliegue.motivoFallo).toBe("Error interno del motor");
  });

  it("la bitácora conserva el orden y marca cada línea con su etapa", async () => {
    const motor = motorDePrueba();

    const despliegue = await motor.desplegar();

    const lineas = await motor.despliegues.lineasDesde(despliegue.id, 0, 500);
    expect(lineas.map((l) => l.n)).toEqual(lineas.map((_, i) => i + 1));
    expect(lineas.map((l) => l.etapa)).toEqual([
      "recepcion", "recepcion", "recepcion", "construccion", "construccion", "construccion", "construccion",
      "ejecucion", "ejecucion", "enrutamiento", "operacion",
    ]);
  });

  it("siempre limpia el clon, también cuando falla", async () => {
    const motor = motorDePrueba();
    motor.constructorImagen.error = new ConstruccionFallida(2, "x");

    const despliegue = await motor.desplegar();

    expect(motor.clonador.limpiados).toEqual([`/tmp/deploya/${despliegue.id}`]);
  });

  it("un trabajo de un despliegue ya terminado no se vuelve a ejecutar", async () => {
    const motor = motorDePrueba();
    const despliegue = await motor.desplegar();

    await motor.pipeline.ejecutar({ despliegueId: despliegue.id, plan: "construccion" }, 0);

    expect(motor.constructorImagen.solicitudes).toHaveLength(1);
  });

  it("un trabajo de un despliegue inexistente lanza DespliegueNoEncontrado", async () => {
    const motor = motorDePrueba();

    await expect(motor.pipeline.ejecutar({ despliegueId: "no-existe", plan: "construccion" }, 0)).rejects.toThrow(
      DespliegueNoEncontrado,
    );
  });
});
