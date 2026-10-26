import { Inject, Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { CorreoNoEnviado, PruebaCorreoPuerto } from "../../notificaciones";
import { CifradorVariables } from "../../proyectos/puertos/cifrador-variables.puerto";
import { CodigoInvalido, CodigoVencido } from "../../suscripciones/dominio/errores";
import { AltaPrimerUsuario } from "../../suscripciones/modo/alta-primer-usuario.puerto";
import { RepositorioConfiguracionInstalacion } from "../../suscripciones/modo/repositorio-configuracion-instalacion.puerto";
import { CONFIGURACION_IDENTIDAD, type ConfiguracionIdentidad } from "../configuracion-identidad";
import { nombreDesdeCorreo, normalizarCorreo } from "../dominio/cuenta";
import { ContrasenaDebil, CorreoYaRegistrado } from "../dominio/errores";
import { NombreCuenta } from "../dominio/nombre-cuenta";
import { PoliticaContrasena } from "../dominio/politica-contrasena";
import { AsignacionSandboxPuerto } from "../puertos/asignacion-sandbox.puerto";
import { HashContrasena } from "../puertos/hash-contrasena.puerto";
import { RepositorioUsuarios } from "../puertos/repositorio-usuarios.puerto";
import { SesionService, type SesionIniciada } from "../sesion.service";
import { CorreoDePruebaRechazado, DemasiadosIntentosCodigo } from "./errores";
import { LimiteIntentos } from "./limite-intentos";
import { eligeSinCorreo, smtpDe } from "./smtp-solicitado";

/** Token de Nest del límite de intentos: una sola instancia por proceso. */
export const LIMITE_INTENTOS_CODIGO = Symbol("LIMITE_INTENTOS_CODIGO");

export interface SolicitudAdministrador {
  codigo: string;
  correo: string;
  contrasena: string;
  agenteUsuario: string | null;
}

export interface PruebaEntregada {
  entregado: true;
  ms: number;
}

/**
 * Asistente de primera configuración (31, SP-17; contrato instalacion.md § Primera configuración).
 * Código → administrador con la sesión iniciada → correo. El modo y la regla del código los decide
 * `AltaPrimerUsuario` (M2): en la nube o con administrador responde 404 sin que M1 lo pregunte.
 */
@Injectable()
export class PrimeraConfiguracionService {
  private readonly politica = new PoliticaContrasena();

  constructor(
    private readonly alta: AltaPrimerUsuario,
    private readonly usuarios: RepositorioUsuarios,
    private readonly hash: HashContrasena,
    private readonly sandbox: AsignacionSandboxPuerto,
    private readonly sesiones: SesionService,
    private readonly configuracion: RepositorioConfiguracionInstalacion,
    private readonly cifrador: CifradorVariables,
    private readonly prueba: PruebaCorreoPuerto,
    private readonly reloj: Reloj,
    @Inject(LIMITE_INTENTOS_CODIGO) private readonly limite: LimiteIntentos,
    @Inject(CONFIGURACION_IDENTIDAD) private readonly identidad: ConfiguracionIdentidad,
  ) {}

  /** Paso 1. Los fallos cuentan para el límite de 5 por origen cada 15 min. */
  async validarCodigo(codigo: string, origen: string): Promise<void> {
    const ahora = this.reloj.ahora();
    const espera = this.limite.espera(origen, ahora);
    if (espera > 0) throw new DemasiadosIntentosCodigo(espera);
    try {
      await this.alta.validarCodigo(codigo);
    } catch (error) {
      if (error instanceof CodigoInvalido || error instanceof CodigoVencido) this.limite.registrarFallo(origen, ahora);
      throw error;
    }
  }

  /**
   * Paso 2. Vuelve a validar el código (nadie salta el paso 1) y revisa la cuenta antes de
   * consumirlo: un correo o una contraseña que no sirven no gastan el código. `consumirCodigo`
   * va antes de crear la cuenta porque con un administrador ya creado M2 responde 404.
   */
  async crearAdministrador(solicitud: SolicitudAdministrador, origen: string): Promise<SesionIniciada> {
    await this.validarCodigo(solicitud.codigo, origen);
    const correo = normalizarCorreo(solicitud.correo);
    const politica = this.politica.validar(solicitud.contrasena);
    if (!politica.valida) throw new ContrasenaDebil(politica.incumplidas);
    if (await this.usuarios.porCorreo(correo)) throw new CorreoYaRegistrado(correo);

    await this.alta.consumirCodigo();
    const usuario = await this.usuarios.crear({
      correo,
      nombre: NombreCuenta.de(nombreDesdeCorreo(correo)).valor,
      hashContrasena: await this.hash.calcular(solicitud.contrasena),
      rol: "administrador",
      estadoCuenta: "activa",
      creado: this.reloj.ahora(),
    });
    await this.sandbox.asignarSandbox(usuario.id);
    return this.sesiones.iniciar({ correo, contrasena: solicitud.contrasena, agenteUsuario: solicitud.agenteUsuario });
  }

  /** Paso 4 · «Enviar correo de prueba» al administrador por el SMTP recibido, sin guardarlo. */
  async probarCorreo(cuerpo: unknown, destinatario: string): Promise<PruebaEntregada> {
    const smtp = smtpDe(cuerpo);
    const inicio = this.reloj.ahora().getTime();
    try {
      // El enlace abre la instalación, no el asistente: la configuración sigue en la pestaña donde se probó.
      await this.prueba.probar(smtp, destinatario, this.identidad.urlWeb);
    } catch (error) {
      if (error instanceof CorreoNoEnviado) throw new CorreoDePruebaRechazado(error.causa);
      throw error;
    }
    return { entregado: true, ms: this.reloj.ahora().getTime() - inicio };
  }

  /** Paso 4 · «Continuar»: el SMTP con la clave cifrada, o «Sin correo por ahora». Nunca el `.env`. */
  async guardarCorreo(cuerpo: unknown): Promise<void> {
    if (eligeSinCorreo(cuerpo)) {
      await this.configuracion.guardarCorreo({ tipo: "sin-correo" });
      return;
    }
    const { contrasena, ...smtp } = smtpDe(cuerpo);
    await this.configuracion.guardarCorreo({ tipo: "smtp", smtp: { ...smtp, claveCifrada: this.cifrador.cifrar(contrasena) } });
  }
}
