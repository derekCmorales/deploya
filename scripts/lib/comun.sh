# shellcheck shell=bash
# Rutas, bitácora y estado de la corrida. Las rutas de prueba salen de
# DEPLOYA_HOME, DEPLOYA_ENV y DEPLOYA_RESPALDOS: nunca se asume el home real.
# Secretos: secretos.sh. Modo del certificado: estrategia.sh.
# Las variables de abajo las rellenan otras etapas; aquí solo se declaran
# para que set -u no las tome por ausentes.
# shellcheck disable=SC2034

VERSION_INSTALADOR="1.0.0"
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
CONSERVA_RESPALDOS=7
HORA_RESPALDO=3
ETAPA_N=0
ETAPA_NOMBRE=""
CODIGO_EN_CURSO=""
HASH_CODIGO=""
VENCE_CODIGO=""
CODIGO_PENDIENTE=0
FORZAR_CODIGO=0
ZONA_DNS=""
CERT_TEXTO=""

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

# 2026-10-20T03:00:00Z → 2026-10-20T030000Z. Dos respaldos del mismo día no comparten archivo.
sello_respaldo() {
  local marca="$1"
  printf '%s' "${marca:0:13}${marca:14:2}${marca:17:2}Z"
}

marcar_ok() {
  ui "[${ETAPA_N}/5] ${ETAPA_NOMBRE} ✓ $*"
}

marcar_fallo() {
  ui "[${ETAPA_N}/5] ${ETAPA_NOMBRE} ✗ $*"
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

preparar_compose() {
  local archivo
  COMPOSE_ARCHIVOS=()
  while IFS= read -r archivo; do
    if [[ -z "$archivo" ]]; then
      continue
    fi
    COMPOSE_ARCHIVOS+=(-f "${RAIZ}/${archivo}")
  done < <(listar_archivos_compose)
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

leer_par() {
  local archivo="$1" clave="$2" linea valor
  [[ -f "$archivo" ]] || return 1
  while IFS= read -r linea || [[ -n "$linea" ]]; do
    if [[ "${linea%%=*}" == "$clave" ]]; then
      valor="${linea#*=}"
      valor="${valor%\"}"
      valor="${valor#\"}"
      printf '%s' "$valor"
      return 0
    fi
  done < "$archivo"
  return 1
}

reemplazar_env() {
  local clave="$1" valor="$2" tmp linea
  tmp="$(mktemp)"
  if [[ -f "$ARCHIVO_ENTORNO" ]]; then
    while IFS= read -r linea || [[ -n "$linea" ]]; do
      if [[ "${linea%%=*}" == "$clave" ]]; then
        continue
      fi
      printf '%s\n' "$linea" >> "$tmp"
    done < "$ARCHIVO_ENTORNO"
  fi
  printf '%s="%s"\n' "$clave" "$valor" >> "$tmp"
  install -m 600 "$tmp" "$ARCHIVO_ENTORNO"
  rm -f "$tmp"
}
