import { saltosDeProxy } from "./proxy-de-confianza";

describe("saltosDeProxy", () => {
  it("toma los saltos de PROXIES_DE_CONFIANZA", () => {
    expect(saltosDeProxy({ PROXIES_DE_CONFIANZA: "1" })).toBe(1);
  });

  it("sin la variable o con un valor que no es un entero positivo, no confía en ningún proxy", () => {
    expect(saltosDeProxy({})).toBe(0);
    expect(saltosDeProxy({ PROXIES_DE_CONFIANZA: "si" })).toBe(0);
    expect(saltosDeProxy({ PROXIES_DE_CONFIANZA: "-1" })).toBe(0);
    expect(saltosDeProxy({ PROXIES_DE_CONFIANZA: "1.5" })).toBe(0);
  });
});
