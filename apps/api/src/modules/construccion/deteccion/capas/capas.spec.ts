import { DockerfileBase, textoDockerfile } from "../dockerfile-receta";
import { capasComunes } from "./capas-comunes";
import { ConEtiqueta } from "./con-etiqueta";
import { ConPuertoDeploya } from "./con-puerto-deploya";
import { ConUsuarioSinPrivilegios } from "./con-usuario-sin-privilegios";
import { etiquetasDelDespliegue } from "./etiquetas-despliegue";

const base = () => new DockerfileBase("Go 1.23", ["FROM golang:1.23-alpine", 'ENTRYPOINT ["/app"]']);

describe("Capas del Dockerfile generado (Decorator)", () => {
  it("ConPuertoDeploya delega en la base y agrega PORT y EXPOSE al final", () => {
    const dockerfile = new ConPuertoDeploya(base());

    expect(dockerfile.instrucciones()).toEqual(["FROM golang:1.23-alpine", 'ENTRYPOINT ["/app"]', "ENV PORT=8080", "EXPOSE 8080"]);
    expect(dockerfile.descripcion()).toBe("Go 1.23 · puerto 8080");
  });

  it("ConUsuarioSinPrivilegios agrega el USER final", () => {
    const dockerfile = new ConUsuarioSinPrivilegios(base(), "nonroot:nonroot");

    expect(dockerfile.instrucciones().at(-1)).toBe("USER nonroot:nonroot");
    expect(dockerfile.descripcion()).toBe("Go 1.23 · usuario nonroot:nonroot");
  });

  it("las capas se apilan: cada una envuelve a otra y acumula su comportamiento", () => {
    const dockerfile = new ConEtiqueta(new ConUsuarioSinPrivilegios(new ConPuertoDeploya(base()), "10001"), "deploya.proyecto", "mi-api");

    expect(dockerfile.instrucciones().slice(2)).toEqual(["ENV PORT=8080", "EXPOSE 8080", "USER 10001", 'LABEL deploya.proyecto="mi-api"']);
    expect(dockerfile.descripcion()).toBe("Go 1.23 · puerto 8080 · usuario 10001 · etiqueta proyecto");
  });

  it("la misma capa se aplica dos veces sin crear otra clase", () => {
    const dockerfile = new ConEtiqueta(new ConEtiqueta(base(), "a.uno", "1"), "a.dos", "2");

    expect(dockerfile.instrucciones().filter((linea) => linea.startsWith("LABEL"))).toEqual(['LABEL a.uno="1"', 'LABEL a.dos="2"']);
  });

  it("Un valor de etiqueta con comillas", () => {
    const dockerfile = new ConEtiqueta(base(), "deploya.nota", 'dice "hola" en C:\\app');

    expect(dockerfile.instrucciones().at(-1)).toBe('LABEL deploya.nota="dice \\"hola\\" en C:\\\\app"');
  });

  it("la base no cambia al decorarla", () => {
    const original = base();

    textoDockerfile(new ConPuertoDeploya(original));

    expect(original.instrucciones()).toHaveLength(2);
  });
});

describe("capasComunes", () => {
  it("aplica puerto y luego usuario cuando la receta lo declara", () => {
    expect(capasComunes(base(), "nonroot:nonroot").descripcion()).toBe("Go 1.23 · puerto 8080 · usuario nonroot:nonroot");
  });

  it("sin usuarioFinal no agrega USER", () => {
    const dockerfile = capasComunes(base(), null);

    expect(dockerfile.instrucciones().some((linea) => linea.startsWith("USER"))).toBe(false);
    expect(dockerfile.descripcion()).toBe("Go 1.23 · puerto 8080");
  });
});

describe("etiquetasDelDespliegue", () => {
  it("agrega revisión, fuente y proyecto en ese orden", () => {
    const dockerfile = etiquetasDelDespliegue(base(), { sha: "a1b2c3d", urlRepositorio: "https://github.com/ana/mi-api", subdominio: "mi-api" });

    expect(dockerfile.instrucciones().slice(2)).toEqual([
      'LABEL org.opencontainers.image.revision="a1b2c3d"',
      'LABEL org.opencontainers.image.source="https://github.com/ana/mi-api"',
      'LABEL deploya.proyecto="mi-api"',
    ]);
    expect(dockerfile.descripcion()).toBe("Go 1.23 · etiqueta revision · etiqueta source · etiqueta proyecto");
  });
});
