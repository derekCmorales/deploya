import { Injectable } from "@nestjs/common";
import { CertificadoPuerto } from "../../modules/enrutamiento/puertos/certificado.puerto";

/** Null Object de desarrollo (sin TLS): cumple el mismo contrato y siempre dice que no hay certificado. */
@Injectable()
export class CertificadoAusente extends CertificadoPuerto {
  async venceEl(): Promise<Date | null> {
    return null;
  }
}

/** Doble con vencimientos configurables por host, para probar la vista de despliegue. */
@Injectable()
export class CertificadoFijo extends CertificadoPuerto {
  readonly vencimientos = new Map<string, Date>();
  readonly consultados: string[] = [];

  async venceEl(host: string): Promise<Date | null> {
    this.consultados.push(host);
    return this.vencimientos.get(host) ?? null;
  }
}
