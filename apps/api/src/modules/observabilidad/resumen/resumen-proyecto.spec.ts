import { motorDePrueba } from "../../../pruebas/motor";
import { ConstruccionFallida, ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { ResumenProyectoController } from "./resumen-proyecto.controller";

describe("Resumen del proyecto (M7-02)", () => {
  it("Proyecto saludable", async () => {
    const motor = motorDePrueba();
    const primero = await motor.desplegar();
    const activo = await motor.desplegar();

    const resumen = await motor.resumen.resumen("proyecto-1", "usuario-1");

    expect(resumen.proyecto).toEqual({
      id: "proyecto-1",
      nombre: "hola-deploya",
      subdominio: "hola-deploya",
      url: "http://hola-deploya.localhost",
      repositorio: "https://github.com/derekCmorales/hola-deploya",
      rama: "main",
      receta: "dockerfile",
      puertoInterno: 8080,
    });
    expect(resumen.plan).toEqual({ codigo: "sandbox", nombre: "Sandbox" });
    expect(resumen.activo).toEqual(
      expect.objectContaining({ id: activo.id, numero: 2, estado: "saludable", imagen: expect.objectContaining({ digest: motor.constructorImagen.imagen.digest }) }),
    );
    expect(resumen.ultimo?.id).toBe(activo.id);
    expect(resumen.recursos).toEqual({ cpus: 0.25, memoriaMb: 256 });
    expect(resumen.lineaTiempo.map((h) => h.titulo)).toEqual(["Commit recibido", "Imagen construida", "Contenedor iniciado", "Tráfico redirigido"]);
    expect(resumen.lineaTiempo.at(-1)?.detalle).toBe(`#${primero.numero} detenido · #2 en línea`);
  });

  it("Proyecto sin despliegue Saludable", async () => {
    const motor = motorDePrueba();
    motor.constructorImagen.error = new ConstruccionFallida(127, "tsc: not found");
    const fallido = await motor.desplegar();

    const resumen = await motor.resumen.resumen("proyecto-1", "usuario-1");

    expect(resumen.activo).toBeNull();
    expect(resumen.proyecto.url).toBeNull();
    expect(resumen.recursos).toBeNull();
    expect(resumen.ultimo).toEqual(expect.objectContaining({ id: fallido.id, estado: "fallido" }));
    expect(resumen.lineaTiempo.map((h) => h.titulo)).toEqual(["Commit recibido"]);
  });

  it("Proyecto sin ningún despliegue", async () => {
    const motor = motorDePrueba();

    const resumen = await motor.resumen.resumen("proyecto-1", "usuario-1");

    expect(resumen).toEqual(expect.objectContaining({ activo: null, ultimo: null, recursos: null, lineaTiempo: [] }));
    expect(resumen.proyecto.receta).toBeNull();
  });

  it("Detenido no ofrece la URL pública", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    await motor.accion("detener");

    const resumen = await motor.resumen.resumen("proyecto-1", "usuario-1");

    expect(resumen.activo?.estado).toBe("detenido");
    expect(resumen.proyecto.url).toBeNull();
  });

  it("la línea de tiempo de una reversión nombra la versión que dejó de atender", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    await motor.desplegar();
    await motor.revertir(motor.artefactos.artefactos[0].id);

    const resumen = await motor.resumen.resumen("proyecto-1", "usuario-1");

    expect(resumen.ultimo?.disparador).toBe("reversion");
    expect(resumen.lineaTiempo.map((h) => h.titulo)).toEqual(["Contenedor iniciado", "Tráfico redirigido"]);
    expect(resumen.lineaTiempo.at(-1)?.detalle).toBe("#2 detenido · #3 en línea");
  });

  it("un proyecto ajeno o inexistente es 404", async () => {
    const motor = motorDePrueba();

    await expect(motor.resumen.resumen("proyecto-1", "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
    await expect(motor.resumen.resumen("no-existe", "usuario-1")).rejects.toThrow(ProyectoNoEncontrado);
  });

  it("GET /proyectos/:id/resumen delega en el servicio", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();

    const resumen = await new ResumenProyectoController(motor.resumen).resumenDe("proyecto-1", "usuario-1");

    expect(resumen.proyecto.id).toBe("proyecto-1");
  });
});
