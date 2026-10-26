/**
 * Saltos de proxy delante de la API (`PROXIES_DE_CONFIANZA`). En el VPS y en autoalojado la API
 * solo se alcanza por Traefik: con `1`, Express toma la IP del cliente del `X-Forwarded-For` que
 * agrega Traefik. Sin la variable (desarrollo, API publicada directo), `0`: un `X-Forwarded-For`
 * escrito por el cliente no cuenta.
 */
export function saltosDeProxy(entorno: Record<string, string | undefined>): number {
  const saltos = Number(entorno.PROXIES_DE_CONFIANZA ?? 0);
  return Number.isInteger(saltos) && saltos > 0 ? saltos : 0;
}
