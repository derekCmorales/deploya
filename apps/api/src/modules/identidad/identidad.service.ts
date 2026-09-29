import { Inject, Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { CorreoNoEnviado, CorreoPuerto, PLANTILLA_VERIFICACION } from "../notificaciones";
import { CONFIGURACION_IDENTIDAD, type ConfiguracionIdentidad } from "./configuracion-identidad";
import {
  enmascararCorreo,
  HORAS_VIGENCIA_VERIFICACION,
  motivoInvalidez,
  MS_POR_HORA,
  nombreDesdeCorreo,
  normalizarCorreo,
  type EstadoCuenta,
  type Usuario,
} from "./dominio/cuenta";
import { ContrasenaDebil, CorreoYaRegistrado, TokenNoValido } from "./dominio/errores";
import { PoliticaContrasena } from "./dominio/politica-contrasena";
import { AsignacionSandboxPuerto } from "./puertos/asignacion-sandbox.puerto";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RepositorioTokensCuenta } from "./puertos/repositorio-tokens-cuenta.puerto";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";

export interface SolicitudRegistro {
  correo: string;
  contrasena: string;
}

/** Respuesta de `POST /identidad/registro` (pantalla 01b · Cuenta creada). */
export interface CuentaRegistrada {
  usuarioId: string;
  correoEnmascarado: string;
  estadoCuenta: EstadoCuenta;
  correoEnviado: boolean;
}

export interface CuentaVerificada {
  estadoCuenta: EstadoCuenta;
}

/**
 * M1: orquesta registro y verificación. No arma HTML ni habla SMTP (M10), no calcula
 * hashes (puerto) y no lee el reloj del sistema (Reloj inyectado).
 */
@Injectable()
export class IdentidadService {
  private readonly registro = new Logger(IdentidadService.name);
  private readonly politica = new PoliticaContrasena();

  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly tokens: RepositorioTokensCuenta,
    private readonly hash: HashContrasena,
    private readonly generador: GeneradorToken,
    private readonly correo: CorreoPuerto,
    private readonly sandbox: AsignacionSandboxPuerto,
    private readonly reloj: Reloj,
    @Inject(CONFIGURACION_IDENTIDAD) private readonly configuracion: ConfiguracionIdentidad,
  ) {}

  async registrar(solicitud: SolicitudRegistro): Promise<CuentaRegistrada> {
    const correo = normalizarCorreo(solicitud.correo);
    const politica = this.politica.validar(solicitud.contrasena);
    if (!politica.valida) throw new ContrasenaDebil(politica.incumplidas);
    if (await this.usuarios.porCorreo(correo)) throw new CorreoYaRegistrado(correo);

    const usuario = await this.usuarios.crear({
      correo,
      nombre: nombreDesdeCorreo(correo),
      hashContrasena: await this.hash.calcular(solicitud.contrasena),
      rol: "cliente",
      estadoCuenta: "pendiente",
      creado: this.reloj.ahora(),
    });
    await this.sandbox.asignarSandbox(usuario.id);
    const correoEnviado = await this.enviarVerificacion(usuario);
    return {
      usuarioId: usuario.id,
      correoEnmascarado: enmascararCorreo(correo),
      estadoCuenta: usuario.estadoCuenta,
      correoEnviado,
    };
  }

  async verificar(token: string): Promise<CuentaVerificada> {
    const ahora = this.reloj.ahora();
    const guardado = await this.tokens.porHuella(this.generador.huella(token));
    const motivo = motivoInvalidez(guardado?.tipo === "verificacion" ? guardado : null, ahora);
    if (motivo || !guardado) throw new TokenNoValido(motivo ?? "inexistente");

    const usuario = await this.usuarios.porId(guardado.usuarioId);
    if (!usuario) throw new TokenNoValido("inexistente");
    await this.tokens.marcarUsado(guardado.id, ahora);
    if (usuario.estadoCuenta !== "pendiente") return { estadoCuenta: usuario.estadoCuenta };
    await this.usuarios.cambiarEstado(usuario.id, "activa");
    return { estadoCuenta: "activa" };
  }

  /**
   * La cuenta ya existe aunque el correo falle: se informa `correoEnviado: false` y el
   * reenvío (M1-04, A2) lo resuelve. Cualquier adaptador falla con el mismo error (LSP).
   */
  private async enviarVerificacion(usuario: Usuario): Promise<boolean> {
    const token = this.generador.generar();
    const creado = this.reloj.ahora();
    await this.tokens.crear({
      usuarioId: usuario.id,
      tipo: "verificacion",
      hashToken: this.generador.huella(token),
      expira: new Date(creado.getTime() + HORAS_VIGENCIA_VERIFICACION * MS_POR_HORA),
      creado,
    });
    const enlace = `${this.configuracion.urlWeb}/verificar?token=${encodeURIComponent(token)}`;
    try {
      await this.correo.enviar(usuario.correo, PLANTILLA_VERIFICACION, { nombre: usuario.nombre, correo: usuario.correo, enlace });
      return true;
    } catch (error) {
      if (!(error instanceof CorreoNoEnviado)) throw error;
      this.registro.warn(error.message);
      return false;
    }
  }
}
