import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Docker from "dockerode";
import { RelojFijo } from "../../../../compartido/reloj";
import type { PrismaService } from "../../../../compartido/prisma/prisma.service";
import { LecturaServidorDocker } from "../../../../adapters/reales/lectura-servidor-docker";
import { ReporteServidorMemoria } from "../../../../adapters/stubs/estado-compartido.memoria";
import { LecturaServidorStub } from "../../../../adapters/stubs/lectura-servidor.stub";
import { capacidadEstimada } from "../dominio/ajustes";
import { LecturaServidorPuerto } from "../puertos/reporte-servidor.puerto";
import { TareaReporteServidor } from "../tarea-reporte-servidor";
import { EstadoScriptsArchivos } from "./estado-scripts.archivos";
import { RegistroAccionesPrisma } from "./registro-acciones.prisma";
import { RepositorioInvitacionesPrisma } from "./repositorio-invitaciones.prisma";
import { TokensInvitacionCripto } from "./tokens-invitacion.cripto";

const AHORA = new Date("2026-10-24T12:00:00.000Z");
const prisma = (delegados: Record<string, Record<string, jest.Mock>>) => delegados as unknown as PrismaService;

describe("SP-18 · adaptadores de Admin · Instalación", () => {
  it("EstadoScriptsArchivos lee ultimo.json, programa.json y version.json; sin archivos, vacío", async () => {
    const directorio = await mkdtemp(join(tmpdir(), "deploya-respaldos-"));
    try {
      await expect(new EstadoScriptsArchivos(directorio).respaldo()).resolves.toEqual({
        ultimo: null,
        tamanoMb: null,
        ruta: directorio,
        programa: "diario",
        hora: "03:00",
        conserva: 7,
      });
      await writeFile(join(directorio, "ultimo.json"), JSON.stringify({ ultimo: "2026-10-24T03:00:00Z", tamanoMb: 412 }));
      await writeFile(join(directorio, "version.json"), JSON.stringify({ instalada: "v1.0.0", disponible: "v1.1.0" }));
      await writeFile(join(directorio, "programa.json"), "no es json");

      const scripts = new EstadoScriptsArchivos(directorio);

      await expect(scripts.respaldo()).resolves.toMatchObject({ ultimo: new Date("2026-10-24T03:00:00Z"), tamanoMb: 412, conserva: 7 });
      await expect(scripts.version()).resolves.toEqual({ instalada: "v1.0.0", disponible: "v1.1.0" });
    } finally {
      await rm(directorio, { recursive: true, force: true });
    }
  });

  it("invitaciones en Prisma: activas sin usar ni revocar, y marcar usada solo una vez", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const updateMany = jest.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const repo = new RepositorioInvitacionesPrisma(prisma({ invitacion: { findMany, updateMany } }));

    await repo.activas(AHORA);

    expect(findMany).toHaveBeenCalledWith({
      where: { usada: null, revocada: null, vence: { gt: AHORA } },
      orderBy: { vence: "asc" },
      select: { id: true, correo: true, vence: true },
    });
    await expect(repo.marcarUsada("inv-1", AHORA)).resolves.toBe(true);
    await expect(repo.marcarUsada("inv-1", AHORA)).resolves.toBe(false);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "inv-1", usada: null }, data: { usada: AHORA } });
  });

  it("invitaciones en Prisma: crear, buscar y revocar", async () => {
    const create = jest.fn().mockResolvedValue({ id: "inv-1" });
    const findUnique = jest.fn().mockResolvedValue(null);
    const update = jest.fn().mockResolvedValue({});
    const repo = new RepositorioInvitacionesPrisma(prisma({ invitacion: { create, findUnique, update } }));
    const nueva = { correo: "ana@miempresa.com", hashToken: "h", vence: AHORA, creadaPor: "u-admin", creado: AHORA };

    await repo.crear(nueva);
    await repo.porId("inv-1");
    await repo.porHash("h");
    await repo.revocar("inv-1", AHORA);

    expect(create).toHaveBeenCalledWith({ data: nueva });
    expect(findUnique.mock.calls).toEqual([[{ where: { id: "inv-1" } }], [{ where: { hashToken: "h" } }]]);
    expect(update).toHaveBeenCalledWith({ where: { id: "inv-1" }, data: { revocada: AHORA } });
  });

  it("las acciones sobre la instalación quedan con el administrador como afectado", async () => {
    const create = jest.fn().mockResolvedValue({});

    await new RegistroAccionesPrisma(prisma({ accionAdministrativa: { create } })).registrar({ adminId: "u-admin", accion: "cambiar-registro", detalle: "cerrado", creado: AHORA });

    expect(create).toHaveBeenCalledWith({
      data: { adminId: "u-admin", usuarioAfectadoId: "u-admin", accion: "cambiar-registro", motivo: "instalacion", detalle: "cerrado", creado: AHORA },
    });
  });

  it("tokens de invitación: 256 bits en base64url y su sha256", () => {
    const tokens = new TokensInvitacionCripto();

    expect(tokens.generar()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokens.huella("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("capacidad estimada: memoria libre menos 1 GB de deploya, por la memoria de cada proyecto", () => {
    expect([capacidadEstimada(4096, 1024), capacidadEstimada(512, 1024), capacidadEstimada(null, 1024)]).toEqual([3, 0, null]);
  });

  it("la tarea del trabajador publica el reporte al arrancar y no se cae si medir falla", async () => {
    const reportes = new ReporteServidorMemoria();
    const tarea = new TareaReporteServidor(new LecturaServidorStub(), reportes, new RelojFijo(AHORA));
    await tarea.onApplicationBootstrap();
    tarea.onModuleDestroy();

    class Rota extends LecturaServidorPuerto {
      async medir(): Promise<never> {
        throw new Error("statfs EACCES");
      }
    }

    await expect(new TareaReporteServidor(new Rota(), reportes, new RelojFijo()).reportar()).resolves.toBeUndefined();
    await expect(reportes.ultimo()).resolves.toMatchObject({ tomado: AHORA, docker: { version: "stub" } });
  });

  it("LecturaServidorDocker: versión y contenedores del proyecto de compose; Docker caído no lanza", async () => {
    const listContainers = jest.fn().mockResolvedValue([{}, {}]);
    const sano = { version: jest.fn().mockResolvedValue({ Version: "27.3.1" }), listContainers } as unknown as Docker;
    const caido = { version: jest.fn().mockRejectedValue(new Error("connect ENOENT")), listContainers } as unknown as Docker;

    const medido = await new LecturaServidorDocker(sano, tmpdir(), "deploya").medir();
    const sinDocker = await new LecturaServidorDocker(caido, tmpdir(), "deploya").medir();

    expect(medido.docker).toEqual({ version: "27.3.1", contenedores: 2 });
    expect(listContainers).toHaveBeenCalledWith({ filters: { label: ["com.docker.compose.project=deploya"] } });
    expect(medido.disco.totalGb).toBeGreaterThan(0);
    expect(sinDocker).toMatchObject({ docker: null, errorDocker: "connect ENOENT" });
  });
});
