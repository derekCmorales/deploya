import { ClonFallido, DespliegueCancelado } from "../../modules/construccion/dominio/errores";
import { execSync } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("una cancelación antes de clonar lanza DespliegueCancelado y no deja carpeta", async () => {
    const trabajo = await mkdtemp(join(tmpdir(), "deploya-prueba-"));
    const controlador = new AbortController();
    controlador.abort();
    try {
      const promesa = new ClonadorGit(trabajo).clonar({
        url: "https://github.com/derekCmorales/hola-deploya",
        rama: "main",
        despliegueId: "d1",
        senal: controlador.signal,
      });

      await expect(promesa).rejects.toThrow(DespliegueCancelado);
      await expect(readFile(join(trabajo, "d1", "Dockerfile"))).rejects.toThrow();
    } finally {
      await rm(trabajo, { recursive: true, force: true });
    }
  });

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

  describe("con un git que se cuelga (proceso real, sin red)", () => {
    const URL = "https://github.com/derekCmorales/hola-deploya";
    /** `[s]` evita que pgrep se cuente a sí mismo (su línea de comandos lleva el patrón). */
    const procesosVivos = (marca: string): number => Number(execSync(`pgrep -fc "[s]leep ${marca}" || true`).toString().trim());

    async function gitColgado(carpeta: string, marca: string): Promise<string> {
      const ruta = join(carpeta, "git-falso.sh");
      // Como `git clone`: el proceso padre espera a un ayudante de larga vida (git-remote-https).
      await writeFile(ruta, `#!/bin/sh\nsleep ${marca} &\nwait\n`, "utf8");
      await chmod(ruta, 0o755);
      return ruta;
    }

    it("cancelar mata el grupo de procesos, no solo a git, y lanza DespliegueCancelado", async () => {
      const carpeta = await mkdtemp(join(tmpdir(), "deploya-git-"));
      const marca = `31.${process.pid % 1000}`;
      try {
        const clonador = new ClonadorGit(carpeta, await gitColgado(carpeta, marca));
        const controlador = new AbortController();

        const promesa = clonador.clonar({ url: URL, rama: "main", despliegueId: "d1", senal: controlador.signal });
        await new Promise((r) => setTimeout(r, 300));
        expect(procesosVivos(marca)).toBeGreaterThanOrEqual(1);
        controlador.abort();

        await expect(promesa).rejects.toThrow(DespliegueCancelado);
        await new Promise((r) => setTimeout(r, 200));
        expect(procesosVivos(marca)).toBe(0);
        await expect(readFile(join(carpeta, "d1", "Dockerfile"))).rejects.toThrow();
      } finally {
        await rm(carpeta, { recursive: true, force: true });
      }
    });

    it("un git que sale con error deja ClonFallido con la última línea de stderr", async () => {
      const carpeta = await mkdtemp(join(tmpdir(), "deploya-git-"));
      try {
        const ruta = join(carpeta, "git-roto.sh");
        await writeFile(ruta, "#!/bin/sh\necho 'trabajando' >&2\necho 'fatal: Remote branch nope not found' >&2\nexit 128\n", "utf8");
        await chmod(ruta, 0o755);

        const promesa = new ClonadorGit(carpeta, ruta).clonar({ url: URL, rama: "nope", despliegueId: "d2" });

        await expect(promesa).rejects.toThrow(ClonFallido);
        await expect(promesa).rejects.toThrow("fatal: Remote branch nope not found");
      } finally {
        await rm(carpeta, { recursive: true, force: true });
      }
    });

    it("un git que no existe es ClonFallido, no una excepción sin nombre", async () => {
      const promesa = new ClonadorGit(tmpdir(), "/no/existe/git").clonar({ url: URL, rama: "main", despliegueId: "d3" });

      await expect(promesa).rejects.toThrow(ClonFallido);
    });

    it("un git que termina bien devuelve el commit que leyó", async () => {
      const carpeta = await mkdtemp(join(tmpdir(), "deploya-git-"));
      try {
        const ruta = join(carpeta, "git-bueno.sh");
        await writeFile(ruta, "#!/bin/sh\nprintf 'a1b2c3d\\037feat: demo\\037Derek\\n'\n", "utf8");
        await chmod(ruta, 0o755);

        const clon = await new ClonadorGit(carpeta, ruta).clonar({ url: URL, rama: "main", despliegueId: "d4" });

        expect(clon.commit).toEqual({ sha: "a1b2c3d", mensaje: "feat: demo", autor: "Derek" });
      } finally {
        await rm(carpeta, { recursive: true, force: true });
      }
    });
  });
});
