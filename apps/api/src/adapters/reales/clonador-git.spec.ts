import { ClonFallido } from "../../modules/construccion/dominio/errores";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ClonadorGit } from "./clonador-git";
import { LectorFuenteLocal } from "./lector-fuente-local";

describe("ClonadorGit", () => {
  it.each(["file:///etc", "git@github.com:a/b.git", "--upload-pack=touch /tmp/x", "http://github.com/a/b"])(
    "rechaza %s antes de ejecutar git: solo https públicos",
    async (url) => {
      await expect(new ClonadorGit("/tmp/deploya").clonar({ url, rama: "main", despliegueId: "d" })).rejects.toThrow(ClonFallido);
    },
  );

  it("escribe Dockerfile.deploya dentro del clon y no fuera de él", async () => {
    const directorio = await mkdtemp(join(tmpdir(), "deploya-prueba-"));
    const clonador = new ClonadorGit(tmpdir());
    try {
      await clonador.escribir(directorio, "Dockerfile.deploya", "FROM alpine\n");

      expect(await readFile(join(directorio, "Dockerfile.deploya"), "utf8")).toBe("FROM alpine\n");
      await expect(clonador.escribir(directorio, "../fuera", "x")).rejects.toThrow(ClonFallido);
      expect(clonador.lector(directorio)).toBeInstanceOf(LectorFuenteLocal);
    } finally {
      await rm(directorio, { recursive: true, force: true });
    }
  });
});
