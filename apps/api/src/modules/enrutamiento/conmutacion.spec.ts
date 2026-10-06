import { motorDePrueba, proyectoDemo } from "../../pruebas/motor";

/** Escenarios de `enrutamiento` (M6-01) sobre el pipeline completo con puertos en stub. */
describe("Subdominio y conmutación sin interrupción (M6-01)", () => {
  it("Publicación", async () => {
    const motor = motorDePrueba();

    const despliegue = await motor.desplegar();

    expect(motor.enrutamiento.publicadas).toEqual([{ subdominio: "hola-deploya", host: "deploya-hola-deploya-1", puerto: 8080 }]);
    expect(despliegue.url).toBe("http://hola-deploya.localhost");
  });

  it("Renombrar no cambia la URL", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();
    motor.proyectos.agregar({ ...proyectoDemo(), urlRepositorio: "https://github.com/otra/cosa" });

    const segundo = await motor.desplegar();

    expect(segundo.url).toBe("http://hola-deploya.localhost");
    expect(motor.enrutamiento.publicadas.map((r) => r.subdominio)).toEqual(["hola-deploya", "hola-deploya"]);
  });

  it("Nuevo despliegue", async () => {
    const motor = motorDePrueba();
    const anterior = await motor.desplegar();
    const rutaAlDetener: string[] = [];
    const detener = motor.contenedores.detener.bind(motor.contenedores);
    jest.spyOn(motor.contenedores, "detener").mockImplementation(async (id) => {
      rutaAlDetener.push(motor.enrutamiento.publicadas.at(-1)!.host);
      return detener(id);
    });

    const nuevo = await motor.desplegar();

    expect(rutaAlDetener).toEqual(["deploya-hola-deploya-2"]);
    expect(motor.contenedores.detenidos).toEqual([anterior.contenedorId]);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(nuevo.id);
  });

  it("Salud fallida no conmuta", async () => {
    const motor = motorDePrueba();
    const anterior = await motor.desplegar();
    motor.salud.resultado = { ok: false, estadoHttp: null, milisegundos: 60_000, detalle: "timeout" };

    const nuevo = await motor.desplegar();

    expect(nuevo.estado).toBe("fallido");
    expect(motor.enrutamiento.publicadas.map((r) => r.host)).toEqual(["deploya-hola-deploya-1"]);
    expect(motor.contenedores.eliminados).toEqual(["contenedor-deploya-hola-deploya-2"]);
    expect(motor.contenedores.detenidos).toHaveLength(0);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(anterior.id);
  });

  it("la ruta solo se escribe por EnrutamientoPuerto: retirar llega al puerto", async () => {
    const motor = motorDePrueba();
    await motor.desplegar();

    await motor.accion("detener");

    expect(motor.enrutamiento.retiradas).toEqual(["hola-deploya"]);
  });
});
