import { UrlRepositorioInvalida } from "./errores";

export interface RepositorioGitHub {
  dueno: string;
  nombre: string;
  /** Siempre `https://github.com/<dueño>/<repo>`: el motor solo clona https públicos. */
  url: string;
}

const PATRON_URL_GITHUB = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

/** Acepta `.git` y `/` finales; rechaza otros hosts, `http` y rutas como `/tree/main`. */
export function repositorioDesdeUrl(url: string): RepositorioGitHub {
  const partes = PATRON_URL_GITHUB.exec(url.trim());
  if (!partes) throw new UrlRepositorioInvalida();
  const [, dueno, nombre] = partes;
  return { dueno, nombre, url: `https://github.com/${dueno}/${nombre}` };
}
