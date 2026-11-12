import { Injectable } from "@nestjs/common";
import { MotorDatosService } from "../../datos/motor-datos.service";
import { RecursosDatosDespliegue, type InyeccionDespliegue } from "../puertos/recursos-datos-despliegue.puerto";

/** Adapter de M5 sobre `MotorDatosService`: delega y no decide nada. */
@Injectable()
export class RecursosDatosMotor extends RecursosDatosDespliegue {
  constructor(private readonly motor: MotorDatosService) {
    super();
  }

  paraDespliegue(proyecto: { id: string; subdominio: string }): Promise<InyeccionDespliegue> {
    return this.motor.paraDespliegue(proyecto);
  }

  liberarProyecto(subdominio: string): Promise<void> {
    return this.motor.liberarProyecto(subdominio);
  }
}
