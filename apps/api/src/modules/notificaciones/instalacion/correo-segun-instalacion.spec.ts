import { RelojFijo } from "../../../compartido/reloj";
import { CifradorFalso } from "../../proyectos/adaptadores/cifrador-falso";
import { RepositorioConfiguracionInstalacionMemoria } from "../../suscripciones/modo/repositorio-configuracion-instalacion.memoria";
import { CorreoConRegistro } from "../adaptadores/correo-con-registro";
import type { TransporteSmtp } from "../adaptadores/correo-smtp.adaptador";
import type { ConfiguracionCorreo } from "../configuracion-correo";
import { CorreoNoEnviado } from "../dominio/errores";
import type { PlantillaCorreo } from "../dominio/plantilla-correo";
import { PLANTILLA_PRUEBA } from "../dominio/plantilla-prueba";
import { PLANTILLA_VERIFICACION } from "../dominio/plantilla-verificacion";
import { CORREO_POR_MODO } from "../notificaciones.module";
import { CorreoPuerto } from "../puertos/correo.puerto";
import { RegistroEnviosCorreo, type EnvioCorreo } from "../puertos/registro-envios.puerto";
import { CorreoSegunInstalacion } from "./correo-segun-instalacion";
import { configuracionDeSmtp, fabricaCorreoSmtp } from "./correo-smtp-de";
import { PruebaCorreoSmtp } from "./prueba-correo-smtp";

const DATOS = { nombre: "Ops", correo: "ops@miempresa.com", enlace: "https://apps.miempresa.com/verificar?token=t" };

class CorreoEspia extends CorreoPuerto {
  readonly enviados: { para: string; asunto: string }[] = [];
  async enviar<D extends { enlace: string }>(destinatario: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    this.enviados.push({ para: destinatario, asunto: plantilla.componer(datos).asunto });
  }
}

class RegistroEnMemoria extends RegistroEnviosCorreo {
  anotado: EnvioCorreo | null = null;
  async registrar(envio: EnvioCorreo): Promise<void> {
    this.anotado = envio;
  }
  async ultimo(): Promise<EnvioCorreo | null> {
    return this.anotado;
  }
}

/** Transportes falsos por servidor: lo que se mandó y con qué credenciales, sin abrir conexiones. */
function transportes() {
  const usados: { configuracion: ConfiguracionCorreo; para: string; de: string }[] = [];
  const crear = (configuracion: ConfiguracionCorreo): TransporteSmtp => ({
    sendMail: async ({ to, from }) => {
      if (configuracion.clave === "mala") throw new Error("535 5.7.8 Username and Password not accepted");
      usados.push({ configuracion, para: to, de: from });
    },
  });
  return { usados, fabricar: fabricaCorreoSmtp(crear) };
}

function armar() {
  const configuracion = new RepositorioConfiguracionInstalacionMemoria();
  const cifrador = new CifradorFalso();
  const entorno = new CorreoEspia();
  const { usados, fabricar } = transportes();
  const correo = new CorreoSegunInstalacion(configuracion, cifrador, entorno, fabricar);
  const guardarSmtp = (clave: string) =>
    configuracion.guardarCorreo({
      tipo: "smtp",
      smtp: { host: "smtp.miempresa.com", puerto: 587, usuario: "deploya@miempresa.com", claveCifrada: cifrador.cifrar(clave), remitente: "deploya <no-responder@miempresa.com>" },
    });
  return { configuracion, entorno, usados, correo, guardarSmtp, fabricar };
}

