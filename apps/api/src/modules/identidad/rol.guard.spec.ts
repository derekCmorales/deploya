import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UsuarioSesion } from "./dominio/sesion";
import { exigeRol, rolPermitido, RolGuard, SOLO_ADMINISTRACION } from "./rol.guard";
import { Roles } from "./roles.decorator";

const CLIENTE: UsuarioSesion = { id: "u-cliente", correo: "cliente@deploya.app", nombre: "Cliente", rol: "cliente" };
const ADMINISTRADOR: UsuarioSesion = { id: "u-admin", correo: "admin@deploya.app", nombre: "Administrador", rol: "administrador" };

class RutasDePrueba {
  @Roles("administrador")
  soloAdministracion(): void {}

  libre(): void {}
}

@Roles("administrador")
class ControladorDeAdministracion {
  cualquierRuta(): void {}
}

function contextoDe(clase: object, metodo: () => void, usuario?: UsuarioSesion): ExecutionContext {
  return {
    getClass: () => clase,
    getHandler: () => metodo,
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, usuario }) }),
  } as unknown as ExecutionContext;
}

/** El error que lanza `ejecutar`, o `null` si no lanza: deja la prueba en Arrange · Act · Assert. */
function errorDe(ejecutar: () => unknown): unknown {
  try {
    ejecutar();
    return null;
  } catch (error) {
    return error;
  }
}

const guard = new RolGuard(new Reflector());
const rutaAdministracion = (usuario?: UsuarioSesion) =>
  contextoDe(RutasDePrueba, RutasDePrueba.prototype.soloAdministracion, usuario);

describe("M1-04 · RolGuard", () => {
  it("Cliente en ruta de administración: responde 403 SoloAdministracion", () => {
    const error = errorDe(() => guard.canActivate(rutaAdministracion(CLIENTE)));

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual(SOLO_ADMINISTRACION);
  });

  it("Administrador en ruta de administración: la ruta responde normalmente", () => {
    expect(guard.canActivate(rutaAdministracion(ADMINISTRADOR))).toBe(true);
  });

  it("una ruta sin @Roles deja pasar a cualquier usuario con sesión", () => {
    expect(guard.canActivate(contextoDe(RutasDePrueba, RutasDePrueba.prototype.libre, CLIENTE))).toBe(true);
  });

  it("@Roles en el controlador protege todas sus rutas", () => {
    const contexto = contextoDe(ControladorDeAdministracion, ControladorDeAdministracion.prototype.cualquierRuta, CLIENTE);

    expect(() => guard.canActivate(contexto)).toThrow(ForbiddenException);
  });

  it("sin el usuario de SesionGuard responde 401 y no 403", () => {
    expect(() => guard.canActivate(rutaAdministracion())).toThrow(UnauthorizedException);
  });
});

describe("M1-04 · rolPermitido", () => {
  it("sin roles exigidos, cualquier rol pasa", () => {
    expect(rolPermitido("cliente", undefined)).toBe(true);
    expect(rolPermitido("cliente", [])).toBe(true);
  });

  it("solo pasa el rol que está en la lista", () => {
    expect(rolPermitido("administrador", ["administrador"])).toBe(true);
    expect(rolPermitido("cliente", ["administrador"])).toBe(false);
  });
});

describe("M1-04 · exigeRol", () => {
  it("solo exige rol cuando @Roles trae al menos uno", () => {
    expect(exigeRol(undefined)).toBe(false);
    expect(exigeRol([])).toBe(false);
    expect(exigeRol(["administrador"])).toBe(true);
  });
});
