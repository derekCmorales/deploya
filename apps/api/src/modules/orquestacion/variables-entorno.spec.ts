import { motorDePrueba } from "../../pruebas/motor";
import { VariablesIlegibles } from "../construccion/dominio/errores";
import { VariablesEntornoPendientes } from "./adaptadores/variables-entorno.pendientes";
import { PISTA_PUERTO_RECETA, textoVariables } from "./paso-ejecucion";

describe("Variables de entorno en el contenedor (M3-03 → M5)", () => {
  it("Variables llegan al contenedor", async () => {
    const motor = motorDePrueba();
    motor.variables.variables = { SALUDO: "hola" };

    await motor.desplegar();

    expect(motor.contenedores.creados[0].variables).toEqual({ SALUDO: "hola" });
    expect(motor.contenedores.creados[0].puertoInterno).toBe(8080);
  });

  it("La bitácora no muestra valores", async () => {
    const motor = motorDePrueba();
    motor.variables.variables = { SALUDO: "hola-secreto", API_KEY: "sk-123", MODO: "produccion" };

    const despliegue = await motor.desplegar();

    const textos = (await motor.despliegues.lineasDesde(despliegue.id, 0, 500)).map((l) => l.texto).join("\n");
    expect(textos).toContain("3 variables aplicadas");
    for (const fragmento of ["SALUDO", "hola-secreto", "API_KEY", "sk-123", "MODO", "produccion"]) expect(textos).not.toContain(fragmento);
  });

  it("Variable ilegible", async () => {
    const motor = motorDePrueba();
    const anterior = await motor.desplegar();
    motor.variables.error = new VariablesIlegibles();

    const despliegue = await motor.desplegar();

    expect(despliegue.estado).toBe("fallido");
    expect(despliegue.motivoFallo).toBe("Variable ilegible");
    expect(despliegue.etapas.find((e) => e.etapa === "ejecucion")?.estado).toBe("fallida");
    expect(motor.contenedores.creados).toHaveLength(1);
    expect((await motor.despliegues.activoDe("proyecto-1"))?.id).toBe(anterior.id);
  });

  it("sin variables no escribe la línea y una sola va en singular", async () => {
    expect(textoVariables(1)).toBe("1 variable aplicada");
    expect(await new VariablesEntornoPendientes().deProyecto()).toEqual({});
  });

  it("con receta, si no pasa la salud la bitácora sugiere escuchar en PORT; con Dockerfile propio no", async () => {
    const lineasDe = async (archivos: Map<string, string>) => {
      const motor = motorDePrueba();
      motor.clonador.archivos = archivos;
      motor.salud.resultado = { ok: false, estadoHttp: null, milisegundos: 60_000, detalle: "connect ECONNREFUSED" };
      const despliegue = await motor.desplegar();
      return (await motor.despliegues.lineasDesde(despliegue.id, 0, 500)).map((l) => [l.nivel, l.texto]);
    };

    const conReceta = await lineasDe(new Map([["package.json", JSON.stringify({ scripts: { start: "node ." } })]]));
    const conDockerfile = await lineasDe(new Map([["Dockerfile", "FROM node:22"]]));

    expect(conReceta).toContainEqual(["aviso", PISTA_PUERTO_RECETA]);
    expect(conDockerfile.map(([, texto]) => texto)).not.toContain(PISTA_PUERTO_RECETA);
  });

  it("Variables del usuario ganan: DATABASE_URL del proyecto se respeta y DEPLOYA_POSTGRES_URL igual se inyecta", async () => {
    const motor = motorDePrueba();
    motor.variables.variables = { DATABASE_URL: "postgresql://propia" };
    motor.recursosDatos.inyeccion = {
      recursos: ["PostgreSQL 17 + pgvector"],
      variables: {
        base: { DATABASE_URL: "postgresql://deploya:x@deploya-datos-hola-deploya-postgres:5432/app", PGHOST: "deploya-datos-hola-deploya-postgres" },
        prefijadas: { DEPLOYA_POSTGRES_URL: "postgresql://deploya:x@deploya-datos-hola-deploya-postgres:5432/app" },
      },
    };

    await motor.desplegar();

    expect(motor.contenedores.creados[0].variables).toEqual({
      DATABASE_URL: "postgresql://propia",
      PGHOST: "deploya-datos-hola-deploya-postgres",
      DEPLOYA_POSTGRES_URL: "postgresql://deploya:x@deploya-datos-hola-deploya-postgres:5432/app",
    });
  });

  it("Las DEPLOYA_* siempre se inyectan: una DEPLOYA_REDIS_URL del usuario no la pisa", async () => {
    const motor = motorDePrueba();
    motor.variables.variables = { DEPLOYA_REDIS_URL: "redis://otra" };
    motor.recursosDatos.inyeccion = { recursos: ["Redis 7"], variables: { base: { REDIS_URL: "redis://r" }, prefijadas: { DEPLOYA_REDIS_URL: "redis://r" } } };

    await motor.desplegar();

    expect(motor.contenedores.creados[0].variables).toMatchObject({ REDIS_URL: "redis://r", DEPLOYA_REDIS_URL: "redis://r" });
  });

  it("Bitácora sin valores: dice qué recursos se conectaron y cuántas variables se inyectaron", async () => {
    const motor = motorDePrueba();
    motor.variables.variables = { REDIS_URL: "redis://mia" };
    motor.recursosDatos.inyeccion = {
      recursos: ["PostgreSQL 17 + pgvector", "Redis 7"],
      variables: { base: { DATABASE_URL: "postgresql://secreto", REDIS_URL: "redis://r" }, prefijadas: { DEPLOYA_POSTGRES_URL: "postgresql://secreto", DEPLOYA_REDIS_URL: "redis://r" } },
    };

    const despliegue = await motor.desplegar();

    const textos = (await motor.despliegues.lineasDesde(despliegue.id, 0, 500)).map((l) => l.texto).join("\n");
    expect(textos).toContain("Recursos de datos conectados: PostgreSQL 17 + pgvector, Redis 7 · 3 variables inyectadas");
    expect(textos).toContain("1 variable aplicada");
    for (const fragmento of ["postgresql://secreto", "redis://r", "DATABASE_URL"]) expect(textos).not.toContain(fragmento);
    expect(motor.recursosDatos.preparados).toEqual(["proyecto-1"]);
  });

  it("Sobrevive al redespliegue: desplegar otra vez no borra ni recrea los recursos de datos", async () => {
    const motor = motorDePrueba();
    motor.recursosDatos.inyeccion = { recursos: ["Redis 7"], variables: { base: { REDIS_URL: "redis://r" }, prefijadas: {} } };

    await motor.desplegar();
    await motor.desplegar();

    expect(motor.recursosDatos.liberados).toEqual([]);
    expect(motor.contenedores.creados.map((c) => c.variables.REDIS_URL)).toEqual(["redis://r", "redis://r"]);
  });
});
