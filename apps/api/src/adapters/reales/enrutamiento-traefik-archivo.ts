import { rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ConfiguracionEnrutamiento } from "../../modules/enrutamiento/configuracion-enrutamiento";
import { EnrutamientoPuerto, type RutaPublica } from "../../modules/enrutamiento/puertos/enrutamiento.puerto";

const ETIQUETA_DNS = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const HOST_VALIDO = /^[a-zA-Z0-9_.-]+$/;

export class RutaInvalida extends Error {
  constructor(detalle: string) {
    super(detalle);
    this.name = "RutaInvalida";
  }
}

export interface OpcionesTraefik extends ConfiguracionEnrutamiento {
  directorio: string;
}

/** Puntos de entrada de `traefik.yml` y `traefik.vps.yml`: `web` (80) y `websecure` (443, solo en el VPS). */
const PUNTO_ENTRADA_HTTP = "web";
const PUNTO_ENTRADA_HTTPS = "websecure";

/**
 * Traefik v3 con proveedor de archivo (ADR 0005): una ruta por proyecto en
 * `<directorio>/<subdominio>.yml`, escrita de forma atómica (temporal + rename). Con resolvedor
 * ACME la ruta declara TLS (certificado comodín por DNS-01, ADR 0007); sin él, igual que en desarrollo.
 */
export class EnrutamientoTraefikArchivo extends EnrutamientoPuerto {
  constructor(private readonly opciones: OpcionesTraefik) {
    super();
  }

  async publicar(ruta: RutaPublica): Promise<{ url: string }> {
    validar(ruta);
    const destino = this.archivo(ruta.subdominio);
    const temporal = `${destino}.tmp`;
    await writeFile(temporal, configuracionRuta(ruta, this.opciones), "utf8");
    await rename(temporal, destino);
    return { url: `${this.opciones.esquema}://${ruta.subdominio}.${this.opciones.dominioBase}` };
  }

  async retirar(subdominio: string): Promise<void> {
    await rm(this.archivo(subdominio), { force: true });
  }

  private archivo(subdominio: string): string {
    return join(this.opciones.directorio, `${subdominio}.yml`);
  }
}

export function configuracionRuta(ruta: RutaPublica, configuracion: Pick<ConfiguracionEnrutamiento, "dominioBase" | "certResolver">): string {
  const { dominioBase, certResolver } = configuracion;
  return [
    "http:",
    "  routers:",
    `    ${ruta.subdominio}:`,
    `      rule: "Host(\`${ruta.subdominio}.${dominioBase}\`)"`,
    `      service: ${ruta.subdominio}`,
    `      entryPoints: [${certResolver ? PUNTO_ENTRADA_HTTPS : PUNTO_ENTRADA_HTTP}]`,
    ...bloqueTls(dominioBase, certResolver),
    "  services:",
    `    ${ruta.subdominio}:`,
    "      loadBalancer:",
    "        servers:",
    `          - url: "http://${ruta.host}:${ruta.puerto}"`,
    "",
  ].join("\n");
}

/** Pide el certificado de `*.<dominioBase>`: Traefik lo emite una vez y lo reusa en cada proyecto. */
function bloqueTls(dominioBase: string, certResolver: string | null): string[] {
  if (!certResolver) return [];
  return [
    "      tls:",
    `        certResolver: ${certResolver}`,
    "        domains:",
    `          - main: "${dominioBase}"`,
    `            sans: ["*.${dominioBase}"]`,
  ];
}

function validar(ruta: RutaPublica): void {
  if (!ETIQUETA_DNS.test(ruta.subdominio)) throw new RutaInvalida(`Subdominio inválido: ${ruta.subdominio}`);
  if (!HOST_VALIDO.test(ruta.host)) throw new RutaInvalida(`Host inválido: ${ruta.host}`);
}
