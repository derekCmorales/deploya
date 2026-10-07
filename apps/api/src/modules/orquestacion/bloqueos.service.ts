import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { RepositorioDespliegues } from "../construccion/puertos/repositorio-despliegues.puerto";
import { inicioDelMes, verificarDespliegue } from "./dominio/politica-despliegue";
import { CuotaPlanPuerto } from "./puertos/cuota-plan.puerto";

/**
 * M5-03 (Facade): M4 y M3 llaman a un solo método antes de pedir una construcción.
 * La regla vive en `verificarDespliegue`; aquí solo se juntan sus datos.
 */
@Injectable()
export class BloqueosService {
  constructor(
    private readonly cuota: CuotaPlanPuerto,
    private readonly despliegues: RepositorioDespliegues,
    private readonly reloj: Reloj,
  ) {}

  /** Lanza `SuscripcionNoPermite` o `CuotaConstruccionesAgotada`. */
  async verificar(usuarioId: string): Promise<void> {
    const desde = inicioDelMes(this.reloj.ahora());
    const [permiso, construccionesUsadas] = await Promise.all([
      this.cuota.permisoDe(usuarioId),
      this.despliegues.contarConstruccionesDesde(usuarioId, desde),
    ]);
    verificarDespliegue({ estado: permiso.estado, construccionesUsadas, construccionesMes: permiso.construccionesMes });
  }
}
