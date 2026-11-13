import { comandoConstruccionDe, comandoInicioDe } from "./comandos-proyecto";
import { DatosAltaInvalidos } from "./errores";
import { TIPOS_RECURSO_ALTA, type AltaProyecto, type ConsultaRepositorio, type TipoRecursoAlta } from "./proyecto";
import type { EntradaVariable } from "./variable";
import { PUERTO_MAXIMO, PUERTO_MINIMO, RAMA_POR_DEFECTO } from "./proyectos.constantes";
import { repositorioDesdeUrl } from "./repositorio-github";
import { rutaDockerfileDe } from "./ruta-dockerfile";

type Cuerpo = Record<string, unknown>;

/** `POST /proyectos/validar-repositorio`: URL de GitHub, rama y ruta del Dockerfile opcionales. */
export function validarConsultaRepositorio(cuerpo: unknown): ConsultaRepositorio {
  const datos = comoObjeto(cuerpo);
  const consulta = { url: repositorioDesdeUrl(texto(datos.url)).url, rama: ramaDe(datos) };
  const rutaDockerfile = rutaOpcional(datos.rutaDockerfile);
  return rutaDockerfile === undefined ? consulta : { ...consulta, rutaDockerfile };
}

/** `POST /proyectos`: reemplaza al DTO (el repo no usa class-validator). */
export function validarAltaProyecto(cuerpo: unknown): AltaProyecto {
  const datos = comoObjeto(cuerpo);
  const nombre = texto(datos.nombre);
  if (!nombre) throw new DatosAltaInvalidos("El nombre del proyecto es obligatorio.");
  const consulta = validarConsultaRepositorio(datos);
  const puerto = puertoDe(datos.puerto);
  const variables = variablesDe(datos.variables);
  const recursos = recursosDatosDe(datos.datos);
  const comandoInicio = comandoInicioDe(datos.comandoInicio);
  const comandoConstruccion = comandoConstruccionDe(datos.comandoConstruccion);
  return {
    ...consulta,
    nombre,
    ...(puerto === undefined ? {} : { puerto }),
    ...(variables === undefined ? {} : { variables }),
    ...(recursos === undefined ? {} : { datos: recursos }),
    ...(comandoInicio === null ? {} : { comandoInicio }),
    ...(comandoConstruccion === null ? {} : { comandoConstruccion }),
  };
}

/** Paso Datos: una lista de tipos conocidos sin repetir; el plan lo valida M5 antes de guardar. */
function recursosDatosDe(valor: unknown): TipoRecursoAlta[] | undefined {
  if (valor === undefined) return undefined;
  if (!Array.isArray(valor)) throw new DatosAltaInvalidos("datos debe ser una lista.");
  const tipos = valor.map((tipo) => {
    if (!TIPOS_RECURSO_ALTA.includes(tipo as TipoRecursoAlta)) throw new DatosAltaInvalidos(`No conocemos el recurso ${String(tipo)}.`);
    return tipo as TipoRecursoAlta;
  });
  if (new Set(tipos).size !== tipos.length) throw new DatosAltaInvalidos("Cada recurso de datos va una sola vez.");
  return tipos;
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

/** Vacía o ausente: el servicio usa `Dockerfile` en la raíz. */
function rutaOpcional(valor: unknown): string | undefined {
  return texto(valor) ? rutaDockerfileDe(valor) : undefined;
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
