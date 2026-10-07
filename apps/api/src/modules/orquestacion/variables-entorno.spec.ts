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
});
