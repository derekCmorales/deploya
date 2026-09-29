import { RepositorioProyectosMemoria } from "../../adapters/memoria/repositorio-proyectos.memoria";
import { RelojFijo } from "../../compartido/reloj";
import type { ConstruccionService } from "../construccion/construccion.service";
import { CUOTA_SANDBOX } from "./adaptadores/cuota-proyectos.stub";
import {
  LimiteProyectosAlcanzado,
  RepositorioNoAccesible,
  RepositorioSinDockerfile,
  SubdominioEnUso,
} from "./dominio/errores";
import type { AltaProyecto, ConsultaRepositorio, ValidacionRepositorio } from "./dominio/proyecto";
import { ProyectosService } from "./proyectos.service";
import { CuotaProyectosPuerto, type CuotaProyectos } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";

const URL = "https://github.com/derekCmorales/hola-deploya";

class FuenteDoble extends ProveedorFuente {
  error: Error | null = null;
  readonly consultas: ConsultaRepositorio[] = [];

  async validar(consulta: ConsultaRepositorio): Promise<ValidacionRepositorio> {
    this.consultas.push(consulta);
    if (this.error) throw this.error;
    return {
      accesible: true,
      urlNormalizada: URL,
      repositorio: "derekCmorales/hola-deploya",
      rama: consulta.rama,
      ramas: ["main"],
      commit: { sha: "a1b2c3d", mensaje: "feat: hola", autor: "Derek", fecha: "2026-09-29T10:00:00Z" },
      dockerfile: "FROM node\nEXPOSE 3000",
      puerto: 3000,
    };
  }
}

class CuotaDoble extends CuotaProyectosPuerto {
  cuota: CuotaProyectos = CUOTA_SANDBOX;

  async cuotaDe(): Promise<CuotaProyectos> {
    return this.cuota;
  }
}

function montar() {
  const fuente = new FuenteDoble();
  const reloj = new RelojFijo();
  const repositorio = new RepositorioProyectosMemoria(reloj);
  const cuota = new CuotaDoble();
  const construccion = {
    crearDespliegue: jest.fn(async () => ({ id: "despliegue-1", numero: 1, estado: "encolado" as const })),
    ultimosDespliegues: jest.fn(async (): Promise<Record<string, unknown>> => ({})),
  };
  const servicio = new ProyectosService(fuente, repositorio, cuota, construccion as unknown as ConstruccionService);
  return { servicio, fuente, reloj, repositorio, cuota, construccion };
}

const alta = (cambios: Partial<AltaProyecto> = {}): AltaProyecto => ({ url: URL, rama: "main", nombre: "Hola Deploya", ...cambios });

