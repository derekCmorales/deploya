# shellcheck shell=bash
# 32 bytes en UTF-8, el largo que mide CifradorAesGcm. openssl rand -hex
# escribe dos caracteres por byte: por eso el pedido es la mitad.

BYTES_SECRETO=32
ALFABETO_CODIGO="23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

secreto_32() {
  local hex
  hex="$(openssl rand -hex $((BYTES_SECRETO / 2)))"
  if ((${#hex} != BYTES_SECRETO)); then
    printf '%s\n' "No pude generar un secreto de ${BYTES_SECRETO} bytes." >&2
    return 1
  fi
  printf '%s' "$hex"
}

codigo_configuracion() {
  local bytes=" " i par idx crudo=""
  bytes="$(openssl rand -hex 8)"
  for i in 0 2 4 6 8 10 12 14; do
    par="${bytes:i:2}"
    idx=$((16#$par % ${#ALFABETO_CODIGO}))
    crudo+="${ALFABETO_CODIGO:idx:1}"
  done
  printf '%s-%s' "${crudo:0:4}" "${crudo:4:4}"
}
