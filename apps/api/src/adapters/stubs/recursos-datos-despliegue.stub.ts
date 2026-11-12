import { Injectable } from "@nestjs/common";
import { RecursosDatosDespliegue, type InyeccionDespliegue } from "../../modules/orquestacion/puertos/recursos-datos-despliegue.puerto";

/** Proyecto sin recursos de datos por omisión; la prueba fija `inyeccion` para simular uno conectado. */
@Injectable()
export class RecursosDatosDespliegueStub extends RecursosDatosDespliegue {
  inyeccion: InyeccionDespliegue = { recursos: [], variables: { base: {}, prefijadas: {} } };
  readonly liberados: string[] = [];
  readonly preparados: string[] = [];

  async paraDespliegue(proyecto: { id: string; subdominio: string }): Promise<InyeccionDespliegue> {
    this.preparados.push(proyecto.id);
    return this.inyeccion;
  }

  async liberarProyecto(subdominio: string): Promise<void> {
    this.liberados.push(subdominio);
  }
}
