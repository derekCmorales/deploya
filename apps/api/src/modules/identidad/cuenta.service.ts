import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import type { Rol, Usuario } from "./dominio/cuenta";
import { ContrasenaActualIncorrecta, ContrasenaDebil, CuentaInexistente } from "./dominio/errores";
import { NombreCuenta } from "./dominio/nombre-cuenta";
import { PoliticaContrasena } from "./dominio/politica-contrasena";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RepositorioSesiones } from "./puertos/repositorio-sesiones.puerto";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";

/** Pantalla 05: lo que ve el cliente en «Mi cuenta»; correo y rol son de solo lectura. */
export interface PerfilCuenta {
  nombre: string;
  correo: string;
  rol: Rol;
  verificado: boolean;
  creado: Date;
}

export interface CambioContrasena {
  actual: string;
  nueva: string;
}

/**
 * M1-06 y M1-07: «Mi cuenta». Caso de uso aparte del registro, del login y de la recuperación.
 * Las reglas viven en `NombreCuenta` y `PoliticaContrasena`; este servicio solo orquesta.
 */
@Injectable()
export class CuentaService {
  private readonly politica = new PoliticaContrasena();

  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly sesiones: RepositorioSesiones,
    private readonly hash: HashContrasena,
    private readonly generador: GeneradorToken,
    private readonly reloj: Reloj,
  ) {}

  async perfil(usuarioId: string): Promise<PerfilCuenta> {
    return perfilDe(await this.usuario(usuarioId));
  }

  /** El nombre se recorta y se valida antes de guardar: si no cumple, no cambia nada. */
  async renombrar(usuarioId: string, nombre: string): Promise<PerfilCuenta> {
    const valido = NombreCuenta.de(nombre);
    const usuario = await this.usuario(usuarioId);
    await this.usuarios.cambiarNombre(usuario.id, valido.valor);
    return perfilDe({ ...usuario, nombre: valido.valor });
  }

  /**
   * Comprueba la actual, aplica la política del registro, guarda el hash nuevo y cierra las
   * demás sesiones. La sesión desde la que se cambia (la del token de la cookie) sigue viva.
   */
  async cambiarContrasena(usuarioId: string, tokenSesion: string, cambio: CambioContrasena): Promise<void> {
    const usuario = await this.usuario(usuarioId);
    if (!(await this.hash.coincide(cambio.actual, usuario.hashContrasena))) throw new ContrasenaActualIncorrecta();
    const politica = this.politica.validar(cambio.nueva);
    if (!politica.valida) throw new ContrasenaDebil(politica.incumplidas);

    const ahora = this.reloj.ahora();
    await this.usuarios.cambiarHash(usuario.id, await this.hash.calcular(cambio.nueva));
    const actual = await this.sesiones.porHuella(this.generador.huella(tokenSesion));
    if (actual) await this.sesiones.revocarTodasMenos(usuario.id, actual.id, ahora);
    else await this.sesiones.revocarTodasDe(usuario.id, ahora);
  }

  /** «Cerrar todas» (05b): todas las sesiones, incluida la actual; la cookie la borra el controlador. */
  async cerrarTodas(usuarioId: string): Promise<void> {
    await this.sesiones.revocarTodasDe(usuarioId, this.reloj.ahora());
  }

  /** `SesionGuard` ya garantizó que la cuenta existe y está activa. */
  private async usuario(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuarios.porId(usuarioId);
    if (!usuario) throw new CuentaInexistente(usuarioId);
    return usuario;
  }
}

function perfilDe(usuario: Usuario): PerfilCuenta {
  return {
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    verificado: usuario.estadoCuenta !== "pendiente",
    creado: usuario.creado,
  };
}
