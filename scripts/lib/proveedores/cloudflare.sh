# shellcheck shell=bash
# Proveedor DNS-01 de Traefik. Otro proveedor = otro archivo, no una rama nueva.

proveedor_comprobar() {
  # certificado_aplicar (estrategia comodín) imprime PROVEEDOR_NOMBRE.
  # shellcheck disable=SC2034
  PROVEEDOR_NOMBRE="cloudflare"
  PROVEEDOR_TOKEN="${DEPLOYA_TOKEN_DNS:-${CF_DNS_API_TOKEN:-}}"
  if [[ -n "$PROVEEDOR_TOKEN" ]]; then
    return 0
  fi
  ui "✗"
  ui "Falta el token del proveedor DNS (solo de la zona)."
  return 1
}
