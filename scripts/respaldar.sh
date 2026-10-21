#!/usr/bin/env bash
# Respalda la base y la configuración, sin la clave de cifrado. --restaurar deshace.
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
  printf '%s\n' "Uso: ./scripts/respaldar.sh [--restaurar AAAA-MM-DD]"
  exit 0
fi
if [[ "${1:-}" == "--restaurar" ]]; then
  if [[ -z "${2:-}" ]]; then
    ui "Falta la fecha (AAAA-MM-DD)."
    exit 1
  fi
  restaurar_fecha "$2"
  exit 0
fi
if [[ $# -gt 0 ]]; then
  printf '%s\n' "Opción desconocida: $1" >&2
  exit 2
fi
crear_respaldo
refrescar_disponible || true
