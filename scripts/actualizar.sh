#!/usr/bin/env bash
# Actualiza con respaldo previo. --volver restaura ese respaldo si la migración falla.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIB="${RAIZ}/scripts/lib"
# shellcheck source=lib/comun.sh
source "${LIB}/comun.sh"
# shellcheck source=lib/estrategia.sh
source "${LIB}/estrategia.sh"
# shellcheck source=lib/respaldo-comando.sh
source "${LIB}/respaldo-comando.sh"
# shellcheck source=lib/actualizacion.sh
source "${LIB}/actualizacion.sh"

init_rutas
cargar_estrategia_guardada
cd "$RAIZ"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  printf '%s\n' "Uso: ./scripts/actualizar.sh [--volver]"
  exit 0
fi
if [[ "${1:-}" == "--volver" ]]; then
  volver_actualizacion
  exit 0
fi
if [[ $# -gt 0 ]]; then
  printf '%s\n' "Opción desconocida: $1" >&2
  exit 2
fi
actualizar
