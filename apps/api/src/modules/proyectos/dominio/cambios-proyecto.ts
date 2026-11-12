import { argumentosDeComando, ComandoMalFormado, LARGO_MAXIMO_COMANDO } from "../../../compartido/argumentos-comando";
import { ComandoInicioInvalido, DatosAltaInvalidos, PuertoInvalido } from "./errores";
import type { Proyecto } from "./proyecto";
import { LONGITUD_MAX_NOMBRE, PUERTO_MAXIMO, PUERTO_MINIMO, RAMA_POR_DEFECTO } from "./proyectos.constantes";
import { repositorioDesdeUrl } from "./repositorio-github";
import { rutaDockerfileDe } from "./ruta-dockerfile";

/**
 * Lo único que se puede cambiar de un proyecto (19). El subdominio no está en el tipo: es fijo
 * desde el alta y el compilador impide cambiarlo por error.
 */
export type CambiosProyecto = Partial<Pick<Proyecto, "nombre" | "urlRepositorio" | "rama" | "rutaDockerfile" | "puertoInterno" | "comandoInicio">>;

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
    ...(datos.comandoInicio === undefined ? {} : { comandoInicio: comandoDe(datos.comandoInicio) }),
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

/**
 * `null` o texto en blanco vuelven al `CMD` de la imagen. Se valida que se pueda partir en
 * argumentos (comillas cerradas): el trabajador lo pasa como `Cmd` sin shell.
 */
function comandoDe(valor: unknown): string | null {
  if (valor === null) return null;
  if (typeof valor !== "string") throw new ComandoInicioInvalido("El comando de inicio debe ser texto.");
  const comando = valor.trim();
  if (!comando) return null;
  if (comando.length > LARGO_MAXIMO_COMANDO) throw new ComandoInicioInvalido(`El comando admite hasta ${LARGO_MAXIMO_COMANDO} caracteres.`);
  try {
    argumentosDeComando(comando);
  } catch (error) {
    if (error instanceof ComandoMalFormado) throw new ComandoInicioInvalido(`El comando no se puede leer: ${error.message.toLowerCase()}.`);
    throw error;
  }
  return comando;
}

function puertoDe(valor: unknown): number {
  const puerto = typeof valor === "string" ? Number(valor) : valor;
  if (typeof puerto !== "number" || !Number.isInteger(puerto) || puerto < PUERTO_MINIMO || puerto > PUERTO_MAXIMO) {
    throw new PuertoInvalido();
  }
  return puerto;
}
