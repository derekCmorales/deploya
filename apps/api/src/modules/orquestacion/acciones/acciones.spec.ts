import { motorDePrueba } from "../../../pruebas/motor";
import { ConstruccionFallida, ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { AccionNoPermitida, SinDespliegueActivo } from "../dominio/errores";
import { AccionDesconocida } from "./acciones-contenedor.service";
import { AccionesController } from "./acciones.controller";

const SALUD_FALLIDA = { ok: false, estadoHttp: null, milisegundos: 60_000, detalle: "connect ECONNREFUSED" };

describe("Acciones del cliente (M5-02)", () => {
  it("Detener", async () => {
    const motor = motorDePrueba();
    const desplegado = await motor.desplegar();

    const activo = await motor.accion("detener");

    expect(activo.estado).toBe("detenido");
    expect(motor.contenedores.detenidos).toEqual([desplegado.contenedorId]);
    expect(motor.enrutamiento.retiradas).toEqual(["hola-deploya"]);
  });

  it("Reiniciar", async () => {
    const motor = motorDePrueba();
    const desplegado = await motor.desplegar();

    const activo = await motor.accion("reiniciar");

    expect(activo).toEqual(expect.objectContaining({ id: desplegado.id, estado: "saludable", url: "http://hola-deploya.localhost" }));
    expect(motor.contenedores.detenidos).toEqual([desplegado.contenedorId]);
    expect(motor.contenedores.iniciados).toEqual([desplegado.contenedorId]);
    expect(motor.contenedores.creados).toHaveLength(1);
    expect(motor.constructorImagen.solicitudes).toHaveLength(1);
    expect(await motor.despliegues.ultimosDe(["proyecto-1"])).toEqual([expect.objectContaining({ numero: 1 })]);
  });

  it("Reiniciar un proyecto detenido", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    await motor.accion("detener");

    const activo = await motor.accion("reiniciar");

    expect(activo.estado).toBe("saludable");
    expect(motor.enrutamiento.publicadas.at(-1)).toEqual({ subdominio: "hola-deploya", host: "deploya-hola-deploya-1", puerto: 8080 });
    expect(motor.enrutamiento.publicadas).toHaveLength(2);
  });

  it("Reinicio que no pasa la salud", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    motor.salud.resultado = SALUD_FALLIDA;

    const activo = await motor.accion("reiniciar");

    expect(activo.estado).toBe("fallido");
    expect(activo.motivoFallo).toBe("No respondió en 60 s: connect ECONNREFUSED");
    expect(motor.enrutamiento.publicadas).toHaveLength(1);
    expect(motor.enrutamiento.retiradas).toEqual(["hola-deploya"]);
  });

  it("Sin despliegue activo", async () => {
    const motor = motorDePrueba();
    motor.constructorImagen.error = new ConstruccionFallida(127, "nunca quedó Saludable");
    await motor.desplegar();

    await expect(motor.accionesProyecto.reiniciar("proyecto-1", "usuario-1")).rejects.toThrow(SinDespliegueActivo);
    await expect(motor.accionesProyecto.detener("proyecto-1", "usuario-1")).rejects.toThrow(SinDespliegueActivo);
    expect(motor.colaOperacion.acciones).toHaveLength(0);
  });

  it("detener un proyecto ya detenido responde accion-no-permitida y no encola", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    await motor.accion("detener");
    const encoladas = motor.colaOperacion.acciones.length;

    await expect(motor.accionesProyecto.detener("proyecto-1", "usuario-1")).rejects.toThrow(AccionNoPermitida);
    expect(motor.colaOperacion.acciones).toHaveLength(encoladas);
  });

  it("si el estado cambió mientras esperaba en la cola, el trabajador no hace nada", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    await motor.accionesProyecto.detener("proyecto-1", "usuario-1");
    await motor.accionesContenedor.ejecutar(motor.colaOperacion.acciones[0]);

    await motor.accionesContenedor.ejecutar(motor.colaOperacion.acciones[0]);

    expect(motor.contenedores.detenidos).toHaveLength(1);
  });

  it("Eliminar borra contenedor, imágenes y ruta", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();

    await motor.accionesProyecto.pedirEliminacion({ id: "proyecto-1", subdominio: "hola-deploya" });
    await motor.accionesContenedor.ejecutar(motor.colaOperacion.acciones[0]);

    expect(motor.colaOperacion.acciones).toEqual([{ tipo: "eliminar", proyectoId: "proyecto-1", subdominio: "hola-deploya" }]);
    expect(motor.contenedores.proyectosLimpiados).toEqual(["hola-deploya"]);
    expect(motor.contenedores.imagenesBorradas).toEqual(["hola-deploya"]);
    expect(motor.enrutamiento.retiradas).toEqual(["hola-deploya"]);
  });

  it("eliminar dos veces no falla", async () => {
    const motor = motorDePrueba();
    const accion = { tipo: "eliminar" as const, proyectoId: "ya-borrado", subdominio: "hola-deploya" };

    await motor.accionesContenedor.ejecutar(accion);
    await expect(motor.accionesContenedor.ejecutar(accion)).resolves.toBeUndefined();
  });

  it("una acción sin manejador se rechaza con su nombre", async () => {
    const motor = motorDePrueba();

    await expect(
      motor.accionesContenedor.ejecutar({ tipo: "suspender" as never, proyectoId: "p", subdominio: "s" }),
    ).rejects.toThrow(AccionDesconocida);
  });

  describe("controlador", () => {
    it("POST /proyectos/:id/reiniciar y /detener responden {} (202) y encolan", async () => {
      const motor = motorDePrueba();
      await motor.desplegar();
      const controlador = new AccionesController(motor.accionesProyecto);

      expect(await controlador.detener("proyecto-1", "usuario-1")).toEqual({});
      await motor.accionesContenedor.ejecutar(motor.colaOperacion.acciones[0]);
      expect(await controlador.reiniciar("proyecto-1", "usuario-1")).toEqual({});

      expect(motor.colaOperacion.acciones.map((a) => a.tipo)).toEqual(["detener", "reiniciar"]);
    });

    it("proyecto ajeno responde 404 y no encola", async () => {
      const motor = motorDePrueba();
      await motor.desplegar();
      const controlador = new AccionesController(motor.accionesProyecto);

      await expect(controlador.reiniciar("proyecto-1", "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
      expect(motor.colaOperacion.acciones).toHaveLength(0);
    });

    it("las rutas responden 202 Accepted", () => {
      const codigo = (metodo: "reiniciar" | "detener") =>
        Reflect.getMetadata("__httpCode__", AccionesController.prototype[metodo]) as number;

      expect(codigo("reiniciar")).toBe(202);
      expect(codigo("detener")).toBe(202);
    });
  });
});
