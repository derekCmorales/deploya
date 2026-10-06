import { motorDePrueba, proyectoDemo } from "../../pruebas/motor";
import { DespliegueNoEncontrado, ProyectoNoEncontrado } from "./dominio/errores";

describe("ConstruccionService", () => {
  it("Encolar: responde encolado, crea las cinco etapas en Pendiente y deja el trabajo en la cola", async () => {
    const motor = motorDePrueba();

    const creado = await motor.servicio.desplegarComoDueno("proyecto-1", "usuario-1");

    expect(creado).toEqual({ id: creado.id, numero: 1, estado: "encolado" });
    const vista = await motor.servicio.consultar(creado.id, "usuario-1");
    expect(vista.etapas.map((e) => [e.nombre, e.estado])).toEqual([
      ["recepcion", "pendiente"],
      ["construccion", "pendiente"],
      ["ejecucion", "pendiente"],
      ["enrutamiento", "pendiente"],
      ["operacion", "pendiente"],
    ]);
    expect(motor.cola.trabajos).toEqual([{ despliegueId: creado.id, plan: "construccion" }]);
  });

  it("Números consecutivos: tras el #3 el siguiente es el #4", async () => {
    const motor = motorDePrueba();
    await motor.servicio.crearDespliegue("proyecto-1");
    await motor.servicio.crearDespliegue("proyecto-1");
    await motor.servicio.crearDespliegue("proyecto-1");

    const cuarto = await motor.servicio.crearDespliegue("proyecto-1");

    expect(cuarto.numero).toBe(4);
  });

  it("Proyecto ajeno: desplegar responde como inexistente y no encola nada", async () => {
    const motor = motorDePrueba();

    await expect(motor.servicio.desplegarComoDueno("proyecto-1", "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
    expect(motor.cola.trabajos).toHaveLength(0);
  });

  it("Proyecto ajeno: consultar un despliegue de otro usuario responde como inexistente", async () => {
    const motor = motorDePrueba();
    const creado = await motor.servicio.crearDespliegue("proyecto-1");

    await expect(motor.servicio.consultar(creado.id, "otro-usuario")).rejects.toThrow(DespliegueNoEncontrado);
    await expect(motor.servicio.bitacoraDesde(creado.id, "otro-usuario", 0)).rejects.toThrow(DespliegueNoEncontrado);
  });

  it("crearDespliegue de M3 con un proyecto inexistente lanza ProyectoNoEncontrado", async () => {
    const motor = motorDePrueba();

    await expect(motor.servicio.crearDespliegue("no-existe", "alta")).rejects.toThrow(ProyectoNoEncontrado);
  });

  it("consultar un despliegue que no existe lanza DespliegueNoEncontrado", async () => {
    const motor = motorDePrueba();

    await expect(motor.servicio.consultar("no-existe", "usuario-1")).rejects.toThrow(DespliegueNoEncontrado);
  });

  it("Etapas en curso: Recepción completada con su duración, Construcción en curso y el resto pendiente", async () => {
    const motor = motorDePrueba();
    const { id } = await motor.servicio.crearDespliegue("proyecto-1");
    await motor.despliegues.cambiarEstado(id, "construyendo");
    await motor.despliegues.marcarEtapa(id, "recepcion", "en-curso", motor.reloj.ahora());
    motor.reloj.avanzar(1400);
    await motor.despliegues.marcarEtapa(id, "recepcion", "completada", motor.reloj.ahora());
    await motor.despliegues.marcarEtapa(id, "construccion", "en-curso", motor.reloj.ahora());

    const vista = await motor.servicio.consultar(id, "usuario-1");

    expect(vista.estado).toBe("construyendo");
    expect(vista.etapas[0]).toEqual({ nombre: "recepcion", estado: "completada", duracionMs: 1400 });
    expect(vista.etapas[1]).toEqual({ nombre: "construccion", estado: "en-curso", duracionMs: null });
    expect(vista.etapas.slice(2).every((e) => e.estado === "pendiente")).toBe(true);
  });

  it("Leer desde una posición: solo líneas con n mayor, en orden, y siguiente es el último n", async () => {
    const motor = motorDePrueba();
    const { id } = await motor.servicio.crearDespliegue("proyecto-1");
    const lineas = Array.from({ length: 15 }, (_, i) => ({
      n: i + 1, marca: motor.reloj.ahora(), etapa: "construccion" as const, nivel: "info" as const, texto: `línea ${i + 1}`,
    }));
    await motor.despliegues.agregarLineas(id, lineas);

    const pagina = await motor.servicio.bitacoraDesde(id, "usuario-1", 10);

    expect(pagina.lineas.map((l) => l.n)).toEqual([11, 12, 13, 14, 15]);
    expect(pagina.siguiente).toBe(15);
    expect(pagina.terminado).toBe(false);
  });

  it("Despliegue terminado: sin líneas nuevas responde lineas vacías y terminado true", async () => {
    const motor = motorDePrueba();
    const despliegue = await motor.desplegar();

    const pagina = await motor.servicio.bitacoraDesde(despliegue.id, "usuario-1", 1000);

    expect(pagina).toEqual({ lineas: [], siguiente: 1000, terminado: true });
  });

  it("la vista expone commit, imagen, recursos y URL cuando el despliegue quedó Saludable", async () => {
    const motor = motorDePrueba();
    const despliegue = await motor.desplegar();

    const vista = await motor.servicio.consultar(despliegue.id, "usuario-1");

    expect(vista.commit).toEqual({ sha: motor.clonador.commit.sha, mensaje: "feat: demo", autor: "Deploya", rama: "main" });
    expect(vista.imagen).toEqual({ numero: 1, digest: motor.constructorImagen.imagen.digest, tamanoBytes: 48_000_000, receta: "dockerfile" });
    expect(vista.recursos).toEqual({ cpus: 0.25, memoriaMb: 256 });
    expect(vista.url).toBe("http://hola-deploya.localhost");
    expect(vista.terminado).not.toBeNull();
  });

  it("usa la rama del proyecto al registrar el despliegue", async () => {
    const motor = motorDePrueba();
    motor.proyectos.agregar(proyectoDemo({ id: "proyecto-2", rama: "roto" }));

    const { id } = await motor.servicio.crearDespliegue("proyecto-2");

    expect((await motor.despliegues.porId(id))?.rama).toBe("roto");
  });

  it("ultimosDespliegues devuelve el más reciente de cada proyecto para la lista (pantalla 10)", async () => {
    const motor = motorDePrueba();
    motor.proyectos.agregar(proyectoDemo({ id: "proyecto-2", subdominio: "otro" }));
    await motor.servicio.crearDespliegue("proyecto-1");
    const segundo = await motor.servicio.crearDespliegue("proyecto-1");

    const ultimos = await motor.servicio.ultimosDespliegues(["proyecto-1", "proyecto-2"]);

    expect(Object.keys(ultimos)).toEqual(["proyecto-1"]);
    expect(ultimos["proyecto-1"]).toEqual(expect.objectContaining({ id: segundo.id, numero: 2, estado: "encolado" }));
    expect(ultimos["proyecto-1"].etapas).toHaveLength(5);
  });

  it("ultimosDespliegues sin proyectos no consulta nada", async () => {
    const motor = motorDePrueba();

    expect(await motor.servicio.ultimosDespliegues([])).toEqual({});
  });

  describe("Consulta por número de despliegue", () => {
    it("Consultar por número", async () => {
      const motor = motorDePrueba();
      await motor.desplegar();
      await motor.desplegar();
      const tercero = await motor.desplegar();

      const porNumero = await motor.servicio.consultarPorNumero("proyecto-1", 3, "usuario-1");

      expect(porNumero).toEqual(await motor.servicio.consultar(tercero.id, "usuario-1"));
    });

    it("Número inexistente o proyecto ajeno", async () => {
      const motor = motorDePrueba();
      await motor.desplegar();

      await expect(motor.servicio.consultarPorNumero("proyecto-1", 9, "usuario-1")).rejects.toThrow(DespliegueNoEncontrado);
      await expect(motor.servicio.consultarPorNumero("proyecto-1", 1, "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
    });
  });
});
