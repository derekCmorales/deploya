import { BadRequestException, type ArgumentsHost } from "@nestjs/common";
import { motorDePrueba } from "../../pruebas/motor";
import { DesplieguesController, ErroresMotorFilter, numeroDespliegue, posicionDesde } from "./despliegues.controller";
import { DespliegueNoEncontrado, TransicionInvalida } from "./dominio/errores";

function respuestaFalsa() {
  const respuesta = { estado: 0, cuerpo: {} as unknown, status(e: number) { this.estado = e; return this; }, json(c: unknown) { this.cuerpo = c; } };
  const host = { switchToHttp: () => ({ getResponse: () => respuesta }) } as unknown as ArgumentsHost;
  return { respuesta, host };
}

describe("DesplieguesController", () => {
  it("POST /proyectos/:id/despliegues crea el despliegue del dueño", async () => {
    const motor = motorDePrueba();
    const controlador = new DesplieguesController(motor.servicio);

    const creado = await controlador.desplegar("proyecto-1", "usuario-1");

    expect(creado.estado).toBe("encolado");
  });

  it("GET /despliegues/:id/bitacora sin desde empieza en 0", async () => {
    const motor = motorDePrueba();
    const controlador = new DesplieguesController(motor.servicio);
    const despliegue = await motor.desplegar();

    const pagina = await controlador.bitacora(despliegue.id, undefined, "usuario-1");

    expect(pagina.lineas[0].n).toBe(1);
  });

  it("GET /despliegues/:id devuelve la vista del contrato", async () => {
    const motor = motorDePrueba();
    const controlador = new DesplieguesController(motor.servicio);
    const despliegue = await motor.desplegar();

    const vista = await controlador.consultar(despliegue.id, "usuario-1");

    expect(vista.estado).toBe("saludable");
  });

  it("desde inválido responde 400", () => {
    expect(() => posicionDesde("-1")).toThrow(BadRequestException);
    expect(() => posicionDesde("abc")).toThrow(BadRequestException);
    expect(posicionDesde("12")).toBe(12);
  });

  it("el filtro traduce DespliegueNoEncontrado a 404 y TransicionInvalida a 409", () => {
    const filtro = new ErroresMotorFilter();
    const noEncontrado = respuestaFalsa();
    const conflicto = respuestaFalsa();

    filtro.catch(new DespliegueNoEncontrado("x"), noEncontrado.host);
    filtro.catch(new TransicionInvalida("fallido", "saludable"), conflicto.host);

    expect(noEncontrado.respuesta.estado).toBe(404);
    expect(conflicto.respuesta.estado).toBe(409);
  });

  it("GET /proyectos/:id/despliegues/:numero devuelve el mismo cuerpo que por id", async () => {
    const motor = motorDePrueba();
    const controlador = new DesplieguesController(motor.servicio);
    const despliegue = await motor.desplegar();

    const vista = await controlador.consultarPorNumero("proyecto-1", "1", "usuario-1");

    expect(vista).toEqual(await controlador.consultar(despliegue.id, "usuario-1"));
  });

  it("un número que no es entero positivo responde como inexistente (404)", () => {
    expect(() => numeroDespliegue("0")).toThrow(DespliegueNoEncontrado);
    expect(() => numeroDespliegue("abc")).toThrow(DespliegueNoEncontrado);
    expect(numeroDespliegue("3")).toBe(3);
  });
});
