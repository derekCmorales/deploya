import { DatosAltaInvalidos } from "./errores";
import type { AltaProyecto, ConsultaRepositorio } from "./proyecto";
import type { EntradaVariable } from "./variable";
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
  const variables = variablesDe(datos.variables);
  const alta: AltaProyecto = { url, rama, nombre, ...(puerto === undefined ? {} : { puerto }) };
  return variables === undefined ? alta : { ...alta, variables };
}

/** `PUT /proyectos/:id/variables`. Sin `valor` se conserva el cifrado guardado. */
export function validarReemplazoVariables(cuerpo: unknown): { variables: EntradaVariable[]; desplegar: boolean } {
  const datos = comoObjeto(cuerpo);
  if (!Array.isArray(datos.variables)) throw new DatosAltaInvalidos("Falta la lista de variables.");
  return { variables: datos.variables.map(entradaVariable), desplegar: datos.desplegar === true };
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

function variablesDe(valor: unknown): { clave: string; valor: string }[] | undefined {
  if (valor === undefined) return undefined;
  if (!Array.isArray(valor)) throw new DatosAltaInvalidos("variables debe ser una lista.");
  return valor.map((entrada) => {
    const variable = entradaVariable(entrada);
    if (variable.valor === undefined) throw new DatosAltaInvalidos("En el alta cada variable trae valor.");
    return { clave: variable.clave, valor: variable.valor };
  });
}

function entradaVariable(valor: unknown): EntradaVariable {
  const datos = comoObjeto(valor);
  const clave = texto(datos.clave);
  if (!clave) throw new DatosAltaInvalidos("Cada variable necesita una clave.");
  if (datos.valor === undefined) return { clave };
  if (typeof datos.valor !== "string") throw new DatosAltaInvalidos("El valor de una variable es texto.");
  return { clave, valor: datos.valor };
}

function puertoDe(valor: unknown): number | undefined {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const puerto = Number(valor);
  if (!Number.isInteger(puerto) || puerto < PUERTO_MINIMO || puerto > PUERTO_MAXIMO) {
    throw new DatosAltaInvalidos(`El puerto debe ser un entero entre ${PUERTO_MINIMO} y ${PUERTO_MAXIMO}.`);
  }
  return puerto;
}
