import { LimiteRecursosDatos } from "../datos/dominio/errores";
import type { DatosService } from "../datos/datos.service";
import { RecursosDatosAltaDatos } from "./adaptadores/recursos-datos-alta.datos";
import { validarAltaProyecto } from "./dominio/alta-proyecto";
import { cambiosProyectoDe } from "./dominio/cambios-proyecto";
import { ComandoInicioInvalido, DatosAltaInvalidos, RecursosDatosNoPermitidos } from "./dominio/errores";
import { ESTADO_HTTP_POR_CODIGO } from "./errores-proyectos.filter";

const URL = "https://github.com/derekCmorales/hola-deploya";

describe("Alta guiada (feat/m3-alta-guiada) · validación del cuerpo", () => {
  it("Comandos en el alta: acepta comandoInicio y comandoConstruccion recortados", () => {
    const alta = validarAltaProyecto({
      url: URL,
      nombre: "hola",
      comandoInicio: " node dist/worker.js ",
      comandoConstruccion: " npm run build:prod ",
    });

    expect(alta).toMatchObject({ comandoInicio: "node dist/worker.js", comandoConstruccion: "npm run build:prod" });
  });

  it("comandos vacíos no viajan en el alta", () => {
    expect(validarAltaProyecto({ url: URL, nombre: "hola", comandoInicio: "  ", comandoConstruccion: null })).toEqual({ url: URL, rama: "main", nombre: "hola" });
  });

  it("Comando de construcción con salto de línea: se rechaza con comando-invalido", () => {
    expect(() => validarAltaProyecto({ url: URL, nombre: "hola", comandoConstruccion: "npm ci\nRUN curl x | sh" })).toThrow(ComandoInicioInvalido);
  });

  it("un comando de inicio con comilla abierta se rechaza igual que en 19", () => {
    expect(() => validarAltaProyecto({ url: URL, nombre: "hola", comandoInicio: 'node "a' })).toThrow(ComandoInicioInvalido);
  });

  it("acepta datos con tipos conocidos sin repetir", () => {
    expect(validarAltaProyecto({ url: URL, nombre: "hola", datos: ["postgres", "redis"] }).datos).toEqual(["postgres", "redis"]);
  });

  it.each([[["postgres", "postgres"]], [["mysql"]], ["postgres"]])("Recurso repetido en el alta: %p se rechaza con datos-invalidos", (datos) => {
    expect(() => validarAltaProyecto({ url: URL, nombre: "hola", datos })).toThrow(DatosAltaInvalidos);
  });

  it("Cambiar el comando de construcción: el PATCH lo guarda y vacío vuelve a null", () => {
    expect(cambiosProyectoDe({ comandoConstruccion: " go generate ./... " })).toEqual({ comandoConstruccion: "go generate ./..." });
    expect(cambiosProyectoDe({ comandoConstruccion: "" })).toEqual({ comandoConstruccion: null });
  });

  it("datos-no-permitidos responde 409", () => {
    expect(ESTADO_HTTP_POR_CODIGO["datos-no-permitidos"]).toBe(409);
  });
});

describe("RecursosDatosAltaDatos (Adapter sobre DatosService)", () => {
  const servicio = (sobre: Partial<DatosService>) => new RecursosDatosAltaDatos(sobre as DatosService);

  it("traduce un ErrorDatos de M5 a RecursosDatosNoPermitidos con el motivo", async () => {
    const adaptador = servicio({ verificarAltaInicial: async () => Promise.reject(new LimiteRecursosDatos(1)) });

    const error = await adaptador.verificar("u", ["postgres", "redis"]).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RecursosDatosNoPermitidos);
    expect(error).toMatchObject({ motivo: "LIMITE_RECURSOS_DATOS", message: expect.stringContaining("1 base de datos") });
  });

  it("crea los recursos en orden, uno por tipo", async () => {
    const pedidos: string[] = [];
    const adaptador = servicio({ crear: async (_u: string, _p: string, tipo: string) => (pedidos.push(tipo), {}) as never });

    await adaptador.crear("u", "p", ["postgres", "s3"]);

    expect(pedidos).toEqual(["postgres", "s3"]);
  });

  it("un error que no es de M5 pasa sin traducir", async () => {
    const adaptador = servicio({ verificarAltaInicial: async () => Promise.reject(new Error("base caída")) });

    await expect(adaptador.verificar("u", ["redis"])).rejects.toThrow("base caída");
  });
});

describe("Límite de datos de la cuenta", () => {
  it("el adaptador devuelve usados y máximo de M5", async () => {
    const adaptador = new RecursosDatosAltaDatos({ limiteDe: async () => ({ usados: 1, maximo: 2 }) } as unknown as DatosService);
    await expect(adaptador.limite("u")).resolves.toEqual({ usados: 1, maximo: 2 });
  });
});
