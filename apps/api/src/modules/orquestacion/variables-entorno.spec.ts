import { motorDePrueba } from "../../pruebas/motor";
import { VariablesIlegibles } from "../construccion/dominio/errores";
import { VariablesEntornoPendientes } from "./adaptadores/variables-entorno.pendientes";
import { textoVariables } from "./paso-ejecucion";

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
});
