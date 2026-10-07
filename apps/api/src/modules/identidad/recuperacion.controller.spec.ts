import { BadRequestException, type ArgumentsHost } from "@nestjs/common";
import { HTTP_CODE_METADATA } from "@nestjs/common/constants";
import { ContrasenaDebil, ContrasenasNoCoinciden, TokenNoValido } from "./dominio/errores";
import { ErroresIdentidadFilter } from "./identidad.controller";
import { RecuperacionController, RESPUESTA_RECUPERACION } from "./recuperacion.controller";
import type { RecuperacionService } from "./recuperacion.service";

const CLAVE = "Nueva#Clave2026";

function armar() {
  const servicio = { solicitar: jest.fn().mockResolvedValue(undefined), restablecer: jest.fn().mockResolvedValue(undefined) };
  return { controller: new RecuperacionController(servicio as unknown as RecuperacionService), servicio };
}

function respuestaDe(error: Error) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  new ErroresIdentidadFilter().catch(error, host);
  return { status, json };
}

describe("RecuperacionController", () => {
  it("POST /identidad/recuperacion responde el mismo cuerpo exista o no la cuenta", async () => {
    const { controller, servicio } = armar();

    const conCuenta = await controller.solicitar({ correo: "derek@tiendademo.com" });
    const sinCuenta = await controller.solicitar({ correo: "nadie@tiendademo.com" });

    expect(conCuenta).toEqual(RESPUESTA_RECUPERACION);
    expect(sinCuenta).toEqual(conCuenta);
    expect(servicio.solicitar).toHaveBeenNthCalledWith(1, "derek@tiendademo.com");
  });

  it("POST /identidad/recuperacion/restablecer pasa token y contraseña al servicio", async () => {
    const { controller, servicio } = armar();

    await expect(controller.restablecer({ token: "abc", contrasena: CLAVE, confirmacion: CLAVE })).resolves.toBeUndefined();
    expect(servicio.restablecer).toHaveBeenCalledWith({ token: "abc", contrasena: CLAVE });
  });

  it("rechaza si la confirmación no coincide, sin llamar al servicio", async () => {
    const { controller, servicio } = armar();

    await expect(controller.restablecer({ token: "abc", contrasena: CLAVE, confirmacion: "otra" })).rejects.toBeInstanceOf(
      ContrasenasNoCoinciden,
    );
    expect(servicio.restablecer).not.toHaveBeenCalled();
  });

  it("sin correo o sin token responde 400", async () => {
    const { controller } = armar();

    await expect(controller.solicitar({})).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.restablecer({ contrasena: CLAVE, confirmacion: CLAVE })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("fija el contrato HTTP: 202 al solicitar y 204 al restablecer", () => {
    const codigoDe = (metodo: keyof RecuperacionController) =>
      Reflect.getMetadata(HTTP_CODE_METADATA, RecuperacionController.prototype[metodo]);

    expect(codigoDe("solicitar")).toBe(202);
    expect(codigoDe("restablecer")).toBe(204);
  });

  it("enlace vencido, usado o desconocido → 410 TokenNoValido; contraseña débil → 400 con las reglas", () => {
    expect(respuestaDe(new TokenNoValido("expirado")).status).toHaveBeenCalledWith(410);
    const debil = respuestaDe(new ContrasenaDebil(["Al menos un símbolo"]));
    expect(debil.status).toHaveBeenCalledWith(400);
    expect(debil.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "ContrasenaDebil", reglasIncumplidas: ["Al menos un símbolo"] }));
  });
});
