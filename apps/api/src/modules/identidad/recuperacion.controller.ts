import { Body, Controller, HttpCode, Post, UseFilters } from "@nestjs/common";
import { ContrasenasNoCoinciden } from "./dominio/errores";
import { ErroresIdentidadFilter, textoDe } from "./identidad.controller";
import { RecuperacionService } from "./recuperacion.service";

const HTTP_ACEPTADO = 202;
const HTTP_SIN_CONTENIDO = 204;

/** Pantalla 04: la web muestra este texto tal cual, exista o no la cuenta. */
export const RESPUESTA_RECUPERACION = {
  mensaje: "Si la cuenta existe, te enviamos un enlace. Caduca en 30 minutos y sirve una sola vez.",
} as const;

/** M1-05 · pantalla 04. El 410 `TokenNoValido` lo traduce el mismo filtro de M1. */
@Controller("identidad/recuperacion")
@UseFilters(ErroresIdentidadFilter)
export class RecuperacionController {
  constructor(private readonly recuperacion: RecuperacionService) {}

  @Post()
  @HttpCode(HTTP_ACEPTADO)
  async solicitar(@Body() cuerpo: unknown): Promise<typeof RESPUESTA_RECUPERACION> {
    await this.recuperacion.solicitar(textoDe(cuerpo, "correo"));
    return RESPUESTA_RECUPERACION;
  }

  @Post("restablecer")
  @HttpCode(HTTP_SIN_CONTENIDO)
  async restablecer(@Body() cuerpo: unknown): Promise<void> {
    const contrasena = textoDe(cuerpo, "contrasena");
    if (textoDe(cuerpo, "confirmacion") !== contrasena) throw new ContrasenasNoCoinciden();
    await this.recuperacion.restablecer({ token: textoDe(cuerpo, "token"), contrasena });
  }
}
