import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configuracionRuta, EnrutamientoTraefikArchivo, RutaInvalida } from "./enrutamiento-traefik-archivo";

const ruta = { subdominio: "hola-deploya", host: "deploya-hola-deploya-1", puerto: 8080 };

describe("EnrutamientoTraefikArchivo", () => {
  let directorio: string;
  beforeEach(async () => {
    directorio = await mkdtemp(join(tmpdir(), "traefik-"));
  });
  afterEach(async () => {
    await rm(directorio, { recursive: true, force: true });
  });

  it("Publicación: escribe la ruta Host(subdominio.localhost) hacia el contenedor y devuelve la URL", async () => {
    const enrutamiento = new EnrutamientoTraefikArchivo({ directorio, dominio: "localhost", esquema: "http" });

    const { url } = await enrutamiento.publicar(ruta);

    expect(url).toBe("http://hola-deploya.localhost");
    const contenido = await readFile(join(directorio, "hola-deploya.yml"), "utf8");
    expect(contenido).toContain('rule: "Host(`hola-deploya.localhost`)"');
    expect(contenido).toContain('- url: "http://deploya-hola-deploya-1:8080"');
  });

  it("conmutar reescribe el mismo archivo hacia el contenedor nuevo", async () => {
    const enrutamiento = new EnrutamientoTraefikArchivo({ directorio, dominio: "localhost", esquema: "http" });
    await enrutamiento.publicar(ruta);

    await enrutamiento.publicar({ ...ruta, host: "deploya-hola-deploya-2" });

    expect(await readFile(join(directorio, "hola-deploya.yml"), "utf8")).toContain("deploya-hola-deploya-2:8080");
  });

  it("retirar borra la ruta del proyecto", async () => {
    const enrutamiento = new EnrutamientoTraefikArchivo({ directorio, dominio: "localhost", esquema: "http" });
    await enrutamiento.publicar(ruta);

    await enrutamiento.retirar("hola-deploya");

    await expect(stat(join(directorio, "hola-deploya.yml"))).rejects.toThrow();
  });

  it("rechaza subdominios que no son una etiqueta DNS (evita inyectar reglas)", async () => {
    const enrutamiento = new EnrutamientoTraefikArchivo({ directorio, dominio: "localhost", esquema: "http" });

    await expect(enrutamiento.publicar({ ...ruta, subdominio: "x`) || Host(`otro" })).rejects.toThrow(RutaInvalida);
  });

  it("en el VPS usa https y el dominio real", () => {
    expect(configuracionRuta(ruta, "deploya.app")).toContain("Host(`hola-deploya.deploya.app`)");
  });
});
