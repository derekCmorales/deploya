import { RepositorioProyectosMemoria } from "../../adapters/memoria/repositorio-proyectos.memoria";
import { RepositorioVariablesMemoria } from "../../adapters/memoria/repositorio-variables.memoria";
import { RelojFijo } from "../../compartido/reloj";
import type { ConstruccionService } from "../construccion/construccion.service";
import { DeteccionStackService } from "../construccion/deteccion/deteccion-stack.service";
import { recetasEnOrden } from "../construccion/deteccion/recetas-stack";
import { LectorFuente } from "../construccion/puertos/lector-fuente.puerto";
import { AccionesProyectoService } from "../orquestacion/acciones/acciones-proyecto.service";
import { BloqueosService } from "../orquestacion/bloqueos.service";
import { CuotaConstruccionesAgotada, SuscripcionNoPermite } from "../orquestacion/dominio/errores";
import { CUOTA_SANDBOX } from "./adaptadores/cuota-proyectos.stub";
import { CifradorFalso } from "./adaptadores/cifrador-falso";
import {
  ClaveInvalida,
  ConfirmacionNoCoincide,
  LimiteProyectosAlcanzado,
  ProyectoNoEncontrado,
  RepositorioNoAccesible,
  RepositorioSinDockerfile,
  StackNoReconocidoEnAlta,
  SubdominioEnUso,
} from "./dominio/errores";
import type { AltaProyecto, ConsultaRepositorio, ValidacionRepositorio } from "./dominio/proyecto";
import { ProyectosService } from "./proyectos.service";
import { CuotaProyectosPuerto, type CuotaProyectos } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { VariablesProyectoService } from "./servicios/variables-proyecto.service";

const URL = "https://github.com/derekCmorales/hola-deploya";

class LectorMapa extends LectorFuente {
  constructor(private readonly archivos: Map<string, string>) {
    super();
  }

  async existe(ruta: string): Promise<boolean> {
    return this.archivos.has(ruta);
  }

  async leer(ruta: string): Promise<string | null> {
    return this.archivos.get(ruta) ?? null;
  }
}

const DOCKERFILE = "FROM node\nEXPOSE 3000";

class FuenteDoble extends ProveedorFuente {
  error: Error | null = null;
  archivos = new Map<string, string>([["Dockerfile", DOCKERFILE]]);
  readonly consultas: ConsultaRepositorio[] = [];

  async validar(consulta: ConsultaRepositorio): Promise<ValidacionRepositorio> {
    this.consultas.push(consulta);
    if (this.error) throw this.error;
    const dockerfile = this.archivos.get("Dockerfile") ?? null;
    return {
      accesible: true,
      urlNormalizada: URL,
      repositorio: "derekCmorales/hola-deploya",
      rama: consulta.rama,
      ramas: ["main"],
      commit: { sha: "a1b2c3d", mensaje: "feat: hola", autor: "Derek", fecha: "2026-09-29T10:00:00Z" },
      dockerfile,
      puerto: 3000,
    };
  }

  lector(): LectorFuente {
    return new LectorMapa(this.archivos);
  }
}

class BloqueosDoble {
  error: Error | null = null;

