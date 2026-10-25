import { Inject, Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { AjusteInvalido, InvitacionNoEncontrada } from "../dominio/errores";
import { ACCION_CREAR_INVITACION, ACCION_REVOCAR_INVITACION } from "./dominio/ajustes";
import { normalizarCorreo, venceDe, type InvitacionActiva } from "./dominio/invitacion";
import { RegistroAccionesPuerto } from "./puertos/registro-acciones.puerto";
import { RepositorioInvitaciones } from "./puertos/repositorio-invitaciones.puerto";
import { TokensInvitacion } from "./puertos/tokens-invitacion.puerto";

export const URL_WEB_INSTALACION = Symbol("URL_WEB_INSTALACION");
/** La ruta del registro (01) que lee el token: `/registro?invitacion=…`. */
export const RUTA_REGISTRO = "/registro";
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InvitacionCreada {
  id: string;
  enlace: string;
  vence: Date;
}

/** Service Layer (SP-18): crear, listar y revocar invitaciones; cada cambio deja su acción. */
@Injectable()
export class InvitacionesService {
  constructor(
    private readonly invitaciones: RepositorioInvitaciones,
    private readonly tokens: TokensInvitacion,
    private readonly acciones: RegistroAccionesPuerto,
    private readonly reloj: Reloj,
    @Inject(URL_WEB_INSTALACION) private readonly urlWeb: string,
  ) {}

  activas(): Promise<InvitacionActiva[]> {
    return this.invitaciones.activas(this.reloj.ahora());
  }

  /** `POST /admin/invitaciones { correo }` → `{ enlace, vence }`: el token solo viaja en el enlace. */
  async crear(adminId: string, cuerpo: unknown): Promise<InvitacionCreada> {
    const correo = correoDe(cuerpo);
    const ahora = this.reloj.ahora();
    const token = this.tokens.generar();
    const invitacion = await this.invitaciones.crear({
      correo,
      hashToken: this.tokens.huella(token),
      vence: venceDe(ahora),
      creadaPor: adminId,
      creado: ahora,
    });
    await this.acciones.registrar({ adminId, accion: ACCION_CREAR_INVITACION, detalle: correo, creado: ahora });
    const enlace = `${this.urlWeb}${RUTA_REGISTRO}?invitacion=${encodeURIComponent(token)}`;
    return { id: invitacion.id, enlace, vence: invitacion.vence };
  }

  async revocar(adminId: string, id: string): Promise<void> {
    const invitacion = await this.invitaciones.porId(id);
    if (!invitacion || invitacion.revocada) throw new InvitacionNoEncontrada();
    const ahora = this.reloj.ahora();
    await this.invitaciones.revocar(id, ahora);
    await this.acciones.registrar({ adminId, accion: ACCION_REVOCAR_INVITACION, detalle: invitacion.correo, creado: ahora });
  }
}

function correoDe(cuerpo: unknown): string {
  const { correo } = (cuerpo ?? {}) as Record<string, unknown>;
  const normalizado = typeof correo === "string" ? normalizarCorreo(correo) : "";
  if (!CORREO.test(normalizado)) throw new AjusteInvalido("Escribe un correo válido.");
  return normalizado;
}
