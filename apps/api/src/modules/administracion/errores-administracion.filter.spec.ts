import type { ArgumentsHost } from "@nestjs/common";
import { ConsultaInvalida, CuentaNoSuspendida, CuentaYaSuspendida, MotivoInvalido, NoSePuedeSuspenderAdministrador, UsuarioNoEncontrado, type ErrorAdministracion } from "./dominio/errores";
import { ErroresAdministracionFilter } from "./errores-administracion.filter";

function responder(error: ErrorAdministracion) {
  const respuesta = { estado: 0, cuerpo: {} as unknown };
  const res = {
    status(estado: number) {
      respuesta.estado = estado;
      return this;
    },
    json(cuerpo: unknown) {
      respuesta.cuerpo = cuerpo;
    },
  };
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
  new ErroresAdministracionFilter().catch(error, host);
  return respuesta;
}

describe("ErroresAdministracionFilter", () => {
  it.each([
    [new UsuarioNoEncontrado("u1"), 404],
    [new NoSePuedeSuspenderAdministrador(), 403],
    [new CuentaYaSuspendida(), 409],
    [new CuentaNoSuspendida(), 409],
    [new MotivoInvalido(), 400],
    [new ConsultaInvalida("página"), 400],
  ])("%s → %i con { codigo, mensaje }", (error, estado) => {
    const respuesta = responder(error);

    expect(respuesta.estado).toBe(estado);
    expect(respuesta.cuerpo).toEqual({ codigo: error.codigo, mensaje: error.message });
  });
});