  async verificar(): Promise<void> {
    if (this.error) throw this.error;
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
  const acciones = { pedirEliminacion: jest.fn(async () => undefined) };
  const variables = new VariablesProyectoService(new CifradorFalso(), new RepositorioVariablesMemoria(reloj), repositorio);
  const bloqueos = new BloqueosDoble();
  const servicio = new ProyectosService(
    fuente,
    repositorio,
    cuota,
    construccion as unknown as ConstruccionService,
    acciones as unknown as AccionesProyectoService,
    variables,
    new DeteccionStackService(recetasEnOrden()),
    bloqueos as unknown as BloqueosService,
  );
  return { servicio, fuente, reloj, repositorio, cuota, construccion, acciones, variables, bloqueos };
}

const alta = (cambios: Partial<AltaProyecto> = {}): AltaProyecto => ({ url: URL, rama: "main", nombre: "Hola Deploya", ...cambios });

describe("ProyectosService", () => {
  describe("validarRepositorio", () => {
    it("Repositorio válido", async () => {
      const { servicio } = montar();
      const validacion = await servicio.validarRepositorio({ url: URL, rama: "main" });
      expect(validacion.deteccion).toMatchObject({ receta: "dockerfile", descripcion: "Dockerfile en la raíz" });
      expect(validacion.puerto).toBe(3000);
    });

    it("Repositorio sin Dockerfile con stack reconocido", async () => {
      const { servicio, fuente } = montar();
      fuente.archivos = new Map([["package.json", JSON.stringify({ scripts: { start: "node server.js" } })]]);
      const validacion = await servicio.validarRepositorio({ url: URL, rama: "main" });
      expect(validacion.dockerfile).toBeNull();
      expect(validacion.deteccion?.nombre).toBe("Node.js 22");
      expect(validacion.puerto).toBe(8080);
    });

    it("Falta el Dockerfile y no se reconoce el stack", async () => {
      const { servicio, fuente } = montar();
      fuente.archivos = new Map([["package.json", JSON.stringify({ scripts: {} })]]);
      const error = await servicio.validarRepositorio({ url: URL, rama: "main" }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(StackNoReconocidoEnAlta);
      expect(error).toMatchObject({ rama: "main", pista: "agrega un script start o un Dockerfile" });
    });
  });

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

    it("Clave inválida en el alta no guarda el proyecto", async () => {
      const { servicio, repositorio, construccion } = montar();
      await expect(servicio.crear("usuario-1", alta({ variables: [{ clave: "saludo", valor: "hola" }] }))).rejects.toThrow(ClaveInvalida);
      expect(await repositorio.deUsuario("usuario-1")).toHaveLength(0);
      expect(construccion.crearDespliegue).not.toHaveBeenCalled();
    });

    it("Guardar y desplegar", async () => {
      const { servicio, construccion, variables } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta({ variables: [{ clave: "SALUDO", valor: "hola" }] }));
      construccion.crearDespliegue.mockClear();

      const guardado = await servicio.guardarVariables("usuario-1", proyecto.id, {
        variables: [{ clave: "SALUDO", valor: "nuevo" }],
        desplegar: true,
      });

      expect(construccion.crearDespliegue).toHaveBeenCalledWith(proyecto.id, "variables");
      expect(guardado.despliegue?.estado).toBe("encolado");
      expect(await variables.descifradasDe(proyecto.id)).toEqual({ SALUDO: "nuevo" });
      construccion.crearDespliegue.mockClear();
      await servicio.guardarVariables("usuario-1", proyecto.id, { variables: [{ clave: "SALUDO" }], desplegar: false });
      expect(construccion.crearDespliegue).not.toHaveBeenCalled();
      expect(await variables.descifradasDe(proyecto.id)).toEqual({ SALUDO: "nuevo" });
    });

    it("Guardar y desplegar con la suscripción vencida no cambia las variables", async () => {
      const { servicio, bloqueos, variables } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta({ variables: [{ clave: "SALUDO", valor: "hola" }] }));
      bloqueos.error = new SuscripcionNoPermite("vencida");
      await expect(
        servicio.guardarVariables("usuario-1", proyecto.id, { variables: [{ clave: "SALUDO", valor: "nuevo" }], desplegar: true }),
      ).rejects.toThrow(SuscripcionNoPermite);
      expect(await variables.descifradasDe(proyecto.id)).toEqual({ SALUDO: "hola" });
    });

    it("el puerto elegido por el usuario gana al de EXPOSE", async () => {
      const { servicio } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta({ puerto: 9000 }));
      expect(proyecto.puertoInterno).toBe(9000);
    });

    it("Alta con la suscripción vencida", async () => {
      const { servicio, fuente, repositorio, bloqueos } = montar();
      bloqueos.error = new SuscripcionNoPermite("vencida");
      await expect(servicio.crear("usuario-1", alta())).rejects.toThrow(SuscripcionNoPermite);
      expect(fuente.consultas).toHaveLength(0);
      expect(await repositorio.deUsuario("usuario-1")).toHaveLength(0);
    });

