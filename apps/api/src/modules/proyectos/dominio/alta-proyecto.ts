<<<<<<< HEAD
import { AltaProyecto } from "./proyecto";
import { DatosAltaInvalidos, UrlRepositorioInvalida } from "./errores";
import { RAMA_POR_DEFECTO, PUERTO_POR_DEFECTO } from "./proyectos.constantes";

export function validarAltaProyecto(cuerpo: unknown): AltaProyecto {
  if (!cuerpo || typeof cuerpo !== "object") {
    throw new DatosAltaInvalidos("El cuerpo de la solicitud es inválido.");
  }

  const datos = cuerpo as Record<string, unknown>;

  const url = typeof datos.url === "string" ? datos.url.trim() : "";
  if (!url) {
    throw new UrlRepositorioInvalida("La URL del repositorio es obligatoria.");
  }

  const patronGitHub = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?\/?$/;
  if (!patronGitHub.test(url)) {
    throw new UrlRepositorioInvalida("La URL no corresponde a un repositorio válido de GitHub.");
  }

  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  if (!nombre) {
    throw new DatosAltaInvalidos("El nombre del proyecto es obligatorio.");
  }

  const rama = typeof datos.rama === "string" && datos.rama.trim() !== "" ? datos.rama.trim() : RAMA_POR_DEFECTO;

  let puerto = PUERTO_POR_DEFECTO;
  if (datos.puerto !== undefined && datos.puerto !== null) {
    const puertoNum = Number(datos.puerto);
    if (Number.isNaN(puertoNum) || puertoNum < 1 || puertoNum > 65535) {
      throw new DatosAltaInvalidos("El puerto debe ser un número entre 1 y 65535.");
    }
    puerto = puertoNum;
  }

  return {
    url: url.replace(/\.git$/, "").replace(/\/$/, ""),
    rama,
    nombre,
    puerto,
  };
}
=======
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
>>>>>>> origin/main
