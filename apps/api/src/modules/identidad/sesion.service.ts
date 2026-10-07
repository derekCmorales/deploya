import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { enmascararCorreo, normalizarCorreo, type Usuario } from "./dominio/cuenta";
import { CorreoInvalido, CredencialesInvalidas, CuentaNoVerificada, CuentaSuspendida } from "./dominio/errores";
import { debeRefrescarActividad, sesionVigente, type UsuarioSesion } from "./dominio/sesion";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RepositorioSesiones } from "./puertos/repositorio-sesiones.puerto";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";

export interface Credenciales {
  correo: string;
  contrasena: string;
  agenteUsuario?: string | null;
}

/** El token va solo en la cookie; la respuesta JSON lleva únicamente el usuario. */
export interface SesionIniciada {
  token: string;
  usuario: UsuarioSesion;
}

function usuarioDeSesion(usuario: Usuario): UsuarioSesion {
  return { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre, rol: usuario.rol };
}

/**
 * M1-03: iniciar y cerrar sesión, y resolver la cookie al usuario (lo usa `SesionGuard`).
 * Separado de `IdentidadService` (registro y verificación) por responsabilidad única.
 */
@Injectable()
export class SesionService {
  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly sesiones: RepositorioSesiones,
    private readonly hash: HashContrasena,
    private readonly generador: GeneradorToken,
    private readonly reloj: Reloj,
  ) {}

  async iniciar(credenciales: Credenciales): Promise<SesionIniciada> {
    const usuario = await this.usuarioConClave(credenciales.correo, credenciales.contrasena);
    if (usuario.estadoCuenta === "pendiente") throw new CuentaNoVerificada(enmascararCorreo(usuario.correo));
    if (usuario.estadoCuenta === "suspendida") throw new CuentaSuspendida();

    const token = this.generador.generar();
    const ahora = this.reloj.ahora();
    await this.sesiones.crear({
      usuarioId: usuario.id,
      hashToken: this.generador.huella(token),
      creada: ahora,
      ultimaActividad: ahora,
      agenteUsuario: credenciales.agenteUsuario ?? null,
    });
    return { token, usuario: usuarioDeSesion(usuario) };
  }

  /** Idempotente: cerrar una sesión inexistente o ya cerrada no es un error. */
  async cerrar(token: string): Promise<void> {
    const sesion = await this.sesiones.porHuella(this.generador.huella(token));
    if (sesion && !sesion.revocadaEn) await this.sesiones.revocar(sesion.id, this.reloj.ahora());
  }

  /** `null` si la cookie no corresponde a una sesión vigente de una cuenta activa. */
  async usuarioDe(token: string): Promise<UsuarioSesion | null> {
    const ahora = this.reloj.ahora();
    const sesion = await this.sesiones.porHuella(this.generador.huella(token));
    if (!sesionVigente(sesion, ahora)) return null;
    const usuario = await this.usuarios.porId(sesion.usuarioId);
    if (!usuario || usuario.estadoCuenta !== "activa") return null;
    if (debeRefrescarActividad(sesion, ahora)) await this.sesiones.registrarActividad(sesion.id, ahora);
    return usuarioDeSesion(usuario);
  }

  private async usuarioConClave(correo: string, contrasena: string): Promise<Usuario> {
    const usuario = await this.usuarios.porCorreo(this.normalizado(correo));
    if (!usuario || !(await this.hash.coincide(contrasena, usuario.hashContrasena))) throw new CredencialesInvalidas();
    return usuario;
  }

  /** Un correo mal formado tampoco revela nada: mismas credenciales inválidas. */
  private normalizado(correo: string): string {
    try {
      return normalizarCorreo(correo);
    } catch (error) {
      if (error instanceof CorreoInvalido) throw new CredencialesInvalidas();
      throw error;
    }
  }
}
