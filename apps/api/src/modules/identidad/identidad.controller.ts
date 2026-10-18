import { Body, Controller, Get, HttpCode, Post, UseFilters } from "@nestjs/common";
import { textoDe } from "./cuerpo-solicitud";
import { ContrasenasNoCoinciden } from "./dominio/errores";
import { ESPERA_REENVIO_MS } from "./dominio/politica-reenvio";
import { ErroresIdentidadFilter } from "./errores-identidad.filter";
import { IdentidadService, type CuentaRegistrada, type CuentaVerificada, type SolicitudReenvio } from "./identidad.service";

const HTTP_CREADO = 201;
const HTTP_OK = 200;
const HTTP_ACEPTADO = 202;
const MS_POR_SEGUNDO = 1000;

/**
 * Pantallas 02 y 03b: el mismo cuerpo para toda solicitud aceptada, exista o no la cuenta.
 * `segundos` es la cuenta atrás con la que arranca la web (no la inventa el cliente).
 */
export const REENVIO_ACEPTADO = {
  mensaje: "Si la cuenta está pendiente, te enviamos un enlace nuevo.",
  segundos: ESPERA_REENVIO_MS / MS_POR_SEGUNDO,
} as const;

@Controller("identidad")
@UseFilters(ErroresIdentidadFilter)
export class IdentidadController {
  constructor(private readonly identidad: IdentidadService) {}

  @Get("health")
  health() {
    return { status: "ok", module: "identidad" };
  }

  /** Pantallas 01 y 01b. La web trata solo el 201 como «Cuenta creada». */
  @Post("registro")
  @HttpCode(HTTP_CREADO)
  registrar(@Body() cuerpo: unknown): Promise<CuentaRegistrada> {
    const contrasena = textoDe(cuerpo, "contrasena");
    if (textoDe(cuerpo, "confirmacion") !== contrasena) throw new ContrasenasNoCoinciden();
    return this.identidad.registrar({ correo: textoDe(cuerpo, "correo"), contrasena });
  }

  /** Pantalla 02: POST y no GET, porque consume el token (abrir el enlace no debe tener efectos). */
  @Post("verificacion")
  @HttpCode(HTTP_OK)
  verificar(@Body() cuerpo: unknown): Promise<CuentaVerificada> {
    return this.identidad.verificar(textoDe(cuerpo, "token"));
  }

  /** Pantallas 02 y 03b (M1-04): 202 neutro, o 429 `EsperaReenvio` con los segundos que faltan. */
  @Post("verificacion/reenvio")
  @HttpCode(HTTP_ACEPTADO)
  async reenviar(@Body() cuerpo: unknown): Promise<typeof REENVIO_ACEPTADO> {
    await this.identidad.reenviarVerificacion(solicitudDeReenvio(cuerpo));
    return REENVIO_ACEPTADO;
  }
}

/** El cuerpo trae `correo` (03b) o el `token` del enlace vencido (02 c); sin ninguno, 400. */
function solicitudDeReenvio(cuerpo: unknown): SolicitudReenvio {
  const campos = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>) : {};
  if (typeof campos.token === "string" && campos.token !== "") return { token: campos.token };
  return { correo: textoDe(cuerpo, "correo") };
}
