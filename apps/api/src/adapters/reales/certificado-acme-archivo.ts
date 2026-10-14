import { X509Certificate } from "node:crypto";
import { readFile } from "node:fs/promises";
import { CertificadoPuerto } from "../../modules/enrutamiento/puertos/certificado.puerto";

interface CertificadoAcme {
  domain?: { main?: string; sans?: string[] };
  certificate?: string;
}

type ContenidoAcme = Record<string, { Certificates?: CertificadoAcme[] } | null>;

export type LeerArchivo = (ruta: string) => Promise<string>;

/**
 * Lee el `acme.json` de Traefik (montado de solo lectura) y devuelve el vencimiento del certificado que
 * cubre el host: el `notAfter` de la hoja de la cadena. Un archivo ausente, vacío o ilegible es «sin
 * certificado» (todavía no se emitió), no un error del panel.
 */
export class CertificadoAcmeArchivo extends CertificadoPuerto {
  constructor(
    private readonly ruta: string,
    private readonly leer: LeerArchivo = (r) => readFile(r, "utf8"),
  ) {
    super();
  }

  async venceEl(host: string): Promise<Date | null> {
    const vencimientos = (await this.certificados())
      .filter((c) => cubre(host, [c.domain?.main, ...(c.domain?.sans ?? [])]))
      .map((c) => vencimientoDe(c.certificate))
      .filter((fecha): fecha is Date => fecha !== null);
    return vencimientos.length === 0 ? null : new Date(Math.max(...vencimientos.map((f) => f.getTime())));
  }

  private async certificados(): Promise<CertificadoAcme[]> {
    try {
      const contenido = JSON.parse(await this.leer(this.ruta)) as ContenidoAcme;
      return Object.values(contenido).flatMap((resolvedor) => resolvedor?.Certificates ?? []);
    } catch {
      return [];
    }
  }
}

/** `host` lo cubre un dominio exacto o un comodín `*.x` de exactamente una etiqueta más. */
export function cubre(host: string, dominios: (string | undefined)[]): boolean {
  return dominios.some((dominio) => {
    if (!dominio) return false;
    if (dominio === host) return true;
    if (!dominio.startsWith("*.")) return false;
    const base = dominio.slice(1);
    return host.endsWith(base) && host.slice(0, -base.length).split(".").length === 1;
  });
}

function vencimientoDe(certificadoBase64: string | undefined): Date | null {
  if (!certificadoBase64) return null;
  try {
    return new Date(new X509Certificate(Buffer.from(certificadoBase64, "base64")).validTo);
  } catch {
    return null;
  }
}
