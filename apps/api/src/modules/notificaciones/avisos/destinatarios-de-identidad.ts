import { Injectable } from "@nestjs/common";
import { DirectorioCuentas } from "../../identidad/directorio-cuentas.service";
import { DestinatariosPuerto, type Destinatario } from "../puertos/destinatarios.puerto";

/** Adapter: el destinatario de un aviso sale del servicio que exporta identidad (M1). */
@Injectable()
export class DestinatariosDeIdentidad extends DestinatariosPuerto {
  constructor(private readonly directorio: DirectorioCuentas) {
    super();
  }

  destinatarioDe(usuarioId: string): Promise<Destinatario | null> {
    return this.directorio.contactoDe(usuarioId);
  }
}
