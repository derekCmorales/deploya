import { RelojFijo } from "../../../compartido/reloj";
import { CorreoNoEnviado, PruebaCorreoPuerto, type SmtpEnClaro } from "../../notificaciones";
import { CifradorFalso } from "../../proyectos/adaptadores/cifrador-falso";
import { CodigoInvalido, CodigoVencido, PrimeraConfiguracionNoDisponible } from "../../suscripciones/dominio/errores";
import { ConCodigoDeConfiguracion, hashDeCodigo } from "../../suscripciones/modo/altas";
import { RepositorioConfiguracionInstalacionMemoria } from "../../suscripciones/modo/repositorio-configuracion-instalacion.memoria";
import { RepositorioSesionesMemoria } from "../adaptadores/repositorio-sesiones.memoria";
import { RepositorioUsuariosMemoria } from "../adaptadores/repositorio-usuarios.memoria";
import { ContrasenaDebil } from "../dominio/errores";
import { AsignacionSandboxPuerto } from "../puertos/asignacion-sandbox.puerto";
import { GeneradorToken } from "../puertos/generador-token.puerto";
import { HashContrasena } from "../puertos/hash-contrasena.puerto";
import { SesionService } from "../sesion.service";
import { CorreoDePruebaRechazado, DatosCorreoInvalidos, DemasiadosIntentosCodigo } from "./errores";
import { LimiteIntentos, MAXIMO_INTENTOS_CODIGO, VENTANA_INTENTOS_MS } from "./limite-intentos";
import { PrimeraConfiguracionService } from "./primera-configuracion.service";

const CODIGO = "K7QP-M2XD";
const ADMIN = "ops@miempresa.com";
const CLAVE = "Admin#Clave2026";
const ORIGEN = "203.0.113.7";
const MS_POR_MINUTO = 60_000;
const SMTP: SmtpEnClaro = {
  host: "smtp.miempresa.com",
  puerto: 587,
  usuario: "deploya@miempresa.com",
  contrasena: "clave-del-smtp",
  remitente: "deploya <no-responder@miempresa.com>",
};

class HashFalso extends HashContrasena {
  async calcular(clave: string): Promise<string> {
    return `hash(${clave})`;
  }
  async coincide(clave: string, hash: string): Promise<boolean> {
    return hash === `hash(${clave})`;
  }
}

class GeneradorSecuencial extends GeneradorToken {
  private n = 0;
  generar(): string {
    return `token-${++this.n}`;
  }
  huella(token: string): string {
    return `huella-${token}`;
  }
}

class SandboxEspia extends AsignacionSandboxPuerto {
  readonly asignados: string[] = [];
  async asignarSandbox(usuarioId: string): Promise<void> {
    this.asignados.push(usuarioId);
  }
}

/** Una prueba de correo que tarda `ms` en el reloj fijo, o que el servidor rechaza. */
class PruebaCorreoFalsa extends PruebaCorreoPuerto {
  readonly enviadas: { smtp: SmtpEnClaro; destinatario: string; enlace: string }[] = [];
  rechazo: string | null = null;
  constructor(
    private readonly reloj: RelojFijo,
    private readonly ms: number,
  ) {
    super();
  }
  async probar(smtp: SmtpEnClaro, destinatario: string, enlace: string): Promise<void> {
    this.reloj.avanzar(this.ms);
    if (this.rechazo) throw new CorreoNoEnviado(destinatario, this.rechazo);
    this.enviadas.push({ smtp, destinatario, enlace });
  }
}

/** La fila única con «hay administrador» leído de las cuentas, como en la base. */
class ConfiguracionConCuentas extends RepositorioConfiguracionInstalacionMemoria {
  constructor(private readonly usuarios: RepositorioUsuariosMemoria) {
    super();
  }
  async hayAdministrador(): Promise<boolean> {
    return (await this.usuarios.porCorreo(ADMIN))?.rol === "administrador";
  }
}

