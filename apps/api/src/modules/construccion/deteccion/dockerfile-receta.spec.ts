import { DockerfileBase, textoDockerfile } from "./dockerfile-receta";

describe("DockerfileBase", () => {
  const base = new DockerfileBase("Go 1.23", ["FROM golang:1.23-alpine", 'ENTRYPOINT ["/app"]']);

  it("devuelve sus líneas y su nombre", () => {
    expect(base.instrucciones()).toEqual(["FROM golang:1.23-alpine", 'ENTRYPOINT ["/app"]']);
    expect(base.descripcion()).toBe("Go 1.23");
  });

  it("el texto une las instrucciones y termina en salto de línea", () => {
    expect(textoDockerfile(base)).toBe('FROM golang:1.23-alpine\nENTRYPOINT ["/app"]\n');
  });
});
