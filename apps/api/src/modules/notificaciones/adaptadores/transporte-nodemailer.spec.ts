import type { ConfiguracionCorreo } from "../configuracion-correo";
import { LIMITES_SMTP_MS, transporteNodemailer } from "./transporte-nodemailer";

/** Crear el transporte no abre conexiones: se leen las opciones con las que quedó. */
function opcionesDe(configuracion: ConfiguracionCorreo): Record<string, unknown> {
  return (transporteNodemailer(configuracion) as unknown as { options: Record<string, unknown> }).options;
}

const SMTP: ConfiguracionCorreo = { adaptador: "smtp", host: "smtp.miempresa.com", puerto: 587, usuario: "deploya", clave: "x", remitente: "deploya <a@b.c>" };

describe("transporteNodemailer", () => {
  it("un servidor que no responde falla en segundos, no en minutos", () => {
    expect(opcionesDe(SMTP)).toMatchObject({
      connectionTimeout: LIMITES_SMTP_MS.conexion,
      greetingTimeout: LIMITES_SMTP_MS.saludo,
      socketTimeout: LIMITES_SMTP_MS.socket,
    });
  });

  it("465 abre cifrado; sin usuario no hay autenticación", () => {
    expect(opcionesDe({ ...SMTP, puerto: 465 })).toMatchObject({ secure: true });
    expect(opcionesDe({ ...SMTP, usuario: "" })).toMatchObject({ secure: false, auth: undefined });
  });
});
