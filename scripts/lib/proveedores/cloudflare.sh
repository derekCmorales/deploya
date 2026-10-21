# shellcheck shell=bash
# Proveedor DNS-01 de Traefik. Otro proveedor = otro archivo, no una rama nueva.
# El token viaja en un archivo 600: no queda en la línea de comandos ni en la bitácora.

API_CLOUDFLARE="https://api.cloudflare.com/client/v4"

curl_api() {
  local url="$1" cabecera cuerpo
  cabecera="$(mktemp)"
  chmod 600 "$cabecera"
  printf 'Authorization: Bearer %s\n' "$PROVEEDOR_TOKEN" > "$cabecera"
  cuerpo="$(curl --silent --show-error --max-time 15 --header @"$cabecera" "$url" || true)"
  rm -f "$cabecera"
  printf '%s' "$cuerpo"
}

token_activo() {
  local cuerpo
  cuerpo="$(curl_api "${API_CLOUDFLARE}/user/tokens/verify")"
  [[ "$cuerpo" == *'"status":"active"'* || "$cuerpo" == *'"status": "active"'* ]]
}

zona_responde() {
  local cuerpo
  cuerpo="$(curl_api "${API_CLOUDFLARE}/zones?name=${1}")"
  [[ "$cuerpo" == *"\"name\":\"${1}\""* ]]
}

buscar_zona() {
  local candidato="$DOMINIO_BASE"
  while [[ "$candidato" == *.* ]]; do
    if zona_responde "$candidato"; then
      printf '%s' "$candidato"
      return 0
    fi
    candidato="${candidato#*.}"
  done
  return 1
}

proveedor_comprobar() {
  # certificado_aplicar imprime PROVEEDOR_NOMBRE y ZONA_DNS.
  # shellcheck disable=SC2034
  PROVEEDOR_NOMBRE="cloudflare"
  PROVEEDOR_TOKEN="${DEPLOYA_TOKEN_DNS:-${CF_DNS_API_TOKEN:-}}"
  if [[ -z "$PROVEEDOR_TOKEN" ]]; then
    marcar_fallo "Falta el token del proveedor DNS (solo de la zona)."
    return 1
  fi
  if ! token_activo; then
    marcar_fallo "El token del proveedor DNS no es válido."
    return 1
  fi
  # certificado_aplicar imprime la zona.
  # shellcheck disable=SC2034
  if ! ZONA_DNS="$(buscar_zona)"; then
    marcar_fallo "El token no ve una zona que cubra ${DOMINIO_BASE}."
    return 1
  fi
}
