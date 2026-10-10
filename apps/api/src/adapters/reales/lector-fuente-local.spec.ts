import { LectorFuenteLocal, type LeerArchivo } from "./lector-fuente-local";

function sistemaFalso(archivos: Record<string, string>): { leer: LeerArchivo; pedidos: string[] } {
  const pedidos: string[] = [];
  const leer: LeerArchivo = async (ruta) => {
    pedidos.push(ruta);
    const rutaNorm = ruta.replace(/\\/g, "/");
    for (const [key, val] of Object.entries(archivos)) {
      const keyNorm = key.replace(/\\/g, "/");
      // Coincidencia exacta o ruta termina exactamente en la clave simulada (ej: /clon/package.json)
      if (rutaNorm === keyNorm || rutaNorm.endsWith(keyNorm)) {
        return val;
      }
    }
    throw Object.assign(new Error("no existe"), { code: "ENOENT" });
  };
  return { leer, pedidos };
}

describe("LectorFuenteLocal", () => {
  it("lee un archivo del clon y devuelve null si no existe", async () => {
    const { leer } = sistemaFalso({ "/clon/package.json": "{}" });
    const lector = new LectorFuenteLocal("/clon", leer);

    expect(await lector.leer("package.json")).toBe("{}");
    expect(await lector.leer("go.mod")).toBeNull();
    expect(await lector.existe("package.json")).toBe(true);
    expect(await lector.existe("go.mod")).toBe(false);
  });

  it("nunca lee fuera del directorio del clon", async () => {
    const { leer, pedidos } = sistemaFalso({ "/etc/passwd": "root" });
    const lector = new LectorFuenteLocal("/clon", leer);

    expect(await lector.leer("../etc/passwd")).toBeNull();
    expect(pedidos).toHaveLength(0);
  });

  it("propaga los errores que no son «no existe»", async () => {
    const leer: LeerArchivo = async () => {
      throw Object.assign(new Error("permiso denegado"), { code: "EACCES" });
    };

    await expect(new LectorFuenteLocal("/clon", leer).leer("Dockerfile")).rejects.toThrow("permiso denegado");
  });
});
