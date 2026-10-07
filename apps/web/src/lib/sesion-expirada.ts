/**
 * «Sesión expirada» (M1-04, pantalla 28). Sin imports para probarlo con `node --test`.
 * Observer: `pedirApi` avisa con un evento del navegador cuando la API responde 401, y
 * `SesionProvider` vuelve a leer la sesión; si antes había usuario, la sesión venció.
 */

export const EVENTO_SIN_SESION = "deploya:sin-sesion";
export const PARAMETRO_EXPIRADA = "expirada";

const RUTA_INGRESAR = "/ingresar";

/** Nunca hubo sesión → `/ingresar`; la sesión venció → `/ingresar?expirada=1`. Siempre vuelve a `ruta`. */
export function destinoSinSesion(teniaUsuario: boolean, ruta: string): string {
  const siguiente = `siguiente=${encodeURIComponent(ruta)}`;
  return teniaUsuario ? `${RUTA_INGRESAR}?${PARAMETRO_EXPIRADA}=1&${siguiente}` : `${RUTA_INGRESAR}?${siguiente}`;
}