describe("SP-17 · Correo de la instalación (M10)", () => {
  it("SMTP guardado", async () => {
    const { correo, usados, entorno, guardarSmtp } = armar();
    await guardarSmtp("clave-del-smtp");

    await correo.enviar("ops@miempresa.com", PLANTILLA_VERIFICACION, DATOS);

    expect(usados).toEqual([
      {
        configuracion: { adaptador: "smtp", host: "smtp.miempresa.com", puerto: 587, usuario: "deploya@miempresa.com", clave: "clave-del-smtp", remitente: "deploya <no-responder@miempresa.com>" },
        para: "ops@miempresa.com",
        de: "deploya <no-responder@miempresa.com>",
      },
    ]);
    expect(entorno.enviados).toEqual([]);
  });

  it("Sin correo", async () => {
    const { correo, configuracion, usados, entorno } = armar();
    await configuracion.guardarCorreo({ tipo: "sin-correo" });

    await expect(correo.enviar("ops@miempresa.com", PLANTILLA_VERIFICACION, DATOS)).resolves.toBeUndefined();

    expect(usados).toEqual([]);
    expect(entorno.enviados).toEqual([]);
  });

  it("Sin configurar", async () => {
    const { correo, entorno, usados } = armar();

    await correo.enviar("ops@miempresa.com", PLANTILLA_VERIFICACION, DATOS);

    expect(entorno.enviados).toEqual([{ para: "ops@miempresa.com", asunto: "Confirma tu correo en deploya" }]);
    expect(usados).toEqual([]);
  });

  it("guardar otro SMTP aplica en el siguiente envío, sin reiniciar", async () => {
    const { correo, usados, guardarSmtp, configuracion } = armar();
    await guardarSmtp("primera");
    await correo.enviar("a@miempresa.com", PLANTILLA_VERIFICACION, DATOS);
    await configuracion.guardarCorreo({
      tipo: "smtp",
      smtp: { host: "smtp.otro.com", puerto: 465, usuario: "u", claveCifrada: new CifradorFalso().cifrar("segunda"), remitente: "otro <x@otro.com>" },
    });

    await correo.enviar("b@miempresa.com", PLANTILLA_VERIFICACION, DATOS);

    expect(usados.map((u) => [u.configuracion.host, u.configuracion.clave])).toEqual([
      ["smtp.miempresa.com", "primera"],
      ["smtp.otro.com", "segunda"],
    ]);
  });

  it("el registro del último envío sigue funcionando dentro de CorreoConRegistro", async () => {
    const { correo, guardarSmtp } = armar();
    const registro = new RegistroEnMemoria();
    const conRegistro = new CorreoConRegistro(correo, registro, new RelojFijo(new Date("2026-10-25T15:00:00.000Z")));
    await guardarSmtp("mala");

    await expect(conRegistro.enviar("ops@miempresa.com", PLANTILLA_VERIFICACION, DATOS)).rejects.toBeInstanceOf(CorreoNoEnviado);

    expect(await registro.ultimo()).toEqual({
      en: new Date("2026-10-25T15:00:00.000Z"),
      entregado: false,
      error: "535 5.7.8 Username and Password not accepted",
    });
  });

  it("si no se puede leer la configuración o descifrar la clave, quien envía recibe CorreoNoEnviado", async () => {
    const { correo, configuracion } = armar();
    await configuracion.guardarCorreo({
      tipo: "smtp",
      smtp: { host: "h", puerto: 25, usuario: "", claveCifrada: "no-es-cifrado", remitente: "r <r@r.com>" },
    });

    await expect(correo.enviar("ops@miempresa.com", PLANTILLA_VERIFICACION, DATOS)).rejects.toBeInstanceOf(CorreoNoEnviado);
    jest.spyOn(configuracion, "correo").mockRejectedValue(new Error("sin base"));
    await expect(correo.enviar("ops@miempresa.com", PLANTILLA_VERIFICACION, DATOS)).rejects.toThrow("sin base");
  });

  it("la nube manda siempre por las SMTP_* del entorno; autoalojado lee la instalación", () => {
    const { entorno, configuracion, fabricar } = armar();
    const dependencias = { configuracion, cifrador: new CifradorFalso(), fabricar };

    expect(CORREO_POR_MODO.nube(entorno, dependencias)).toBe(entorno);
    expect(CORREO_POR_MODO.autoalojado(entorno, dependencias)).toBeInstanceOf(CorreoSegunInstalacion);
  });
});

describe("SP-17 · Correo de prueba (M10)", () => {
  it("manda la plantilla de prueba por el SMTP recibido, sin guardarlo", async () => {
    const { usados, fabricar, configuracion } = armar();
    const smtp = { host: "smtp.miempresa.com", puerto: 587, usuario: "u", contrasena: "c", remitente: "deploya <n@miempresa.com>" };

    await new PruebaCorreoSmtp(fabricar).probar(smtp, "ops@miempresa.com", "https://apps.miempresa.com/configurar");

    expect(usados).toEqual([{ configuracion: configuracionDeSmtp(smtp), para: "ops@miempresa.com", de: smtp.remitente }]);
    expect(await configuracion.correo()).toEqual({ tipo: "entorno" });
  });

  it("un rechazo del servidor llega como CorreoNoEnviado con su mensaje", async () => {
    const { fabricar } = armar();
    const smtp = { host: "h", puerto: 587, usuario: "u", contrasena: "mala", remitente: "r <r@r.com>" };

    await expect(new PruebaCorreoSmtp(fabricar).probar(smtp, "ops@miempresa.com", "https://x/configurar")).rejects.toMatchObject({
      causa: "535 5.7.8 Username and Password not accepted",
    });
  });

  it("la plantilla de prueba dice para qué sirve el servidor y manda seguir en la pestaña del asistente", () => {
    const mensaje = PLANTILLA_PRUEBA.componer({ enlace: "https://apps.miempresa.com" });

    expect(mensaje.asunto).toBe("Tu correo de deploya funciona");
    expect(mensaje.texto).toContain("la verificación de cuenta, la recuperación de contraseña y los avisos de despliegue");
    expect(mensaje.texto).toContain("Vuelve a la pestaña donde estás configurando deploya para continuar.");
    expect(mensaje.texto).toContain("Abrir deploya: https://apps.miempresa.com");
    expect(mensaje.texto).not.toContain("/configurar");
  });
});
