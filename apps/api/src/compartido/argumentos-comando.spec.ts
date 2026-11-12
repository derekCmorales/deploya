import { argumentosDeComando, ComandoMalFormado } from "./argumentos-comando";

describe("argumentosDeComando (comandoInicio sin shell)", () => {
  it("Comando de inicio con comillas: parte en argumentos respetando comillas simples y dobles", () => {
    expect(argumentosDeComando(`node dist/main.js --nombre "mi app" --modo 'a b'`)).toEqual([
      "node",
      "dist/main.js",
      "--nombre",
      "mi app",
      "--modo",
      "a b",
    ]);
  });

  it("separa por espacios repetidos, tabuladores y saltos de línea", () => {
    expect(argumentosDeComando("  node\t dist/worker-optimizer.main.js \n")).toEqual(["node", "dist/worker-optimizer.main.js"]);
  });

  it("no interpreta nada del shell: $VAR, tuberías y ; llegan como texto", () => {
    expect(argumentosDeComando("sh -c 'echo $HOME | wc; ls'")).toEqual(["sh", "-c", "echo $HOME | wc; ls"]);
  });

  it("une partes con y sin comillas en un solo argumento y conserva el argumento vacío", () => {
    expect(argumentosDeComando(`--a="x y"z ""`)).toEqual(["--a=x yz", ""]);
  });

  it("escapa comillas dentro de dobles y con barra fuera de comillas", () => {
    expect(argumentosDeComando(String.raw`echo "di \"hola\"" a\ b`)).toEqual(["echo", 'di "hola"', "a b"]);
  });

  it("en comillas simples la barra es literal", () => {
    expect(argumentosDeComando(String.raw`echo 'a\b'`)).toEqual(["echo", String.raw`a\b`]);
  });

  it("devuelve una lista vacía para un texto en blanco", () => {
    expect(argumentosDeComando("   ")).toEqual([]);
  });

  it("Comando con comilla sin cerrar: lanza ComandoMalFormado", () => {
    expect(() => argumentosDeComando(`node "dist/main.js`)).toThrow(ComandoMalFormado);
  });
});
