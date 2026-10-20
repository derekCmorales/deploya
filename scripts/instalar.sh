#!/usr/bin/env bash
# Instalador autoalojado por etapas. No ejecuta scripts/desplegar-vps.sh:
# ese script publica el VPS de la nube (git pull de una rama y .env.vps).
# Aquí se reutiliza la idea: los mismos compose, la plantilla de Traefik y la migración.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIB="${RAIZ}/scripts/lib"
CONTINUAR=0
SIN_COMODIN=0
CODIGO_NUEVO=0

uso() {
  printf '%s\n' "Uso: ./scripts/instalar.sh [--continuar] [--sin-comodin] [--codigo-nuevo]"
}

parsear() {
  local arg
  for arg in "$@"; do
    case "$arg" in
      --continuar) CONTINUAR=1 ;;
      --sin-comodin) SIN_COMODIN=1 ;;
      --codigo-nuevo) CODIGO_NUEVO=1 ;;
      -h|--help) uso; exit 0 ;;
      *) printf '%s\n' "Opción desconocida: ${arg}" >&2; uso; exit 2 ;;
    esac
  done
}

parsear "$@"
# shellcheck source=lib/comun.sh
source "${LIB}/comun.sh"
# shellcheck source=lib/secretos.sh
source "${LIB}/secretos.sh"
# shellcheck source=lib/estrategia.sh
source "${LIB}/estrategia.sh"
# shellcheck source=lib/etapa-requisitos.sh
source "${LIB}/etapa-requisitos.sh"
# shellcheck source=lib/etapa-dominio.sh
source "${LIB}/etapa-dominio.sh"
# shellcheck source=lib/etapa-certificado.sh
source "${LIB}/etapa-certificado.sh"
# shellcheck source=lib/etapa-servicios.sh
source "${LIB}/etapa-servicios.sh"
# shellcheck source=lib/etapa-administrador.sh
source "${LIB}/etapa-administrador.sh"
# shellcheck source=lib/pipeline.sh
source "${LIB}/pipeline.sh"

init_rutas
cd "$RAIZ"
if [[ "$CODIGO_NUEVO" == "1" ]]; then
  emitir_codigo_nuevo
  exit 0
fi
recordar_modo
cargar_estrategia "$SIN_COMODIN"
ui "deploya · instalador autoalojado · v${VERSION_INSTALADOR}"
correr_etapas
