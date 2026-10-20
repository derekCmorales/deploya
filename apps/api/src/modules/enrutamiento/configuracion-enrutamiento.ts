/**
 * Dónde y cómo se publican las apps (M6-02). Es configuración, no código: en desarrollo
 * `localhost` + `http` sin TLS; en el VPS `deploya.app` + `https` con un resolvedor ACME.
 */
export interface ConfiguracionEnrutamiento {
  /** `localhost` en desarrollo, `deploya.app` en el VPS. */
  dominioBase: string;
  esquema: string;
  /** Nombre del `certificatesResolvers` de Traefik; `null` = sin TLS (desarrollo). */
  certResolver: string | null;
}

/**
 * `DOMINIO_BASE`, `ESQUEMA_PUBLICO` y `CERT_RESOLVER`. `DOMINIO_APPS` y `ESQUEMA_APPS` (los nombres
 * del Avance 2) siguen valiendo para no romper un `.env` existente. Con resolvedor y sin esquema, https.
 */
export function configuracionEnrutamientoDesde(entorno: NodeJS.ProcessEnv): ConfiguracionEnrutamiento {
  const certResolver = entorno.CERT_RESOLVER?.trim() || null;
  return {
    dominioBase: entorno.DOMINIO_BASE?.trim() || entorno.DOMINIO_APPS?.trim() || "localhost",
    esquema: entorno.ESQUEMA_PUBLICO?.trim() || entorno.ESQUEMA_APPS?.trim() || (certResolver ? "https" : "http"),
    certResolver,
  };
}
