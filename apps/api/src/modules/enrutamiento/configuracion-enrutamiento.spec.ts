import { configuracionEnrutamientoDesde } from "./configuracion-enrutamiento";

describe("ConfiguracionEnrutamiento (M6-02)", () => {
  it("Desarrollo sin TLS: sin variables es localhost, http y sin resolvedor", () => {
    expect(configuracionEnrutamientoDesde({})).toEqual({ dominioBase: "localhost", esquema: "http", certResolver: null });
  });

  it("el VPS lo pide con DOMINIO_BASE, ESQUEMA_PUBLICO y CERT_RESOLVER", () => {
    expect(configuracionEnrutamientoDesde({ DOMINIO_BASE: "deploya.app", ESQUEMA_PUBLICO: "https", CERT_RESOLVER: "letsencrypt" })).toEqual({
      dominioBase: "deploya.app",
      esquema: "https",
      certResolver: "letsencrypt",
    });
  });

  it("con resolvedor y sin esquema, https", () => {
    expect(configuracionEnrutamientoDesde({ DOMINIO_BASE: "deploya.app", CERT_RESOLVER: "letsencrypt" }).esquema).toBe("https");
  });

  it("los nombres del Avance 2 (DOMINIO_APPS, ESQUEMA_APPS) siguen valiendo y los nuevos mandan", () => {
    expect(configuracionEnrutamientoDesde({ DOMINIO_APPS: "demo.test", ESQUEMA_APPS: "http" })).toEqual({
      dominioBase: "demo.test",
      esquema: "http",
      certResolver: null,
    });
    expect(configuracionEnrutamientoDesde({ DOMINIO_APPS: "viejo.test", DOMINIO_BASE: "nuevo.test" }).dominioBase).toBe("nuevo.test");
  });

  it("valores vacíos o con espacios se tratan como ausentes", () => {
    expect(configuracionEnrutamientoDesde({ DOMINIO_BASE: " ", CERT_RESOLVER: "  ", ESQUEMA_PUBLICO: "" })).toEqual({
      dominioBase: "localhost",
      esquema: "http",
      certResolver: null,
    });
  });
});