function armar() {
  const reloj = new RelojFijo(new Date("2026-10-25T15:00:00.000Z"));
  const usuarios = new RepositorioUsuariosMemoria();
  const sesiones = new RepositorioSesionesMemoria();
  const configuracion = new ConfiguracionConCuentas(usuarios);
  configuracion.codigoGuardado = { hashCodigo: hashDeCodigo(CODIGO), codigoVence: new Date(reloj.ahora().getTime() + 30 * MS_POR_MINUTO) };
  const sandbox = new SandboxEspia();
  const prueba = new PruebaCorreoFalsa(reloj, 1200);
  const cifrador = new CifradorFalso();
  const hash = new HashFalso();
  const generador = new GeneradorSecuencial();
  const servicio = new PrimeraConfiguracionService(
    new ConCodigoDeConfiguracion(configuracion, reloj),
    usuarios,
    hash,
    sandbox,
    new SesionService(usuarios, sesiones, hash, generador, reloj),
    configuracion,
    cifrador,
    prueba,
    reloj,
    new LimiteIntentos(),
    { urlWeb: "https://apps.miempresa.com" },
  );
  const crear = (codigo = CODIGO, contrasena = CLAVE) =>
    servicio.crearAdministrador({ codigo, correo: ` ${ADMIN.toUpperCase()} `, contrasena, agenteUsuario: "Firefox" }, ORIGEN);
  return { servicio, reloj, usuarios, sesiones, configuracion, sandbox, prueba, cifrador, crear };
}

describe("SP-17 · Primera configuración (31)", () => {
  it("Código válido", async () => {
    const { servicio } = armar();

    await expect(servicio.validarCodigo(CODIGO, ORIGEN)).resolves.toBeUndefined();
  });

  it("Código vencido", async () => {
    const { servicio, reloj } = armar();
    reloj.avanzar(31 * MS_POR_MINUTO);

    const intento = servicio.validarCodigo(CODIGO, ORIGEN);

    await expect(intento).rejects.toBeInstanceOf(CodigoVencido);
    await expect(intento).rejects.toThrow("El código de configuración venció; genera otro con ./scripts/instalar.sh --codigo-nuevo.");
  });

  it("Código usado", async () => {
    const { servicio, crear } = armar();
    await crear();

    await expect(servicio.validarCodigo(CODIGO, ORIGEN)).rejects.toBeInstanceOf(PrimeraConfiguracionNoDisponible);
    await expect(crear()).rejects.toBeInstanceOf(PrimeraConfiguracionNoDisponible);
  });

  it("Sesión al crear el administrador", async () => {
    const { crear, usuarios, sesiones, configuracion, sandbox } = armar();

    const { token, usuario } = await crear();

    const cuenta = await usuarios.porCorreo(ADMIN);
    expect(cuenta).toMatchObject({ rol: "administrador", estadoCuenta: "activa", hashContrasena: `hash(${CLAVE})` });
    expect(usuario).toMatchObject({ correo: ADMIN, rol: "administrador" });
    expect(token).toBeTruthy();
    // El token que va en la cookie es el de una sesión vigente del administrador.
    expect([...sesiones.sesiones.values()]).toEqual([expect.objectContaining({ usuarioId: cuenta?.id, hashToken: `huella-${token}`, revocadaEn: null })]);
    expect(configuracion.codigoGuardado).toBeNull();
    expect(sandbox.asignados).toEqual([cuenta?.id]);
  });

  it("Administrador sin código", async () => {
    const { crear, usuarios, configuracion, reloj } = armar();

    await expect(crear("")).rejects.toBeInstanceOf(CodigoInvalido);
    await expect(crear("OTRO-CODIGO")).rejects.toBeInstanceOf(CodigoInvalido);
    reloj.avanzar(31 * MS_POR_MINUTO);
    await expect(crear()).rejects.toBeInstanceOf(CodigoVencido);

    expect(await usuarios.porCorreo(ADMIN)).toBeNull();
    expect(configuracion.codigoGuardado).not.toBeNull();
  });

  it("Correo de prueba", async () => {
    const { servicio, prueba } = armar();

    await expect(servicio.probarCorreo({ smtp: SMTP }, ADMIN)).resolves.toEqual({ entregado: true, ms: 1200 });
    expect(prueba.enviadas).toEqual([{ smtp: SMTP, destinatario: ADMIN, enlace: "https://apps.miempresa.com" }]);
  });

  it("SMTP rechazado", async () => {
    const { servicio, prueba, configuracion } = armar();
    prueba.rechazo = "535 5.7.8 Username and Password not accepted";

    const intento = servicio.probarCorreo({ smtp: SMTP }, ADMIN);

    await expect(intento).rejects.toBeInstanceOf(CorreoDePruebaRechazado);
    await expect(intento).rejects.toMatchObject({ error: "535 5.7.8 Username and Password not accepted" });
    // Puede corregir o elegir «Sin correo por ahora»: nada quedó guardado.
    expect(configuracion.correoGuardado).toEqual({ tipo: "entorno" });
    await servicio.guardarCorreo({ sinCorreo: true });
    expect(configuracion.correoGuardado).toEqual({ tipo: "sin-correo" });
  });

  it("Correo guardado sin editar archivos", async () => {
    const { servicio, configuracion, cifrador } = armar();

    await servicio.guardarCorreo({ smtp: SMTP });

    const guardado = configuracion.correoGuardado;
    expect(guardado.tipo).toBe("smtp");
    if (guardado.tipo !== "smtp") return;
    expect(guardado.smtp).toEqual({ host: SMTP.host, puerto: 587, usuario: SMTP.usuario, remitente: SMTP.remitente, claveCifrada: expect.any(String) });
    expect(guardado.smtp.claveCifrada).not.toContain(SMTP.contrasena);
    expect(cifrador.descifrar(guardado.smtp.claveCifrada)).toBe(SMTP.contrasena);
  });

  it("Ya configurada", async () => {
    const { servicio, crear } = armar();
    await crear();

    await expect(servicio.validarCodigo("OTRO-CODIGO", ORIGEN)).rejects.toBeInstanceOf(PrimeraConfiguracionNoDisponible);
  });
});