    it("Construcciones agotadas en el alta", async () => {
      const { servicio, repositorio, bloqueos, construccion } = montar();
      bloqueos.error = new CuotaConstruccionesAgotada(30);
      await expect(servicio.crear("usuario-1", alta())).rejects.toThrow(CuotaConstruccionesAgotada);
      expect(await repositorio.deUsuario("usuario-1")).toHaveLength(0);
      expect(construccion.crearDespliegue).not.toHaveBeenCalled();
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

    it("Proyecto fallido no cuenta: con el último despliegue fallido el usuario puede crear otro aunque esté en el límite", async () => {
      const { servicio, construccion, repositorio } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta());
      construccion.ultimosDespliegues.mockResolvedValue({ [proyecto.id]: { estado: "fallido" } });

      await expect(servicio.crear("usuario-1", alta({ nombre: "Otro proyecto" }))).resolves.toMatchObject({
        proyecto: { subdominio: "otro-proyecto" },
      });
      expect(await repositorio.deUsuario("usuario-1")).toHaveLength(2);
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

    it("Proyecto fallido no cuenta: sigue en la lista pero no suma en «usados»", async () => {
      const { servicio, construccion } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta());
      construccion.ultimosDespliegues.mockResolvedValue({ [proyecto.id]: { estado: "fallido" } });

      const lista = await servicio.listar("usuario-1");

      expect(lista.proyectos).toHaveLength(1);
      expect(lista.usados).toBe(0);
    });

    it("Solo sus proyectos: no lista los de otro usuario", async () => {
      const { servicio } = montar();
      await servicio.crear("usuario-2", alta());
      await expect(servicio.listar("usuario-1")).resolves.toMatchObject({ proyectos: [], usados: 0 });
    });
  });

  describe("eliminar", () => {
    it("Eliminar proyecto: con el nombre exacto borra el proyecto y libera el cupo del plan", async () => {
      const { servicio, repositorio } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta());
      expect((await servicio.listar("usuario-1")).usados).toBe(1);

      await servicio.eliminar("usuario-1", proyecto.id, "Hola Deploya");

      expect(await repositorio.porId(proyecto.id)).toBeNull();
      expect((await servicio.listar("usuario-1")).usados).toBe(0);
      await expect(servicio.crear("usuario-1", alta())).resolves.toMatchObject({ proyecto: { nombre: "Hola Deploya" } });
    });

    it("Eliminar pide a M5 borrar contenedor, imágenes y ruta del subdominio", async () => {
      const { servicio, acciones } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta());

      await servicio.eliminar("usuario-1", proyecto.id, "Hola Deploya");

      expect(acciones.pedirEliminacion).toHaveBeenCalledWith(expect.objectContaining({ id: proyecto.id, subdominio: "hola-deploya" }));
    });

    it("Confirmación distinta: rechaza y conserva el proyecto", async () => {
      const { servicio, repositorio, acciones } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta());

      await expect(servicio.eliminar("usuario-1", proyecto.id, "hola")).rejects.toThrow(ConfirmacionNoCoincide);
      expect(acciones.pedirEliminacion).not.toHaveBeenCalled();

      expect(await repositorio.porId(proyecto.id)).not.toBeNull();
    });

    it("Proyecto ajeno o inexistente: se trata como no encontrado y no borra nada", async () => {
      const { servicio, repositorio } = montar();
      const { proyecto } = await servicio.crear("usuario-1", alta());

      await expect(servicio.eliminar("usuario-2", proyecto.id, "Hola Deploya")).rejects.toThrow(ProyectoNoEncontrado);
      await expect(servicio.eliminar("usuario-1", "no-existe", "Hola Deploya")).rejects.toThrow(ProyectoNoEncontrado);

      expect(await repositorio.porId(proyecto.id)).not.toBeNull();
    });
  });

  it("validarRepositorio delega en el ProveedorFuente", async () => {
    const { servicio, fuente } = montar();
    await expect(servicio.validarRepositorio({ url: URL, rama: "main" })).resolves.toMatchObject({ puerto: 3000 });
    expect(fuente.consultas).toEqual([{ url: URL, rama: "main" }]);
  });
});
