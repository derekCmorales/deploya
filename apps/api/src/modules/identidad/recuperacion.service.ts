import { Inject, Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { CorreoPuerto, PLANTILLA_RECUPERACION } from "../notificaciones";
import { CONFIGURACION_IDENTIDAD, type ConfiguracionIdentidad } from "./configuracion-identidad";
import { motivoInvalidez, normalizarCorreo, VIGENCIA_RECUPERACION_MS, type Usuario } from "./dominio/cuenta";
import { ContrasenaDebil, CorreoInvalido, TokenNoValido } from "./dominio/errores";
import { PoliticaContrasena } from "./dominio/politica-contrasena";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RepositorioSesiones } from "./puertos/repositorio-sesiones.puerto";
import { RepositorioTokensCuenta } from "./puertos/repositorio-tokens-cuenta.puerto";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";

export interface SolicitudRestablecer {
  token: string;
  contrasena: string;
}

/**
 * M1-05: recuperar la contraseña. Un caso de uso aparte de `IdentidadService` (registro)
 * y de `SesionService` (login). La solicitud nunca revela si la cuenta existe.
 */
@Injectable()
export class RecuperacionService {
  private readonly registro = new Logger(RecuperacionService.name);
  private readonly politica = new PoliticaContrasena();

  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly tokens: RepositorioTokensCuenta,
    private readonly sesiones: RepositorioSesiones,
    private readonly hash: HashContrasena,
    private readonly generador: GeneradorToken,
    private readonly correo: CorreoPuerto,
    private readonly reloj: Reloj,
    @Inject(CONFIGURACION_IDENTIDAD) private readonly configuracion: ConfiguracionIdentidad,
  ) {}

  /** Solo una cuenta Activa recibe el enlace; en cualquier otro caso no pasa nada visible. */
  async solicitar(correo: string): Promise<void> {
    const usuario = await this.usuarioActivo(correo);
    if (!usuario) return;

    const creado = this.reloj.ahora();
    await this.tokens.invalidarVigentes(usuario.id, "recuperacion", creado);
    const token = this.generador.generar();
    await this.tokens.crear({
      usuarioId: usuario.id,
      tipo: "recuperacion",
      hashToken: this.generador.huella(token),
      expira: new Date(creado.getTime() + VIGENCIA_RECUPERACION_MS),
      creado,
    });
    const enlace = `${this.configuracion.urlWeb}/restablecer?token=${encodeURIComponent(token)}`;
    // Sin esperar el envío: la respuesta tarda lo mismo exista o no la cuenta (design.md, riesgos).
    void this.correo.enviar(usuario.correo, PLANTILLA_RECUPERACION, { enlace }).catch((error: Error) => this.registro.warn(error.message));
  }

  /** La política se valida antes de tocar el token: una contraseña débil no lo consume. */
  async restablecer(solicitud: SolicitudRestablecer): Promise<void> {
    const politica = this.politica.validar(solicitud.contrasena);
    if (!politica.valida) throw new ContrasenaDebil(politica.incumplidas);

    const ahora = this.reloj.ahora();
    const guardado = await this.tokens.porHuella(this.generador.huella(solicitud.token));
    const motivo = motivoInvalidez(guardado?.tipo === "recuperacion" ? guardado : null, ahora);
    if (motivo || !guardado) throw new TokenNoValido(motivo ?? "inexistente");

    await this.usuarios.cambiarHash(guardado.usuarioId, await this.hash.calcular(solicitud.contrasena));
    await this.tokens.marcarUsado(guardado.id, ahora);
    await this.sesiones.revocarTodasDe(guardado.usuarioId, ahora);
  }

  private async usuarioActivo(correo: string): Promise<Usuario | null> {
    try {
      const usuario = await this.usuarios.porCorreo(normalizarCorreo(correo));
      return usuario?.estadoCuenta === "activa" ? usuario : null;
    } catch (error) {
      if (error instanceof CorreoInvalido) return null;
      throw error;
    }
  }
}
