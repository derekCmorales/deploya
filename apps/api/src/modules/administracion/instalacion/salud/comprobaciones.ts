import { Reloj } from "../../../../compartido/reloj";
import { CertificadoPuerto } from "../../../enrutamiento/puertos/certificado.puerto";
import type { RegistroEnviosCorreo } from "../../../notificaciones/puertos/registro-envios.puerto";
import type { ReporteServidor, ReporteServidorPuerto } from "../puertos/reporte-servidor.puerto";
import type { ResolutorDnsPuerto } from "../puertos/resolutor-dns.puerto";
import { ComprobacionInstalacion, type ResultadoComprobacion } from "./comprobacion";
import { DIA_MS, fechaCorta, haceCuanto } from "./textos";

/** El trabajador reporta cada 10 min; si el último tiene más de 30, algo no va. */
export const REPORTE_VIGENTE_MS = 30 * 60 * 1000;
/** Avisa del certificado cuando le quedan menos de 14 días (Let's Encrypt renueva a los 30). */
export const DIAS_AVISO_CERTIFICADO = 14;
/** Disco: aviso desde el 80 %, error desde el 90 %. */
export const DISCO_AVISO = 0.8;
export const DISCO_ERROR = 0.9;
/** Un nombre que solo resuelve el comodín (la etapa 2 del instalador hace lo mismo). */
export const NOMBRE_PRUEBA_COMODIN = "comprobacion-deploya";

/** Lee el último reporte del trabajador y falla con un mensaje claro si no hay o es viejo. */
async function reporteVigente(reportes: ReporteServidorPuerto, reloj: Reloj): Promise<ReporteServidor> {
  const reporte = await reportes.ultimo();
  if (!reporte) throw new Error("El trabajador todavía no reporta el estado del servidor.");
  if (reloj.ahora().getTime() - reporte.tomado.getTime() > REPORTE_VIGENTE_MS) {
    throw new Error(`El trabajador no reporta desde ${haceCuanto(reporte.tomado, reloj.ahora())}.`);
  }
  return reporte;
}

export class ComprobacionDocker extends ComprobacionInstalacion {
  readonly id = "docker";

  constructor(
    private readonly reportes: ReporteServidorPuerto,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async comprobar(): Promise<ResultadoComprobacion> {
    const { docker, errorDocker } = await reporteVigente(this.reportes, this.reloj);
    if (!docker) return { id: this.id, estado: "error", detalle: `Docker no responde: ${errorDocker ?? "sin detalle"}` };
    return { id: this.id, estado: "ok", detalle: `${docker.version} · ${docker.contenedores} contenedores de deploya en marcha` };
  }
}

export class ComprobacionDisco extends ComprobacionInstalacion {
  readonly id = "disco";

  constructor(
    private readonly reportes: ReporteServidorPuerto,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async comprobar(): Promise<ResultadoComprobacion> {
    const { disco } = await reporteVigente(this.reportes, this.reloj);
    const uso = disco.totalGb > 0 ? disco.usadoGb / disco.totalGb : 0;
    const estado = uso >= DISCO_ERROR ? "error" : uso >= DISCO_AVISO ? "aviso" : "ok";
    return { id: this.id, estado, detalle: `${Math.round(disco.usadoGb)} de ${Math.round(disco.totalGb)} GB · imágenes y artefactos` };
  }
}

export class ComprobacionDnsComodin extends ComprobacionInstalacion {
  readonly id = "dns";

  constructor(
    private readonly resolutor: ResolutorDnsPuerto,
    private readonly dominio: string,
  ) {
    super();
  }

  async comprobar(): Promise<ResultadoComprobacion> {
    const [ip] = await this.resolutor.ipv4(`${NOMBRE_PRUEBA_COMODIN}.${this.dominio}`);
    if (!ip) return { id: this.id, estado: "error", detalle: `*.${this.dominio} no resuelve: revisa el registro comodín en tu DNS` };
    return { id: this.id, estado: "ok", detalle: `*.${this.dominio} → ${ip}` };
  }
}

export class ComprobacionCertificado extends ComprobacionInstalacion {
  readonly id = "certificado";

  constructor(
    private readonly certificado: CertificadoPuerto,
    private readonly dominio: string,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async comprobar(): Promise<ResultadoComprobacion> {
    const vence = await this.certificado.venceEl(`${NOMBRE_PRUEBA_COMODIN}.${this.dominio}`);
    if (!vence) return { id: this.id, estado: "error", detalle: "No hay certificado para el comodín" };
    const dias = Math.floor((vence.getTime() - this.reloj.ahora().getTime()) / DIA_MS);
    const estado = dias < 0 ? "error" : dias < DIAS_AVISO_CERTIFICADO ? "aviso" : "ok";
    return { id: this.id, estado, detalle: `Comodín · vence ${fechaCorta(vence)} (en ${Math.max(0, dias)} días) · se renueva solo` };
  }
}

export class ComprobacionCorreo extends ComprobacionInstalacion {
  readonly id = "correo";

  constructor(
    private readonly envios: RegistroEnviosCorreo,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async comprobar(): Promise<ResultadoComprobacion> {
    const ultimo = await this.envios.ultimo();
    if (!ultimo) return { id: this.id, estado: "ok", detalle: "Todavía no se ha enviado ningún correo" };
    const cuando = haceCuanto(ultimo.en, this.reloj.ahora());
    if (ultimo.entregado) return { id: this.id, estado: "ok", detalle: `El último envío llegó ${cuando}` };
    return { id: this.id, estado: "aviso", detalle: `El último envío falló ${cuando}: ${ultimo.error ?? "sin detalle del servidor"}` };
  }
}
