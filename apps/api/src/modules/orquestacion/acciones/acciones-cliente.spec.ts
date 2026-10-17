import { motorDePrueba, proyectoDemo } from "../../../pruebas/motor";
import { ConstruccionFallida } from "../../construccion/dominio/errores";
import { ContenedoresClienteM5 } from "../adaptadores/contenedores-cliente.m5";

const OTRO_USUARIO = "usuario-2";

function motorConDosProyectos() {
  const motor = motorDePrueba();
  motor.proyectos.agregar(proyectoDemo({ id: "proyecto-2", subdominio: "segunda-app" }));
  motor.despliegues.registrarDueno("proyecto-2", "usuario-1");
  return motor;
}

describe("Contenedores de un cliente (M2-05 · tarea 3, M9-02)", () => {
  it("Suscripción suspendida", async () => {
    const motor = motorConDosProyectos();
    const primero = await motor.desplegar("proyecto-1");
    const segundo = await motor.desplegar("proyecto-2");

    const resultado = await motor.accionesProyecto.detenerTodosDe("usuario-1");
    for (const accion of motor.colaOperacion.acciones) await motor.accionesContenedor.ejecutar(accion);

    expect(resultado).toEqual({ encolados: 2 });
    expect(motor.colaOperacion.acciones).toEqual([
      { tipo: "detener", proyectoId: "proyecto-1", subdominio: "hola-deploya" },
      { tipo: "detener", proyectoId: "proyecto-2", subdominio: "segunda-app" },
    ]);
    expect(motor.contenedores.detenidos).toEqual([primero.contenedorId, segundo.contenedorId]);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.estado).toBe("detenido");
    expect((await motor.despliegues.activoDe("proyecto-2"))?.estado).toBe("detenido");
  });

  it("Reanudar al renovar", async () => {
    const motor = motorConDosProyectos();
    await motor.desplegar("proyecto-1");
    await motor.desplegar("proyecto-2");
    await motor.accionesProyecto.detenerTodosDe("usuario-1");
    for (const accion of motor.colaOperacion.acciones) await motor.accionesContenedor.ejecutar(accion);
    const yaEncoladas = motor.colaOperacion.acciones.length;

    const resultado = await motor.accionesProyecto.reanudarTodosDe("usuario-1");
    for (const accion of motor.colaOperacion.acciones.slice(yaEncoladas)) await motor.accionesContenedor.ejecutar(accion);

    expect(resultado).toEqual({ encolados: 2 });
    expect(motor.colaOperacion.acciones.slice(yaEncoladas).map((a) => a.tipo)).toEqual(["reiniciar", "reiniciar"]);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.estado).toBe("saludable");
    expect((await motor.despliegues.activoDe("proyecto-2"))?.estado).toBe("saludable");
    expect(motor.constructorImagen.solicitudes).toHaveLength(2);
  });

  it("Proyecto sin despliegue activo", async () => {
    const motor = motorConDosProyectos();
    await motor.desplegar("proyecto-1");
    motor.constructorImagen.error = new ConstruccionFallida(127, "nunca quedó Saludable");
    await motor.desplegar("proyecto-2");

    const resultado = await motor.accionesProyecto.detenerTodosDe("usuario-1");

    expect(resultado).toEqual({ encolados: 1 });
    expect(motor.colaOperacion.acciones).toEqual([{ tipo: "detener", proyectoId: "proyecto-1", subdominio: "hola-deploya" }]);
  });

  it("Detener omite los proyectos que no están Saludables y reanudar los que no están Detenidos", async () => {
    const motor = motorConDosProyectos();
    await motor.desplegar("proyecto-1");
    await motor.desplegar("proyecto-2");
    await motor.accion("detener", "proyecto-2");
    const yaEncoladas = motor.colaOperacion.acciones.length;

    const detenidos = await motor.accionesProyecto.detenerTodosDe("usuario-1");
    const reanudados = await motor.accionesProyecto.reanudarTodosDe("usuario-1");

    expect(detenidos).toEqual({ encolados: 1 });
    expect(reanudados).toEqual({ encolados: 1 });
    expect(motor.colaOperacion.acciones.slice(yaEncoladas)).toEqual([
      { tipo: "detener", proyectoId: "proyecto-1", subdominio: "hola-deploya" },
      { tipo: "reiniciar", proyectoId: "proyecto-2", subdominio: "segunda-app" },
    ]);
  });

  it("Cliente sin proyectos", async () => {
    const motor = motorConDosProyectos();
    await motor.desplegar("proyecto-1");

    expect(await motor.accionesProyecto.detenerTodosDe(OTRO_USUARIO)).toEqual({ encolados: 0 });
    expect(await motor.accionesProyecto.reanudarTodosDe(OTRO_USUARIO)).toEqual({ encolados: 0 });
    expect(motor.colaOperacion.acciones).toHaveLength(0);
  });

  it("El adaptador ContenedoresClienteM5 delega en la Facade de M5", async () => {
    const motor = motorConDosProyectos();
    await motor.desplegar("proyecto-1");
    const puerto = new ContenedoresClienteM5(motor.accionesProyecto);

    expect(await puerto.detenerTodos("usuario-1")).toEqual({ encolados: 1 });
    await motor.accionesContenedor.ejecutar(motor.colaOperacion.acciones[0]);
    expect(await puerto.reanudarTodos("usuario-1")).toEqual({ encolados: 1 });
  });
});
