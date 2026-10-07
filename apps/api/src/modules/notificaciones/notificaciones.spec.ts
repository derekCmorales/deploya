import { CorreoConsolaAdaptador } from "./adaptadores/correo-consola.adaptador";
import { CorreoSmtpAdaptador, type TransporteSmtp } from "./adaptadores/correo-smtp.adaptador";
import { configuracionCorreoDesde, correoSegun } from "./configuracion-correo";
import { CorreoNoEnviado } from "./dominio/errores";
import { escaparHtml } from "./dominio/plantilla-correo";
import { PLANTILLA_RECUPERACION } from "./dominio/plantilla-recuperacion";
import { PLANTILLA_VERIFICACION, type DatosVerificacion } from "./dominio/plantilla-verificacion";

const DATOS: DatosVerificacion = {
  nombre: "Derek",
  correo: "derek@tiendademo.com",
  enlace: "http://localhost:3000/verificar?token=abc123",
};

function transporteQueGuarda() {
  const enviados: Parameters<TransporteSmtp["sendMail"]>[0][] = [];
  const transporte: TransporteSmtp = {
    sendMail: async (opciones) => {
      enviados.push(opciones);
      return {};
    },
  };
  return { transporte, enviados };
}

const transporteCaido: TransporteSmtp = {
  sendMail: async () => {
    throw new Error("535 credenciales inválidas");
  },
};

describe("M10 · plantilla de verificación (pantalla 24)", () => {
  it("incluye el botón «Verificar correo» y el enlace en texto plano", () => {
    const mensaje = PLANTILLA_VERIFICACION.componer(DATOS);

    expect(mensaje.html).toContain(`href="${DATOS.enlace}"`);
    expect(mensaje.html).toContain("Verificar correo");
    expect(mensaje.html).toContain("¿El botón no funciona? Copia este enlace:");
    expect(mensaje.texto).toContain(DATOS.enlace);
  });

  it("Correo de verificación: saluda por nombre, nombra el correo y avisa que caduca en 24 horas", () => {
    const mensaje = PLANTILLA_VERIFICACION.componer(DATOS);

    expect(mensaje.asunto).toBe("Confirma tu correo en deploya");
    expect(mensaje.texto).toContain("Hola Derek, para activar tu cuenta en deploya confirma que derek@tiendademo.com es tuyo.");
    expect(mensaje.texto).toContain("El enlace caduca en 24 horas.");
    expect(mensaje.texto).toContain("deploya · soporte@deploya.app");
  });

  it("escapa el HTML de los datos que vienen del usuario", () => {
    expect(escaparHtml(`<b>"x"&'y'</b>`)).toBe("&lt;b&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/b&gt;");
  });
});

describe("M10-02 · plantilla de recuperación (pantalla 24)", () => {
  const ENLACE = "http://localhost:3000/restablecer?token=abc123";

  it("Correo de recuperación", () => {
    const mensaje = PLANTILLA_RECUPERACION.componer({ enlace: ENLACE });

    expect(mensaje.asunto).toBe("Restablece tu contraseña de deploya");
    expect(mensaje.html).toContain(`href="${ENLACE}"`);
    expect(mensaje.html).toContain("Crear contraseña nueva");
    expect(mensaje.html).toContain("¿El botón no funciona? Copia este enlace:");
    expect(mensaje.texto).toContain(`Crear contraseña nueva: ${ENLACE}`);
    expect(mensaje.texto).toContain("Pediste crear una contraseña nueva. El enlace sirve una sola vez y caduca en 30 minutos.");
    expect(mensaje.texto).toContain("deploya · soporte@deploya.app");
  });

  it("Recuperación no pedida", () => {
    const mensaje = PLANTILLA_RECUPERACION.componer({ enlace: ENLACE });

    expect(mensaje.html).toContain("Si no lo pediste, no hagas nada: tu contraseña sigue igual.");
    expect(mensaje.texto).toContain("Si no lo pediste, no hagas nada: tu contraseña sigue igual.");
  });

  it("escapa el enlace dentro del HTML", () => {
    const mensaje = PLANTILLA_RECUPERACION.componer({ enlace: `http://x/restablecer?token=a"><script>` });

    expect(mensaje.html).not.toContain("<script>");
    expect(mensaje.html).toContain("&quot;&gt;&lt;script&gt;");
  });
});

