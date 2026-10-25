import { MODULE_METADATA } from "@nestjs/common/constants";
import { CifradorVariables } from "./puertos/cifrador-variables.puerto";
import { VariablesProyectoService } from "./servicios/variables-proyecto.service";
import { VariablesModule } from "./variables.module";

describe("VariablesModule", () => {
  it("exporta el servicio de variables y el cifrador (lo reusa el correo de la instalación, SP-17)", () => {
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, VariablesModule)).toEqual([VariablesProyectoService, CifradorVariables]);
  });
});
