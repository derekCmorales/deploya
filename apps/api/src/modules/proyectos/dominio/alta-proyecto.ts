import { DatosAltaInvalidos } from "./errores";
import type { AltaProyecto, ConsultaRepositorio } from "./proyecto";
import { PUERTO_MAXIMO, PUERTO_MINIMO, RAMA_POR_DEFECTO } from "./proyectos.constantes";
import { repositorioDesdeUrl } from "./repositorio-github";

type Cuerpo = Record<string, unknown>;

/** `POST /proyectos/validar-repositorio`: URL de GitHub y rama opcional. */
export function validarConsultaRepositorio(cuerpo: unknown): ConsultaRepositorio {
  const datos = comoObjeto(cuerpo);
  return { url: repositorioDesdeUrl(texto(datos.url)).url, rama: ramaDe(datos) };
}

/** `POST /proyectos`: reemplaza al DTO (el repo no usa class-validator). */
export function validarAltaProyecto(cuerpo: unknown): AltaProyecto {
  const datos = comoObjeto(cuerpo);
  const nombre = texto(datos.nombre);
  if (!nombre) throw new DatosAltaInvalidos("El nombre del proyecto es obligatorio.");
  const { url, rama } = validarConsultaRepositorio(datos);
  const puerto = puertoDe(datos.puerto);
  return puerto === undefined ? { url, rama, nombre } : { url, rama, nombre, puerto };
}

/** `DELETE /proyectos/:id`: el nombre que el cliente escribió en la confirmación (19b). */
export function validarConfirmacionEliminar(cuerpo: unknown): string {
  return texto(comoObjeto(cuerpo).confirmacion);
}

function comoObjeto(cuerpo: unknown): Cuerpo {
  if (!cuerpo || typeof cuerpo !== "object") throw new DatosAltaInvalidos("La solicitud no trae datos.");
  return cuerpo as Cuerpo;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function ramaDe(datos: Cuerpo): string {
  return texto(datos.rama) || RAMA_POR_DEFECTO;
}

function puertoDe(valor: unknown): number | undefined {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const puerto = Number(valor);
  if (!Number.isInteger(puerto) || puerto < PUERTO_MINIMO || puerto > PUERTO_MAXIMO) {
    throw new DatosAltaInvalidos(`El puerto debe ser un entero entre ${PUERTO_MINIMO} y ${PUERTO_MAXIMO}.`);
  }
  return puerto;
}
