import { Espera, EsperaInstantanea } from "../../compartido/espera";
import { datosDePrueba } from "../../pruebas/datos";
import { LimiteRecursosDatos, SuscripcionBloqueada, TipoYaConectado } from "./dominio/errores";
import { verificarAltaInicial } from "./dominio/politica-recursos-datos";
import { ESPERA_MAXIMA_RECURSO_CREANDO_MS, PAUSA_RECURSO_CREANDO_MS } from "./motor-datos.service";

const USUARIO = "usuario-1";

/** Doble de `Espera` que corre algo en la n-ésima pausa (el trabajador terminando el recurso). */
class EsperaQueAvanza extends Espera {
  readonly pedidas: number[] = [];

  constructor(
    private readonly enLaPausa: number,
    private readonly alLlegar: () => Promise<void>,
  ) {
    super();
  }

  async esperar(milisegundos: number): Promise<void> {
    this.pedidas.push(milisegundos);
    if (this.pedidas.length === this.enLaPausa) await this.alLlegar();
  }
}

describe("Recursos listos antes de arrancar la app (feat/m3-alta-guiada)", () => {
  it("Recurso creado durante la construcción: espera, conecta el recurso e inyecta DATABASE_URL", async () => {
    let procesar: () => Promise<void> = async () => undefined;
    const espera = new EsperaQueAvanza(2, () => procesar());
    const datos = datosDePrueba(espera);
    procesar = () => datos.procesar();
    await datos.servicio.crear(USUARIO, "api", "postgres");

    const inyeccion = await datos.motor.paraDespliegue({ id: "api", subdominio: "api" });

    expect(espera.pedidas).toEqual([PAUSA_RECURSO_CREANDO_MS, PAUSA_RECURSO_CREANDO_MS]);
    expect(inyeccion.variables.base.DATABASE_URL).toMatch(/^postgresql:\/\//);
    expect(inyeccion.pendientes).toBeUndefined();
    expect(datos.docker.conectadoA("deploya-datos-api-postgres", "deploya-p-api")).toBe(true);
  });

  it("Recurso que no termina a tiempo: tras 2 min se inyecta igual y queda en pendientes", async () => {
    const espera = new EsperaInstantanea();
    const datos = datosDePrueba(espera);
    await datos.servicio.crear(USUARIO, "api", "postgres");

    const inyeccion = await datos.motor.paraDespliegue({ id: "api", subdominio: "api" });

    expect(espera.pedidas.reduce((total, ms) => total + ms, 0)).toBe(ESPERA_MAXIMA_RECURSO_CREANDO_MS);
    expect(inyeccion.pendientes).toEqual(["PostgreSQL 17 + pgvector"]);
    expect(inyeccion.variables.base.DATABASE_URL).toBeDefined();
  });

  it("sin recursos en creando no espera", async () => {
    const espera = new EsperaInstantanea();
    const datos = datosDePrueba(espera);
    await datos.servicio.crear(USUARIO, "api", "redis");
    await datos.procesar();

    await datos.motor.paraDespliegue({ id: "api", subdominio: "api" });

    expect(espera.pedidas).toEqual([]);
  });
});

describe("verificarAltaInicial", () => {
  const base = { estadoSuscripcion: "activa" as const, usados: 0, maximo: 3 };

  it("Verificar el alta inicial: dos tipos con un solo lugar libre lanza LimiteRecursosDatos sin crear nada", async () => {
    const datos = datosDePrueba();
    datos.cuota.fijar(USUARIO, { maxRecursosDatos: 1 });

    await expect(datos.servicio.verificarAltaInicial(USUARIO, ["postgres", "redis"])).rejects.toThrow(LimiteRecursosDatos);

    expect(datos.cola.comandos).toEqual([]);
  });

  it("cuenta los recursos que la cuenta ya tiene en otros proyectos", async () => {
    const datos = datosDePrueba();
    datos.cuota.fijar(USUARIO, { maxRecursosDatos: 2 });
    await datos.servicio.crear(USUARIO, "worker", "postgres");

    await expect(datos.servicio.verificarAltaInicial(USUARIO, ["redis"])).resolves.toBeUndefined();
    await expect(datos.servicio.verificarAltaInicial(USUARIO, ["redis", "s3"])).rejects.toThrow(LimiteRecursosDatos);
  });

  it("sin tipos no consulta nada ni falla aunque la suscripción esté vencida", () => {
    expect(() => verificarAltaInicial({ ...base, estadoSuscripcion: "vencida", tipos: [] })).not.toThrow();
  });

  it("con la suscripción vencida lanza SuscripcionBloqueada", () => {
    expect(() => verificarAltaInicial({ ...base, estadoSuscripcion: "vencida", tipos: ["postgres"] })).toThrow(SuscripcionBloqueada);
  });

  it("un tipo repetido lanza TipoYaConectado", () => {
    expect(() => verificarAltaInicial({ ...base, tipos: ["redis", "redis"] })).toThrow(TipoYaConectado);
  });
});

describe("limiteDe", () => {
  it("cuenta los recursos de todos los proyectos de la cuenta frente al plan", async () => {
    const datos = datosDePrueba();
    datos.cuota.fijar(USUARIO, { maxRecursosDatos: 2 });
    await datos.servicio.crear(USUARIO, "api", "postgres");

    await expect(datos.servicio.limiteDe(USUARIO)).resolves.toEqual({ usados: 1, maximo: 2 });
  });
});
