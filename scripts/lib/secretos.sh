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

MINUTOS_VIGENCIA_CODIGO=30

hash_codigo() {
  printf '%s' "$1" | openssl dgst -sha256 | awk '{ print $NF }'
}

vence_codigo() {
  local base="${DEPLOYA_AHORA:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"
  date -u -d "${base} + ${MINUTOS_VIGENCIA_CODIGO} minutes" +%Y-%m-%dT%H:%M:%SZ
}

cargar_pendiente() {
  local archivo="${DEPLOYA_HOME}/codigo.pendiente" hash vence
  [[ -f "$archivo" ]] || return 1
  hash="$(leer_par "$archivo" HASH_CODIGO_CONFIGURACION)" || return 1
  vence="$(leer_par "$archivo" CODIGO_VENCE)" || return 1
  HASH_CODIGO="$hash"
  VENCE_CODIGO="$vence"
  CODIGO_EN_CURSO=""
  # shellcheck disable=SC2034
  CODIGO_PENDIENTE=1
  rm -f "$archivo"
}

preparar_codigo() {
  if [[ "$FORZAR_CODIGO" != 1 && -n "$HASH_CODIGO" && -n "$VENCE_CODIGO" ]]; then
    return 0
  fi
  if [[ "$FORZAR_CODIGO" != 1 ]] && cargar_pendiente; then
    return 0
  fi
  CODIGO_EN_CURSO="$(codigo_configuracion)"
  HASH_CODIGO="$(hash_codigo "$CODIGO_EN_CURSO")"
  VENCE_CODIGO="$(vence_codigo)"
  # etapa-administrador distingue un código recién generado de uno pendiente.
  # shellcheck disable=SC2034
  CODIGO_PENDIENTE=0
}

guardar_pendiente() {
  local archivo="${DEPLOYA_HOME}/codigo.pendiente"
  mkdir -p "$DEPLOYA_HOME"
  printf 'HASH_CODIGO_CONFIGURACION="%s"\nCODIGO_VENCE="%s"\n' "$HASH_CODIGO" "$VENCE_CODIGO" > "$archivo"
  chmod 600 "$archivo"
}