describe("SP-17 · Reglas del asistente", () => {
  it("una contraseña débil no gasta el código ni crea la cuenta", async () => {
    const { crear, configuracion, usuarios } = armar();

    await expect(crear(CODIGO, "corta")).rejects.toBeInstanceOf(ContrasenaDebil);

    expect(configuracion.codigoGuardado).not.toBeNull();
    expect(await usuarios.porCorreo(ADMIN)).toBeNull();
  });

  it("crear el administrador sin el código correcto no crea nada (nadie salta el paso 1)", async () => {
    const { crear, usuarios } = armar();

    await expect(crear("OTRO-CODIGO")).rejects.toBeInstanceOf(CodigoInvalido);
    expect(await usuarios.porCorreo(ADMIN)).toBeNull();
  });

  it("5 códigos fallidos desde el mismo origen bloquean 15 min; otro origen sigue", async () => {
    const { servicio, reloj } = armar();
    for (let i = 0; i < MAXIMO_INTENTOS_CODIGO; i++) {
      await expect(servicio.validarCodigo("MAL", ORIGEN)).rejects.toBeInstanceOf(CodigoInvalido);
    }

    await expect(servicio.validarCodigo(CODIGO, ORIGEN)).rejects.toBeInstanceOf(DemasiadosIntentosCodigo);
    await expect(servicio.validarCodigo(CODIGO, "198.51.100.2")).resolves.toBeUndefined();
    reloj.avanzar(VENTANA_INTENTOS_MS);
    await expect(servicio.validarCodigo(CODIGO, ORIGEN)).resolves.toBeUndefined();
  });

  it("un SMTP sin servidor o con un puerto fuera de rango no se prueba ni se guarda", async () => {
    const { servicio, prueba, configuracion } = armar();

    await expect(servicio.probarCorreo({ smtp: { ...SMTP, host: " " } }, ADMIN)).rejects.toMatchObject({ campo: "host" });
    await expect(servicio.guardarCorreo({ smtp: { ...SMTP, puerto: 70000 } })).rejects.toBeInstanceOf(DatosCorreoInvalidos);
    await expect(servicio.guardarCorreo({})).rejects.toMatchObject({ campo: "smtp" });

    expect(prueba.enviadas).toEqual([]);
    expect(configuracion.correoGuardado).toEqual({ tipo: "entorno" });
  });

  it("un error que no es del SMTP no se disfraza de rechazo", async () => {
    const { servicio, prueba } = armar();
    jest.spyOn(prueba, "probar").mockRejectedValue(new Error("se cayó la red"));

    const intento = servicio.probarCorreo({ smtp: SMTP }, ADMIN);

    await expect(intento).rejects.toThrow("se cayó la red");
    await expect(intento).rejects.not.toBeInstanceOf(CorreoDePruebaRechazado);
  });
});
