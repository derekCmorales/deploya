import { rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { EnrutamientoPuerto, type RutaPublica } from "../../modules/enrutamiento/puertos/enrutamiento.puerto";

const ETIQUETA_DNS = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const HOST_VALIDO = /^[a-zA-Z0-9_.-]+$/;

export class RutaInvalida extends Error {
  constructor(detalle: string) {
    super(detalle);
    this.name = "RutaInvalida";
  }
}

export interface OpcionesTraefik {
  directorio: string;
  dominio: string;
  esquema: string;
}

/**
 * Traefik v3 con proveedor de archivo (ADR 0005): una ruta por proyecto en
 * `<directorio>/<subdominio>.yml`, escrita de forma atómica (temporal + rename).
 */
export class EnrutamientoTraefikArchivo extends EnrutamientoPuerto {
  constructor(private readonly opciones: OpcionesTraefik) {
    super();
  }

  async publicar(ruta: RutaPublica): Promise<{ url: string }> {
    validar(ruta);
    const destino = this.archivo(ruta.subdominio);
    const temporal = `${destino}.tmp`;
    await writeFile(temporal, configuracionRuta(ruta, this.opciones.dominio), "utf8");
    await rename(temporal, destino);
    return { url: `${this.opciones.esquema}://${ruta.subdominio}.${this.opciones.dominio}` };
  }

  async retirar(subdominio: string): Promise<void> {
    await rm(this.archivo(subdominio), { force: true });
  }

  private archivo(subdominio: string): string {
    return join(this.opciones.directorio, `${subdominio}.yml`);
  }
}

export function configuracionRuta(ruta: RutaPublica, dominio: string): string {
  return [
    "http:",
    "  routers:",
    `    ${ruta.subdominio}:`,
    `      rule: "Host(\`${ruta.subdominio}.${dominio}\`)"`,
    `      service: ${ruta.subdominio}`,
    "      entryPoints: [web]",
    "  services:",
    `    ${ruta.subdominio}:`,
    "      loadBalancer:",
    "        servers:",
    `          - url: "http://${ruta.host}:${ruta.puerto}"`,
    "",
  ].join("\n");
}

function validar(ruta: RutaPublica): void {
  if (!ETIQUETA_DNS.test(ruta.subdominio)) throw new RutaInvalida(`Subdominio inválido: ${ruta.subdominio}`);
  if (!HOST_VALIDO.test(ruta.host)) throw new RutaInvalida(`Host inválido: ${ruta.host}`);
}
