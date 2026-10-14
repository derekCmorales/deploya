import { acmeJsonEjemplo, VENCE_EJEMPLO } from "./acme-ejemplo";
import { CertificadoAcmeArchivo, cubre } from "./certificado-acme-archivo";
import { CertificadoAusente } from "../stubs/certificado-ausente";

const enMemoria = (contenido: string) => async () => contenido;

describe("CertificadoAcmeArchivo (M6-02)", () => {
  it("Vencimiento visible: lee el notAfter del certificado comodín de un acme.json", async () => {
    const certificado = new CertificadoAcmeArchivo("/acme/acme.json", enMemoria(acmeJsonEjemplo()));

    expect(await certificado.venceEl("hola-deploya.deploya.app")).toEqual(VENCE_EJEMPLO);
    expect(VENCE_EJEMPLO.getUTCFullYear()).toBe(2036);
    expect(await certificado.venceEl("deploya.app")).toEqual(VENCE_EJEMPLO);
  });

  it("un host que el certificado no cubre no tiene vencimiento", async () => {
    const certificado = new CertificadoAcmeArchivo("/acme/acme.json", enMemoria(acmeJsonEjemplo()));

    expect(await certificado.venceEl("hola.otro.app")).toBeNull();
    expect(await certificado.venceEl("a.b.deploya.app")).toBeNull();
  });

  it("sin acme.json, vacío o ilegible es «sin certificado», no un error", async () => {
    const falla = async () => {
      throw new Error("ENOENT");
    };

    expect(await new CertificadoAcmeArchivo("/acme/acme.json", falla).venceEl("x.deploya.app")).toBeNull();
    expect(await new CertificadoAcmeArchivo("/acme/acme.json", enMemoria("")).venceEl("x.deploya.app")).toBeNull();
    expect(await new CertificadoAcmeArchivo("/acme/acme.json", enMemoria("{}")).venceEl("x.deploya.app")).toBeNull();
    expect(await new CertificadoAcmeArchivo("/acme/acme.json", enMemoria('{"letsencrypt":null}')).venceEl("x.deploya.app")).toBeNull();
  });

  it("un certificado corrupto no tumba la consulta", async () => {
    const corrupto = JSON.stringify({ le: { Certificates: [{ domain: { main: "deploya.app", sans: ["*.deploya.app"] }, certificate: "bm8gZXMgdW4gY2VydA==" }] } });

    expect(await new CertificadoAcmeArchivo("/acme/acme.json", enMemoria(corrupto)).venceEl("x.deploya.app")).toBeNull();
  });

  it("Desarrollo sin TLS: CertificadoAusente cumple el mismo contrato y devuelve null", async () => {
    expect(await new CertificadoAusente().venceEl()).toBeNull();
    expect(Object.getOwnPropertyNames(CertificadoAusente.prototype)).toEqual(expect.arrayContaining(["venceEl"]));
    expect(Object.getOwnPropertyNames(CertificadoAcmeArchivo.prototype)).toEqual(expect.arrayContaining(["venceEl"]));
  });

  describe("cubre", () => {
    it.each([
      ["deploya.app", ["deploya.app"], true],
      ["x.deploya.app", ["*.deploya.app"], true],
      ["a.b.deploya.app", ["*.deploya.app"], false],
      ["deploya.app", ["*.deploya.app"], false],
      ["xdeploya.app", ["*.deploya.app"], false],
      ["x.deploya.app", [undefined, "otro.app"], false],
    ])("%s con %j → %s", (host, dominios, esperado) => {
      expect(cubre(host, dominios)).toBe(esperado);
    });
  });
});
