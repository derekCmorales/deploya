# shellcheck shell=bash
# Rutas, bitácora y secretos compartidos. Las rutas de prueba salen de
# DEPLOYA_HOME, DEPLOYA_ENV y DEPLOYA_RESPALDOS: nunca se asume el home real.
# Las constantes las leen otras etapas; en este archivo solo se declaran.
# shellcheck disable=SC2034

VERSION_INSTALADOR="1.0.0"
RAM_MIN_MB=2048
DISCO_MIN_GB=20
MAX_RESPALDOS=7
ALFABETO_CODIGO="23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
URL_IP_PUBLICA="https://ifconfig.me"
# Texto de la ficha 30: se muestra la ruta de casa, no se expande.
# shellcheck disable=SC2088
BITACORA_EN_CASA='~/.deploya/instalacion.log'

DOMINIO_BASE=""
PROVEEDOR_TOKEN=""
PROVEEDOR_NOMBRE=""
REQ_DOCKER=""
REQ_RAM_MB=""
REQ_DISCO_GB=""
ULTIMO_TAR=""
COMPOSE_ARCHIVOS=()

init_rutas() {
  export LC_ALL=C
  DEPLOYA_HOME="${DEPLOYA_HOME:-${HOME}/.deploya}"
  ESTADO="${DEPLOYA_HOME}/estado"
  BITACORA="${DEPLOYA_HOME}/instalacion.log"
  DIR_RESPALDOS="${DEPLOYA_RESPALDOS:-/var/backups/deploya}"
  ARCHIVO_ENTORNO="${DEPLOYA_ENV:-${RAIZ}/.env}"
  GENERADO="${DEPLOYA_PLATAFORMA_GENERADA:-${RAIZ}/infra/traefik/plataforma.generada.yml}"
  mkdir -p "$DEPLOYA_HOME"
  chmod 700 "$DEPLOYA_HOME"
}

asegurar_respaldos() {
  mkdir -p "$DIR_RESPALDOS"
  chmod 700 "$DIR_RESPALDOS"
}

marca_tiempo() {
  if [[ -n "${DEPLOYA_AHORA:-}" ]]; then
    printf '%s' "$DEPLOYA_AHORA"
    return
  fi
  date -u +%Y-%m-%dT%H:%M:%SZ
}

fecha_respaldo() {
  local marca
  marca="$(marca_tiempo)"
  printf '%s' "${marca:0:10}"
}

bitacora_visible() {
  if [[ "$DEPLOYA_HOME" == "${HOME}/.deploya" ]]; then
    printf '%s' "$BITACORA_EN_CASA"
    return
  fi
  printf '%s' "$BITACORA"
}

bitacora() {
  printf '%s %s\n' "$(marca_tiempo)" "$*" >> "$BITACORA"
}

ui() {
  printf '%s\n' "$*"
  bitacora "$*"
}

estado_leer() {
  local clave="$1" linea
  [[ -f "$ESTADO" ]] || return 1
  while IFS= read -r linea || [[ -n "$linea" ]]; do
    if [[ "$linea" == "${clave}="* ]]; then
      printf '%s' "${linea#*=}"
      return 0
    fi
  done < "$ESTADO"
  return 1
}

estado_poner() {
  local clave="$1" valor="$2" tmp linea
  mkdir -p "$DEPLOYA_HOME"
  tmp="$(mktemp)"
  if [[ -f "$ESTADO" ]]; then
    while IFS= read -r linea || [[ -n "$linea" ]]; do
      if [[ "$linea" == "${clave}="* ]]; then
        continue
      fi
      printf '%s\n' "$linea" >> "$tmp"
    done < "$ESTADO"
  fi
  printf '%s=%s\n' "$clave" "$valor" >> "$tmp"
  mv "$tmp" "$ESTADO"
  chmod 600 "$ESTADO"
}

valor_env() {
  local clave="$1" linea valor
  [[ -f "$ARCHIVO_ENTORNO" ]] || return 1
  while IFS= read -r linea || [[ -n "$linea" ]]; do
    if [[ "${linea%%=*}" == "$clave" ]]; then
      valor="${linea#*=}"
      valor="${valor%\"}"
      valor="${valor#\"}"
      printf '%s' "$valor"
      return 0
    fi
  done < "$ARCHIVO_ENTORNO"
  return 1
}

secreto_32() {
  local hex
  hex="$(openssl rand -hex 16)"
  if ((${#hex} != 32)); then
    printf '%s\n' "No pude generar un secreto de 32 bytes." >&2
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

exigir_correo_acme() {
  if [[ -n "${DEPLOYA_ACME_CORREO:-}" ]]; then
    return 0
  fi
  ui "✗"
  ui "Falta el correo de Let's Encrypt (DEPLOYA_ACME_CORREO)."
  return 1
}

archivos_compose_de_estado() {
  printf '%s\n' docker-compose.yml docker-compose.vps.yml docker-compose.autoalojado.yml
  if [[ "$(estado_leer sin_comodin || true)" == "1" ]]; then
    printf '%s\n' docker-compose.http01.yml
  fi
}

preparar_compose() {
  local archivo fuente="archivos_compose_de_estado"
  COMPOSE_ARCHIVOS=()
  if declare -F listar_archivos_compose >/dev/null; then
    fuente="listar_archivos_compose"
  fi
  while IFS= read -r archivo; do
    if [[ -z "$archivo" ]]; then
      continue
    fi
    COMPOSE_ARCHIVOS+=(-f "${RAIZ}/${archivo}")
  done < <("$fuente")
}

invocar_compose() {
  if [[ -n "${DEPLOYA_COMPOSE:-}" ]]; then
    local -a bin=()
    read -r -a bin <<< "${DEPLOYA_COMPOSE}"
    "${bin[@]}" --env-file "$ARCHIVO_ENTORNO" "${COMPOSE_ARCHIVOS[@]}" "$@"
    return
  fi
  docker compose --env-file "$ARCHIVO_ENTORNO" "${COMPOSE_ARCHIVOS[@]}" "$@"
}

leer_json() {
  local archivo="$1" clave="$2" linea valor
  [[ -f "$archivo" ]] || return 1
  while IFS= read -r linea || [[ -n "$linea" ]]; do
    if [[ "$linea" == *"\"${clave}\""* ]]; then
      valor="${linea#*:}"
      valor="${valor//\"/}"
      valor="${valor//,/}"
      valor="${valor// /}"
      printf '%s' "$valor"
      return 0
    fi
  done < "$archivo"
  return 1
}
