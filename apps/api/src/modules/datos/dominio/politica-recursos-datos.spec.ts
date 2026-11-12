import { LimiteRecursosDatos, SuscripcionBloqueada, TipoYaConectado } from "./errores";
import { tiposDisponibles, verificarAlta, type SituacionAlta } from "./politica-recursos-datos";

const BASE: SituacionAlta = { estadoSuscripcion: "activa", usados: 0, maximo: 1, tiposConectados: [], tipo: "postgres" };

describe("PoliticaRecursosDatos", () => {
  it.each(["activa", "por-vencer"] as const)("con la suscripción %s y cupo, se puede crear", (estadoSuscripcion) => {
    expect(() => verificarAlta({ ...BASE, estadoSuscripcion })).not.toThrow();
  });

  it.each(["vencida", "suspendida", "cancelada"] as const)("Suscripción bloqueada: %s lanza SuscripcionBloqueada antes que el límite", (estadoSuscripcion) => {
    expect(() => verificarAlta({ ...BASE, estadoSuscripcion, usados: 9 })).toThrow(SuscripcionBloqueada);
  });

  it("Límite del plan: con usados = máximo lanza LimiteRecursosDatos con el máximo", () => {
    expect(() => verificarAlta({ ...BASE, usados: 1 })).toThrow(new LimiteRecursosDatos(1));
  });

  it("Un tipo por proyecto: un tipo ya conectado lanza TipoYaConectado", () => {
    expect(() => verificarAlta({ ...BASE, maximo: 3, tiposConectados: ["postgres"] })).toThrow(TipoYaConectado);
  });

  it("sin tope (autoalojado, Infinity) nunca se llega al límite", () => {
    expect(() => verificarAlta({ ...BASE, usados: 500, maximo: Number.POSITIVE_INFINITY })).not.toThrow();
  });

  it("tiposDisponibles quita los ya conectados y mantiene el orden", () => {
    expect(tiposDisponibles(["postgres", "redis", "s3"], ["redis"])).toEqual(["postgres", "s3"]);
  });

  it("los mensajes del límite dicen base o bases en singular y plural", () => {
    expect(new LimiteRecursosDatos(1).message).toContain("1 base de datos");
    expect(new LimiteRecursosDatos(3).message).toContain("3 bases de datos");
  });
});
