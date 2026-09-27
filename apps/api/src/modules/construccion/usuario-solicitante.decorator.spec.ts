import { UnauthorizedException } from "@nestjs/common";
import { usuarioDe } from "./usuario-solicitante.decorator";

describe("UsuarioSolicitante", () => {
  it("usa el usuario que dejó el guard de sesión", () => {
    expect(usuarioDe({ usuario: { id: "u-1" } }, {})).toBe("u-1");
  });

  it("sin sesión responde 401", () => {
    expect(() => usuarioDe({}, {})).toThrow(UnauthorizedException);
  });

  it("en desarrollo usa USUARIO_DESARROLLO mientras no hay guard", () => {
    expect(usuarioDe({}, { USUARIO_DESARROLLO: "cliente-seed", NODE_ENV: "development" })).toBe("cliente-seed");
  });

  it("en producción ignora USUARIO_DESARROLLO y responde 401", () => {
    expect(() => usuarioDe({}, { USUARIO_DESARROLLO: "cliente-seed", NODE_ENV: "production" })).toThrow(UnauthorizedException);
  });

  it("la sesión real gana sobre el usuario de desarrollo", () => {
    expect(usuarioDe({ usuario: { id: "u-real" } }, { USUARIO_DESARROLLO: "cliente-seed" })).toBe("u-real");
  });
});
