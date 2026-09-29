/** Configuración de M1 leída una sola vez del entorno. */
export interface ConfiguracionIdentidad {
  /** Base de los enlaces que viajan en los correos (la web, no la API). */
  urlWeb: string;
}

export const CONFIGURACION_IDENTIDAD = Symbol("CONFIGURACION_IDENTIDAD");

export function configuracionIdentidadDesde(entorno: NodeJS.ProcessEnv): ConfiguracionIdentidad {
  return { urlWeb: (entorno.URL_WEB ?? "http://localhost:3000").replace(/\/+$/, "") };
}
