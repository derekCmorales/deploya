import { comandoConstruccionDe, comandoInicioDe } from "./comandos-proyecto";
import { DatosAltaInvalidos, PuertoInvalido } from "./errores";
import type { Proyecto } from "./proyecto";
import { LONGITUD_MAX_NOMBRE, PUERTO_MAXIMO, PUERTO_MINIMO, RAMA_POR_DEFECTO } from "./proyectos.constantes";
import { repositorioDesdeUrl } from "./repositorio-github";
import { rutaDockerfileDe } from "./ruta-dockerfile";

/**
 * Lo único que se puede cambiar de un proyecto (19). El subdominio no está en el tipo: es fijo
 * desde el alta y el compilador impide cambiarlo por error.
 */
export type CambiosProyecto = Partial<Pick<Proyecto, "nombre" | "urlRepositorio" | "rama" | "rutaDockerfile" | "puertoInterno" | "comandoInicio" | "comandoConstruccion">>;

type Cuerpo = Record<string, unknown>;

/**
 * Value Object de `PATCH /proyectos/:id`: valida cada campo presente con las reglas del alta
 * (la URL con `repositorioDesdeUrl`, el puerto entre 1 y 65535) y descarta los ausentes. Los
 * campos desconocidos, el subdominio entre ellos, se ignoran.
 */
export function cambiosProyectoDe(cuerpo: unknown): CambiosProyecto {
  if (!cuerpo || typeof cuerpo !== "object") throw new DatosAltaInvalidos("La solicitud no trae datos.");
  const datos = cuerpo as Cuerpo;
  const cambios: CambiosProyecto = {
    ...(datos.nombre === undefined ? {} : { nombre: nombreDe(datos.nombre) }),
    ...(datos.urlRepositorio === undefined ? {} : { urlRepositorio: repositorioDesdeUrl(texto(datos.urlRepositorio)).url }),
    ...(datos.rama === undefined ? {} : { rama: ramaDe(datos.rama) }),
    ...(datos.rutaDockerfile === undefined ? {} : { rutaDockerfile: rutaDockerfileDe(datos.rutaDockerfile) }),
    ...(datos.puertoInterno === undefined ? {} : { puertoInterno: puertoDe(datos.puertoInterno) }),
    ...(datos.comandoInicio === undefined ? {} : { comandoInicio: comandoInicioDe(datos.comandoInicio) }),
    ...(datos.comandoConstruccion === undefined ? {} : { comandoConstruccion: comandoConstruccionDe(datos.comandoConstruccion) }),
  };
  if (Object.keys(cambios).length === 0) throw new DatosAltaInvalidos("No hay cambios que guardar.");
  return cambios;
}

export const CambiosProyectoVO = { de: cambiosProyectoDe } as const;

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function nombreDe(valor: unknown): string {
  const nombre = texto(valor);
  if (!nombre) throw new DatosAltaInvalidos("El nombre del proyecto es obligatorio.");
  if (nombre.length > LONGITUD_MAX_NOMBRE) throw new DatosAltaInvalidos(`El nombre admite hasta ${LONGITUD_MAX_NOMBRE} caracteres.`);
  return nombre;
}

function ramaDe(valor: unknown): string {
  return texto(valor) || RAMA_POR_DEFECTO;
}

function puertoDe(valor: unknown): number {
  const puerto = typeof valor === "string" ? Number(valor) : valor;
  if (typeof puerto !== "number" || !Number.isInteger(puerto) || puerto < PUERTO_MINIMO || puerto > PUERTO_MAXIMO) {
    throw new PuertoInvalido();
  }
  return puerto;
}
