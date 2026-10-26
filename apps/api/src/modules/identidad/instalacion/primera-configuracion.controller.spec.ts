import { GUARDS_METADATA } from "@nestjs/common/constants";
import type { ArgumentsHost } from "@nestjs/common";
import type { Request, Response } from "express";
import { PrimeraConfiguracionNoDisponible } from "../../suscripciones/dominio/errores";
import { COOKIE_SESION } from "../cookie-sesion";
import type { UsuarioSesion } from "../dominio/sesion";
import { ROLES_PERMITIDOS } from "../roles.decorator";
import { RolGuard } from "../rol.guard";
import { SesionGuard } from "../sesion.guard";
import { AsistenteDisponibleGuard } from "./asistente-disponible.guard";
import { CorreoDePruebaRechazado, DatosCorreoInvalidos, DemasiadosIntentosCodigo } from "./errores";
import { ErroresInstalacionFilter } from "./errores-instalacion.filter";
import { PrimeraConfiguracionController } from "./primera-configuracion.controller";
import type { PrimeraConfiguracionService } from "./primera-configuracion.service";

const ADMIN: UsuarioSesion = { id: "u-1", correo: "ops@miempresa.com", nombre: "Ops", rol: "administrador" };

function armar() {
  const servicio = {
    validarCodigo: jest.fn().mockResolvedValue(undefined),
    crearAdministrador: jest.fn().mockResolvedValue({ token: "tok-1", usuario: ADMIN }),
    probarCorreo: jest.fn().mockResolvedValue({ entregado: true, ms: 1200 }),
    guardarCorreo: jest.fn().mockResolvedValue(undefined),
  };
  const controlador = new PrimeraConfiguracionController(servicio as unknown as PrimeraConfiguracionService, { segura: false });
  const solicitud = { ip: "203.0.113.7", headers: { "user-agent": "Firefox" } } as unknown as Request;
  const respuesta = { setHeader: jest.fn() } as unknown as Response & { setHeader: jest.Mock };
  return { servicio, controlador, solicitud, respuesta };
}

function respuestaDeFiltro(error: Error) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  new ErroresInstalacionFilter().catch(error as DemasiadosIntentosCodigo, host);
  return { estado: status.mock.calls[0][0], cuerpo: json.mock.calls[0][0] };
}

describe("SP-17 · Endpoints del asistente", () => {
  it("POST /instalacion/codigo pasa el código y el origen de la petición", async () => {
    const { controlador, servicio, solicitud } = armar();

    await controlador.validarCodigo({ codigo: "K7QP-M2XD" }, solicitud);

    expect(servicio.validarCodigo).toHaveBeenCalledWith("K7QP-M2XD", "203.0.113.7");
  });

  it("POST /instalacion/administrador responde el usuario y deja la cookie de sesión", async () => {
    const { controlador, servicio, solicitud, respuesta } = armar();

    const cuerpo = await controlador.crearAdministrador(
      { codigo: "K7QP-M2XD", correo: "ops@miempresa.com", contrasena: "Admin#Clave2026" },
      solicitud,
      respuesta,
    );

    expect(cuerpo).toEqual({ usuario: ADMIN });
    expect(servicio.crearAdministrador).toHaveBeenCalledWith(
      { codigo: "K7QP-M2XD", correo: "ops@miempresa.com", contrasena: "Admin#Clave2026", agenteUsuario: "Firefox" },
      "203.0.113.7",
    );
    expect(respuesta.setHeader).toHaveBeenCalledWith("Set-Cookie", expect.stringContaining(`${COOKIE_SESION}=tok-1; Path=/; HttpOnly`));
  });

  it("sin el campo codigo se valida como código vacío (401 del servicio), no como 400", async () => {
    const { controlador, servicio, solicitud, respuesta } = armar();

    await controlador.validarCodigo({}, solicitud);
    await controlador.crearAdministrador({ correo: "ops@miempresa.com", contrasena: "Admin#Clave2026" }, solicitud, respuesta);

    expect(servicio.validarCodigo).toHaveBeenCalledWith("", "203.0.113.7");
    expect(servicio.crearAdministrador).toHaveBeenCalledWith(expect.objectContaining({ codigo: "" }), "203.0.113.7");
  });

  it("el correo pide modo autoalojado, sesión y rol de administrador, en ese orden", () => {
    for (const metodo of ["probarCorreo", "guardarCorreo"] as const) {
      const ruta = PrimeraConfiguracionController.prototype[metodo];
      expect(Reflect.getMetadata(GUARDS_METADATA, ruta)).toEqual([AsistenteDisponibleGuard, SesionGuard, RolGuard]);
      expect(Reflect.getMetadata(ROLES_PERMITIDOS, ruta)).toEqual(["administrador"]);
    }
  });

  it("la prueba de correo va al correo del administrador de la sesión", async () => {
    const { controlador, servicio } = armar();

    await expect(controlador.probarCorreo({ smtp: {} }, ADMIN.correo)).resolves.toEqual({ entregado: true, ms: 1200 });
    expect(servicio.probarCorreo).toHaveBeenCalledWith({ smtp: {} }, "ops@miempresa.com");
  });

  it("en la nube el correo del asistente responde 404 antes de pedir sesión", () => {
    expect(new AsistenteDisponibleGuard("autoalojado").canActivate()).toBe(true);
    expect(() => new AsistenteDisponibleGuard("nube").canActivate()).toThrow(PrimeraConfiguracionNoDisponible);
  });

  it("errores del asistente: 429 con los segundos, 400 con el campo y 502 con lo que dijo el SMTP", () => {
    expect(respuestaDeFiltro(new DemasiadosIntentosCodigo(600))).toEqual({
      estado: 429,
      cuerpo: { codigo: "DemasiadosIntentosCodigo", mensaje: expect.stringContaining("10 min"), segundos: 600 },
    });
    expect(respuestaDeFiltro(new DatosCorreoInvalidos("puerto"))).toMatchObject({ estado: 400, cuerpo: { campo: "puerto" } });
    expect(respuestaDeFiltro(new CorreoDePruebaRechazado("535 auth failed"))).toEqual({
      estado: 502,
      cuerpo: { codigo: "CorreoDePruebaRechazado", mensaje: "535 auth failed", error: "535 auth failed" },
    });
  });
});
