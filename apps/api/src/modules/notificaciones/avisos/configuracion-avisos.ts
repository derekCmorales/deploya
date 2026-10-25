/** Configuración de los avisos, leída una vez del entorno. */
export interface ConfiguracionAvisos {
  /** Base de los enlaces de los botones (la web, no la API). */
  urlWeb: string;
}

export const CONFIGURACION_AVISOS = Symbol("CONFIGURACION_AVISOS");

export function configuracionAvisosDesde(entorno: NodeJS.ProcessEnv): ConfiguracionAvisos {
  return { urlWeb: (entorno.URL_WEB ?? "http://localhost:3000").replace(/\/+$/, "") };
}
