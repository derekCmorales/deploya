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