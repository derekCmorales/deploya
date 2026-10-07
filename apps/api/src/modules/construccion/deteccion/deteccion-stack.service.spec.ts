import { LectorFuenteMemoria } from "../../../adapters/stubs/clonador.stub";
import { StackNoReconocido } from "../dominio/errores";
import { DeteccionStackService } from "./deteccion-stack.service";
import { recetasEnOrden } from "./recetas-stack";
import { RecetaStack } from "./receta-stack";

const paquete = (scripts: Record<string, string>) => JSON.stringify({ name: "app", scripts });

function detectarEn(archivos: Record<string, string>, rutaDockerfile?: string) {
  const servicio = new DeteccionStackService(recetasEnOrden());
  return servicio.detectar(new LectorFuenteMemoria(new Map(Object.entries(archivos))), rutaDockerfile);
}

class LectorQueRegistra extends LectorFuenteMemoria {
  readonly leidos: string[] = [];

  async leer(ruta: string): Promise<string | null> {
    this.leidos.push(ruta);
    return super.leer(ruta);
  }
}

describe("DeteccionStackService (M4-03)", () => {
  it("El Dockerfile manda", async () => {
    const resultado = await detectarEn({ Dockerfile: "FROM node:22\nEXPOSE 3000/tcp 8080\n", "package.json": paquete({ start: "node ." }) });

    expect(resultado).toEqual(
      expect.objectContaining({ receta: "dockerfile", puertoSugerido: 3000, dockerfile: null, evidencia: ["Dockerfile"] }),
    );
  });

  it("El Dockerfile manda: sin EXPOSE el puerto sugerido es 8080", async () => {
    expect((await detectarEn({ Dockerfile: "FROM nginx\n# EXPOSE 99\n" })).puertoSugerido).toBe(8080);
  });

  it("Proyecto Node sin Dockerfile", async () => {
    const resultado = await detectarEn({ "package.json": paquete({ start: "node server.js" }) });

    expect(resultado.receta).toBe("node");
    expect(resultado.descripcion).toBe("Node.js 22 · npm start");
    expect(resultado.evidencia).toContain("package.json");
    expect(resultado.puertoSugerido).toBe(8080);
    expect(resultado.dockerfile).toContain("RUN npm install");
  });

  it("Node con lockfile y script build usa npm ci y npm run build", async () => {
    const resultado = await detectarEn({ "package.json": paquete({ start: "node dist", build: "tsc" }), "package-lock.json": "{}" });

    expect(resultado.evidencia).toEqual(["package.json", "package-lock.json"]);
    expect(resultado.dockerfile).toContain("RUN npm ci");
    expect(resultado.dockerfile).toContain("RUN npm run build");
  });

  it("Proyecto Python sin Dockerfile", async () => {
    const resultado = await detectarEn({ "requirements.txt": "flask\n", "main.py": "print('hola')" });

    expect(resultado.receta).toBe("python");
    expect(resultado.descripcion).toBe("Python 3.12 · python main.py");
    expect(resultado.dockerfile).toContain('CMD ["python", "main.py"]');
  });

  it("Python con gunicorn en requisitos arranca con gunicorn sobre app.py", async () => {
    const resultado = await detectarEn({ "requirements.txt": "flask\ngunicorn==22.0\n", "app.py": "app = None" });

    expect(resultado.dockerfile).toContain('CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]');
  });

  it("Python con pyproject.toml instala el paquete", async () => {
    const resultado = await detectarEn({ "pyproject.toml": "[project]\nname='x'\n", "main.py": "" });

    expect(resultado.dockerfile).toContain("RUN pip install --no-cache-dir .");
  });

  it("Proyecto Go sin Dockerfile", async () => {
    const resultado = await detectarEn({ "go.mod": "module ejemplo\n\ngo 1.23\n" });

    expect(resultado.receta).toBe("go");
    expect(resultado.dockerfile).toContain("CGO_ENABLED=0 go build");
  });

  it("Sitio estático", async () => {
    const resultado = await detectarEn({ "index.html": "<h1>hola</h1>", "estilos.css": "" });

    expect(resultado.receta).toBe("estatica");
    expect(resultado.puertoSugerido).toBe(8080);
    expect(resultado.dockerfile).toContain("FROM nginxinc/nginx-unprivileged:alpine");
  });

  it("Stack no reconocido", async () => {
    const error = await detectarEn({ "LEEME.md": "hola" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StackNoReconocido);
    expect((error as StackNoReconocido).message).toBe("falta Dockerfile y no se reconoce el stack");
  });

  it("Node sin script start", async () => {
    const error = await detectarEn({ "package.json": paquete({ test: "jest" }) }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StackNoReconocido);
    expect((error as StackNoReconocido).pista).toBe("agrega un script start o un Dockerfile");
  });

  it("Python sin main.py ni app.py da su pista", async () => {
    const error = await detectarEn({ "requirements.txt": "flask" }).catch((e: unknown) => e);

    expect((error as StackNoReconocido).pista).toBe("agrega main.py o app.py en la raíz, o un Dockerfile");
  });

  it("un package.json que no es JSON válido no se reconoce", async () => {
    await expect(detectarEn({ "package.json": "{ roto" })).rejects.toThrow(StackNoReconocido);
  });

  it("lee solo los archivos que declaran las recetas, una vez cada uno", async () => {
    const lector = new LectorQueRegistra(new Map([["go.mod", "module x"]]));

    await new DeteccionStackService(recetasEnOrden()).detectar(lector);

    const declarados = recetasEnOrden().flatMap((r) => r.archivosQueLee);
    expect([...lector.leidos].sort()).toEqual([...new Set(declarados)].sort());
  });

  it("respeta el orden: con go.mod e index.html gana Go", async () => {
    expect((await detectarEn({ "go.mod": "module x", "index.html": "" })).receta).toBe("go");
  });

  it("busca el Dockerfile en la rutaDockerfile del proyecto", async () => {
    const resultado = await detectarEn({ "docker/Dockerfile": "FROM alpine\nEXPOSE 5000\n" }, "docker/Dockerfile");

    expect(resultado).toEqual(expect.objectContaining({ receta: "dockerfile", puertoSugerido: 5000 }));
  });
});

describe("Plantillas de las recetas", () => {
  const archivosQueActivan: Record<string, Record<string, string>> = {
    node: { "package.json": paquete({ start: "node ." }) },
    python: { "requirements.txt": "flask", "main.py": "" },
    go: { "go.mod": "module x" },
    estatica: { "index.html": "" },
  };
  const conPlantilla = recetasEnOrden().filter((receta: RecetaStack) => receta.receta !== "dockerfile");

  it.each(conPlantilla.map((r) => [r.receta, r] as const))("%s escucha en PORT=8080 y corre con un USER sin privilegios", (receta, estrategia) => {
    const dockerfile = estrategia.dockerfile(archivosQueActivan[receta]) ?? "";

    expect(dockerfile).toContain("ENV PORT=8080");
    expect(dockerfile).toMatch(/^USER (node|10001|101|nonroot:nonroot)$/m);
    expect(dockerfile.trimEnd().split("\n").reverse().find((l) => l.startsWith("USER "))).not.toBe("USER root");
  });
});
