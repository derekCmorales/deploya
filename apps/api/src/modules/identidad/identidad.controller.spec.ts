import { BadRequestException, type ArgumentsHost } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ContrasenaDebil, ContrasenasNoCoinciden, CorreoYaRegistrado, TokenNoValido } from "./dominio/errores";
import { ErroresIdentidadFilter, IdentidadController, textoDe } from "./identidad.controller";
import { IdentidadService } from "./identidad.service";

const CUENTA = { usuarioId: "u-1", correoEnmascarado: "d•••k@t•••••••o.com", estadoCuenta: "pendiente" as const, correoEnviado: true };

async function armar() {
  const servicio = { registrar: jest.fn().mockResolvedValue(CUENTA), verificar: jest.fn().mockResolvedValue({ estadoCuenta: "activa" }) };
  const moduleRef = await Test.createTestingModule({
    controllers: [IdentidadController],
    providers: [{ provide: IdentidadService, useValue: servicio }],
  }).compile();
  return { controller: moduleRef.get(IdentidadController), servicio };
}

function respuestaDe(error: Error) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  new ErroresIdentidadFilter().catch(error, host);
  return { status, json };
}

describe("IdentidadController", () => {
  it("health del módulo", async () => {
    const { controller } = await armar();
    expect(controller.health()).toEqual({ status: "ok", module: "identidad" });
  });

  it("POST /identidad/registro pasa correo y contraseña al servicio", async () => {
    const { controller, servicio } = await armar();

    const cuenta = await controller.registrar({ correo: "derek@tiendademo.com", contrasena: "Deploya#2026seguro", confirmacion: "Deploya#2026seguro" });

    expect(cuenta).toEqual(CUENTA);
    expect(servicio.registrar).toHaveBeenCalledWith({ correo: "derek@tiendademo.com", contrasena: "Deploya#2026seguro" });
  });

  it("POST /identidad/registro rechaza si la confirmación no coincide", async () => {
    const { controller, servicio } = await armar();

    expect(() => controller.registrar({ correo: "a@b.co", contrasena: "Deploya#2026seguro", confirmacion: "otra" })).toThrow(ContrasenasNoCoinciden);
    expect(servicio.registrar).not.toHaveBeenCalled();
  });

  it("POST /identidad/verificacion pasa el token al servicio", async () => {
    const { controller, servicio } = await armar();

    await expect(controller.verificar({ token: "abc" })).resolves.toEqual({ estadoCuenta: "activa" });
    expect(servicio.verificar).toHaveBeenCalledWith("abc");
  });

  it("un campo ausente o vacío responde 400", () => {
    expect(() => textoDe({ correo: "" }, "correo")).toThrow(BadRequestException);
    expect(() => textoDe(null, "token")).toThrow(BadRequestException);
  });
});

describe("ErroresIdentidadFilter", () => {
  it("Correo ya registrado → 409 con codigo CorreoYaRegistrado", () => {
    const { status, json } = respuestaDe(new CorreoYaRegistrado("a@b.co"));

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ codigo: "CorreoYaRegistrado", mensaje: "Este correo ya tiene una cuenta." });
  });

  it("Token expirado o usado → 410 con codigo TokenNoValido, sin revelar el motivo", () => {
    const { status, json } = respuestaDe(new TokenNoValido("usado"));

    expect(status).toHaveBeenCalledWith(410);
    expect(json).toHaveBeenCalledWith({ codigo: "TokenNoValido", mensaje: "El enlace ya no es válido" });
  });

  it("contraseña débil → 400 con las reglas incumplidas", () => {
    const { status, json } = respuestaDe(new ContrasenaDebil(["Al menos un símbolo"]));

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "ContrasenaDebil", reglasIncumplidas: ["Al menos un símbolo"] }));
  });
});
