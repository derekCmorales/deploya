import { Inject, Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import type { LimitesInstalacion, PoliticaRegistro } from "../../suscripciones/modo/configuracion-instalacion";
import { RepositorioConfiguracionInstalacion } from "../../suscripciones/modo/repositorio-configuracion-instalacion.puerto";
import { ACCION_CAMBIAR_LIMITES, ACCION_CAMBIAR_REGISTRO, capacidadEstimada, validarLimites, validarPolitica } from "./dominio/ajustes";
import type { InvitacionActiva } from "./dominio/invitacion";
import { InvitacionesService } from "./invitaciones.service";
import { EstadoScriptsPuerto, type EstadoRespaldo, type EstadoVersion } from "./puertos/estado-scripts.puerto";
import { RegistroAccionesPuerto } from "./puertos/registro-acciones.puerto";
import { ReporteServidorPuerto } from "./puertos/reporte-servidor.puerto";
import type { ResultadoComprobacion, SaludInstalacion } from "./salud/comprobacion";

export const SALUD_INSTALACION = Symbol("SALUD_INSTALACION");
export const DOMINIO_INSTALACION = Symbol("DOMINIO_INSTALACION");

export interface LimitesVista {
  cpu: number;
  memoriaMb: number;
  proyectosPorUsuario: number | null;
  /** «caben unos 3 proyectos activos»; `null` sin reporte del servidor. */
  capacidad: number | null;
  memoriaLibreMb: number | null;
}

/** `GET /admin/instalacion` (pantalla 32, contrato instalacion.md). */
export interface EstadoInstalacion {
  dominio: string;
  comprobado: Date;
  salud: ResultadoComprobacion[];
  version: EstadoVersion;
  registro: { politica: PoliticaRegistro; invitaciones: InvitacionActiva[] };
  limites: LimitesVista;
  respaldo: EstadoRespaldo;
}

/**
 * Facade de Admin · Instalación (SP-18): junta la salud (Composite), lo que dejan los scripts,
 * la política de registro y los límites. Cambiar registro o límites deja una acción. Los límites
 * los lee `LimitesDeInstalacion` en cada despliegue: aplican en el próximo, no en el que corre.
 */
@Injectable()
export class InstalacionService {
  constructor(
    private readonly configuracion: RepositorioConfiguracionInstalacion,
    private readonly invitaciones: InvitacionesService,
    private readonly scripts: EstadoScriptsPuerto,
    private readonly reportes: ReporteServidorPuerto,
    private readonly acciones: RegistroAccionesPuerto,
    private readonly reloj: Reloj,
    @Inject(SALUD_INSTALACION) private readonly salud: SaludInstalacion,
    @Inject(DOMINIO_INSTALACION) private readonly dominio: string,
  ) {}

  async estado(): Promise<EstadoInstalacion> {
    const [salud, version, respaldo, politica, invitaciones, limites] = await Promise.all([
      this.salud.comprobar(),
      this.scripts.version(),
      this.scripts.respaldo(),
      this.configuracion.politicaRegistro(),
      this.invitaciones.activas(),
      this.limites(),
    ]);
    return { dominio: this.dominio, comprobado: this.reloj.ahora(), salud, version, registro: { politica, invitaciones }, limites, respaldo };
  }

  async cambiarRegistro(adminId: string, cuerpo: unknown): Promise<{ politica: PoliticaRegistro }> {
    const politica = validarPolitica(cuerpo);
    await this.configuracion.guardarPoliticaRegistro(politica);
    await this.acciones.registrar({ adminId, accion: ACCION_CAMBIAR_REGISTRO, detalle: politica, creado: this.reloj.ahora() });
    return { politica };
  }

  async cambiarLimites(adminId: string, cuerpo: unknown): Promise<LimitesVista> {
    const limites = validarLimites(cuerpo);
    await this.configuracion.guardarLimites(limites);
    await this.acciones.registrar({ adminId, accion: ACCION_CAMBIAR_LIMITES, detalle: textoLimites(limites), creado: this.reloj.ahora() });
    return this.limites();
  }

  private async limites(): Promise<LimitesVista> {
    const [limites, reporte] = await Promise.all([this.configuracion.limites(), this.reportes.ultimo()]);
    const memoriaLibreMb = reporte?.memoria.libreMb ?? null;
    return {
      cpu: limites.cpuPorProyecto,
      memoriaMb: limites.memoriaMbPorProyecto,
      proyectosPorUsuario: limites.proyectosPorUsuario,
      capacidad: capacidadEstimada(memoriaLibreMb, limites.memoriaMbPorProyecto),
      memoriaLibreMb,
    };
  }
}

/** «1 vCPU · 1024 MB · sin límite de proyectos» para el registro de auditoría. */
function textoLimites({ cpuPorProyecto, memoriaMbPorProyecto, proyectosPorUsuario }: LimitesInstalacion): string {
  const proyectos = proyectosPorUsuario === null ? "sin límite de proyectos" : `${proyectosPorUsuario} proyectos por usuario`;
  return `${cpuPorProyecto} vCPU · ${memoriaMbPorProyecto} MB · ${proyectos}`;
}
