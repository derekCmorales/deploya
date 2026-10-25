import { resolve4 } from "node:dns/promises";
import { ResolutorDnsPuerto } from "../puertos/resolutor-dns.puerto";

/** `dns.resolve4` de Node; un nombre que no existe responde `[]`, no lanza. */
export class ResolutorDnsNode extends ResolutorDnsPuerto {
  async ipv4(nombre: string): Promise<string[]> {
    try {
      return await resolve4(nombre);
    } catch {
      return [];
    }
  }
}
