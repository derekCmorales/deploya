import { VariablesIlegibles } from "../../construccion/dominio/errores";
import { VariableIlegible } from "../../proyectos/dominio/errores";
import type { VariablesProyectoService } from "../../proyectos/servicios/variables-proyecto.service";
import { VariablesEntornoProyecto } from "./variables-entorno.proyecto";

function doble(descifradasDe: VariablesProyectoService["descifradasDe"]): VariablesProyectoService {
  return { descifradasDe } as VariablesProyectoService;
}

describe("VariablesEntornoProyecto", () => {
  it("Variables llegan al contenedor", async () => {
    const adaptador = new VariablesEntornoProyecto(doble(async () => ({ SALUDO: "hola" })));
    await expect(adaptador.deProyecto("proyecto-1")).resolves.toEqual({ SALUDO: "hola" });
  });

  it("Variable ilegible", async () => {
    const adaptador = new VariablesEntornoProyecto(
      doble(async () => {
        throw new VariableIlegible();
      }),
    );
    await expect(adaptador.deProyecto("proyecto-1")).rejects.toBeInstanceOf(VariablesIlegibles);
  });

  it("un error ajeno al cifrado no se disfraza", async () => {
    const adaptador = new VariablesEntornoProyecto(
      doble(async () => {
        throw new Error("base");
      }),
    );
    await expect(adaptador.deProyecto("proyecto-1")).rejects.toThrow("base");
  });
});