describe("M10 · binding de CorreoPuerto por configuración", () => {
  it("Pruebas sin servidor de correo: con CORREO_ADAPTADOR=consola usa el adaptador de consola y no abre SMTP", () => {
    const crearTransporte = jest.fn();

    const correo = correoSegun(configuracionCorreoDesde({ CORREO_ADAPTADOR: "consola" }), crearTransporte);

    expect(correo).toBeInstanceOf(CorreoConsolaAdaptador);
    expect(crearTransporte).not.toHaveBeenCalled();
  });

  it("Producción con proveedor externo: con CORREO_ADAPTADOR=smtp usa SMTP con las credenciales de las variables", () => {
    const crearTransporte = jest.fn(() => transporteQueGuarda().transporte);
    const entorno = { CORREO_ADAPTADOR: "smtp", SMTP_HOST: "smtp.resend.com", SMTP_PORT: "465", SMTP_USUARIO: "resend", SMTP_CLAVE: "re_x" };

    const correo = correoSegun(configuracionCorreoDesde(entorno), crearTransporte);

    expect(correo).toBeInstanceOf(CorreoSmtpAdaptador);
    expect(crearTransporte).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.resend.com", puerto: 465, usuario: "resend", clave: "re_x" }),
    );
  });

  it("Cambio de proveedor: sin variables apunta a Mailpit (localhost:1025) y solo las variables lo cambian", () => {
    const configuracion = configuracionCorreoDesde({});

    expect(configuracion).toEqual(expect.objectContaining({ adaptador: "smtp", host: "localhost", puerto: 1025 }));
  });
});

describe("M10 · adaptadores", () => {
  it("Envío de verificación: el adaptador SMTP entrega asunto, HTML y texto al transporte (Mailpit)", async () => {
    const { transporte, enviados } = transporteQueGuarda();
    const correo = new CorreoSmtpAdaptador(transporte, "Deploya <no-responder@deploya.localhost>");

    await correo.enviar(DATOS.correo, PLANTILLA_VERIFICACION, DATOS);

    expect(enviados).toEqual([
      expect.objectContaining({
        from: "Deploya <no-responder@deploya.localhost>",
        to: "derek@tiendademo.com",
        subject: "Confirma tu correo en deploya",
      }),
    ]);
  });

  it("Falla del proveedor: el adaptador SMTP lanza CorreoNoEnviado", async () => {
    const correo = new CorreoSmtpAdaptador(transporteCaido, "Deploya <x@y>");

    await expect(correo.enviar(DATOS.correo, PLANTILLA_VERIFICACION, DATOS)).rejects.toBeInstanceOf(CorreoNoEnviado);
  });

  it("el adaptador de consola deja el mensaje con el enlace en el log", async () => {
    const lineas: string[] = [];
    const correo = new CorreoConsolaAdaptador({ log: (m) => lineas.push(m) });

    await correo.enviar(DATOS.correo, PLANTILLA_VERIFICACION, DATOS);

    expect(lineas.join("\n")).toContain(DATOS.enlace);
  });

  it("Falla del proveedor: el adaptador de consola lanza el mismo CorreoNoEnviado", async () => {
    const correo = new CorreoConsolaAdaptador({
      log: () => {
        throw new Error("log cerrado");
      },
    });

    await expect(correo.enviar(DATOS.correo, PLANTILLA_VERIFICACION, DATOS)).rejects.toBeInstanceOf(CorreoNoEnviado);
  });
});
