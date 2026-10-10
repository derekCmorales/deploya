import { VariableIlegible } from "../dominio/errores";
import { CifradorAesGcm, cifradorDesdeEntorno } from "./cifrador-aes-gcm";

const CLAVE = "deploya-dev-clave-variables-032b";

describe("CifradorAesGcm", () => {
  const cifrador = new CifradorAesGcm(CLAVE);

  it("cifrado de ida y vuelta", () => {
    expect(cifrador.descifrar(cifrador.cifrar("hola"))).toBe("hola");
  });

  it("IV distinto en cada cifrado", () => {
    const uno = cifrador.cifrar("hola");
    const otro = cifrador.cifrar("hola");
    expect(uno.startsWith("v1:")).toBe(true);
    expect(uno).not.toBe(otro);
    expect(uno).not.toContain("hola");
  });

  it("valor alterado → VariableIlegible", () => {
    const cifrado = cifrador.cifrar("hola");
    const alterado = `${cifrado.slice(0, -2)}aa`;
    expect(() => cifrador.descifrar(alterado)).toThrow(VariableIlegible);
    expect(() => cifrador.descifrar("v0:aa:bb:cc")).toThrow(VariableIlegible);
  });

  it("clave de largo incorrecto rechazada", () => {
    expect(() => new CifradorAesGcm("corta")).toThrow(/32 bytes/);
    expect(() => cifradorDesdeEntorno({ NODE_ENV: "production" })).toThrow(/32 bytes/);
    expect(cifradorDesdeEntorno({ NODE_ENV: "test" }).cifrar("x").startsWith("v1:")).toBe(true);
    const real = cifradorDesdeEntorno({ CLAVE_CIFRADO_VARIABLES: CLAVE, NODE_ENV: "production" });
    expect(real.descifrar(real.cifrar("hola"))).toBe("hola");
  });
});
