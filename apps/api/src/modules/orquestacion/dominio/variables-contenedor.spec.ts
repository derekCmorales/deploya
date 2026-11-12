import { fusionarVariables, textoInyeccion } from "./variables-contenedor";

describe("fusionarVariables (recursos de datos → contenedor)", () => {
  it("cuenta solo lo que Deploya puso: una base pisada por el usuario no cuenta", () => {
    const resultado = fusionarVariables({ REDIS_URL: "mia" }, { base: { REDIS_URL: "r", X: "1" }, prefijadas: { DEPLOYA_REDIS_URL: "r" } });

    expect(resultado).toEqual({ variables: { X: "1", REDIS_URL: "mia", DEPLOYA_REDIS_URL: "r" }, inyectadas: 2 });
  });

  it("una sola variable va en singular", () => {
    expect(textoInyeccion(["Redis 7"], 1)).toBe("Recursos de datos conectados: Redis 7 · 1 variable inyectada");
  });
});