describe("ProyectosService", () => {
  describe("crear", () => {
    it("Desplegar: guarda el proyecto y pide el despliegue #1 encolado con disparador «alta»", async () => {
      const { servicio, repositorio, construccion } = montar();
      const { proyecto, despliegue } = await servicio.crear("usuario-1", alta());

      expect(await repositorio.porId(proyecto.id)).toEqual(proyecto);
      expect(proyecto).toMatchObject({
        usuarioId: "usuario-1",
        nombre: "Hola Deploya",
        subdominio: "hola-deploya",
        urlRepositorio: URL,
        rama: "main",
        rutaDockerfile: "Dockerfile",
        puertoInterno: 3000,
      });
      expect(construccion.crearDespliegue).toHaveBeenCalledWith(proyecto.id, "alta");
      expect(despliegue).toEqual({ id: "despliegue-1", numero: 1, estado: "encolado" });
    });

    it("el puerto elegido por el usuario gana al de EXPOSE", async () => {
      const { servicio } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta({ puerto: 9000 }));
      expect(proyecto.puertoInterno).toBe(9000);
    });

    it("Repositorio no accesible: propaga el error de 11e y no guarda nada", async () => {
      const { servicio, fuente, repositorio, construccion } = montar();
      fuente.error = new RepositorioNoAccesible(404);
      await expect(servicio.crear("usuario-1", alta())).rejects.toThrow(RepositorioNoAccesible);
      expect(await repositorio.deUsuario("usuario-1")).toHaveLength(0);
      expect(construccion.crearDespliegue).not.toHaveBeenCalled();
    });

    it("Falta el Dockerfile: propaga el error de 11e y no guarda nada", async () => {
      const { servicio, fuente, repositorio } = montar();
      fuente.error = new RepositorioSinDockerfile("main");
      await expect(servicio.crear("usuario-1", alta())).rejects.toThrow(RepositorioSinDockerfile);
      expect(await repositorio.deUsuario("usuario-1")).toHaveLength(0);
    });

    it("Límite de proyectos del plan: en Sandbox con 1 proyecto bloquea el alta sin llamar a GitHub ni al motor", async () => {
      const { servicio, fuente, construccion, repositorio } = montar();
      await servicio.crear("usuario-1", alta());
      construccion.crearDespliegue.mockClear();
      fuente.consultas.length = 0;

      await expect(servicio.crear("usuario-1", alta({ nombre: "otro" }))).rejects.toThrow(LimiteProyectosAlcanzado);
      expect(fuente.consultas).toHaveLength(0);
      expect(construccion.crearDespliegue).not.toHaveBeenCalled();
      expect(await repositorio.deUsuario("usuario-1")).toHaveLength(1);
    });

    it("Subdominio duplicado: otro usuario con el mismo nombre recibe SubdominioEnUso", async () => {
      const { servicio } = montar();
      await servicio.crear("usuario-1", alta());
      await expect(servicio.crear("usuario-2", alta())).rejects.toThrow(SubdominioEnUso);
    });
  });

  describe("listar", () => {
    it("Sin proyectos: lista vacía con el contador del plan", async () => {
      const { servicio } = montar();
      await expect(servicio.listar("usuario-1")).resolves.toEqual({
        proyectos: [],
        usados: 0,
        maximo: 1,
        plan: { nombre: "Sandbox", cpus: 0.25, memoriaMb: 256 },
      });
    });

    it("Estado del último despliegue: arma ultimoDespliegue con el motor y null si nunca se desplegó", async () => {
      const { servicio, cuota, construccion, reloj } = montar();
      cuota.cuota = { plan: "Starter", maxProyectos: 3, cpus: 0.5, memoriaMb: 512 };
      const { proyecto: primero } = await servicio.crear("usuario-1", alta({ nombre: "api" }));
      reloj.avanzar(1000);
      const { proyecto: segundo } = await servicio.crear("usuario-1", alta({ nombre: "web" }));
      const resumen = { id: "d-1", numero: 1, estado: "saludable", etapas: [], creado: "2026-09-30T12:00:00.000Z" };
      construccion.ultimosDespliegues.mockResolvedValue({ [primero.id]: resumen });

      const lista = await servicio.listar("usuario-1");

      expect(construccion.ultimosDespliegues).toHaveBeenCalledWith(expect.arrayContaining([primero.id, segundo.id]));
      expect(lista.proyectos.map((p) => [p.nombre, p.ultimoDespliegue])).toEqual([
        ["web", null],
        ["api", resumen],
      ]);
      expect(lista).toMatchObject({ usados: 2, maximo: 3, plan: { nombre: "Starter" } });
    });

    it("Solo sus proyectos: no lista los de otro usuario", async () => {
      const { servicio } = montar();
      await servicio.crear("usuario-2", alta());
      await expect(servicio.listar("usuario-1")).resolves.toMatchObject({ proyectos: [], usados: 0 });
    });
  });

  it("validarRepositorio delega en el ProveedorFuente", async () => {
    const { servicio, fuente } = montar();
    await expect(servicio.validarRepositorio({ url: URL, rama: "main" })).resolves.toMatchObject({ puerto: 3000 });
    expect(fuente.consultas).toEqual([{ url: URL, rama: "main" }]);
  });
});
