# shellcheck shell=bash
# Etapa 1. Comprueba Docker 24+, Compose v2, las herramientas, RAM, disco y los puertos.

DOCKER_MIN_MAYOR=24
RAM_MIN_MB=2048
DISCO_MIN_GB=20
HERRAMIENTAS=(curl dig openssl ss)

docker_es_reciente() {
  local mayor="${1%%.*}"
  mayor="${mayor#v}"
  if [[ "$mayor" =~ ^[0-9]+$ ]] && ((mayor >= DOCKER_MIN_MAYOR)); then
    return 0
  fi
  return 1
}

comprobar_compose() {
  local version
  if ! version="$(docker compose version --short 2>/dev/null)"; then
    ui "✗"
    ui "Falta Compose v2."
    return 1
  fi
  if [[ "$version" == 2.* || "$version" == v2* ]]; then
    return 0
  fi
  ui "✗"
  ui "Hace falta Compose v2 (hay ${version})."
  return 1
}

comprobar_docker() {
  if ! REQ_DOCKER="$(docker version --format '{{.Server.Version}}' 2>/dev/null)"; then
    ui "✗"
    ui "Falta Docker. Instala Docker ${DOCKER_MIN_MAYOR} y Compose v2."
    return 1
  fi
  if ! docker_es_reciente "$REQ_DOCKER"; then
    ui "✗"
    ui "Hace falta Docker ${DOCKER_MIN_MAYOR} o más nuevo (hay ${REQ_DOCKER})."
    return 1
  fi
  comprobar_compose
}

comprobar_herramientas() {
  local nombre
  for nombre in "${HERRAMIENTAS[@]}"; do
    if command -v "$nombre" >/dev/null 2>&1; then
      continue
    fi
    ui "✗"
    ui "Falta ${nombre}."
    return 1
  done
}

leer_ram_mb() {
  free -m | awk '/^Mem:/ { print $2 }'
}

leer_disco_gb() {
  local crudo
  crudo="$(df -BG --output=avail / | awk 'NR==2 { print $1 }')"
  printf '%s' "${crudo%G}"
}

puerto_libre() {
  local ocupado
  ocupado="$(ss -ltn "sport = :${1}" | awk 'NR>1 { print }')"
  [[ -z "$ocupado" ]]
}

explicar_puertos() {
  local linea
  ui "✗"
  ui "Los puertos 80 o 443 están ocupados:"
  while IFS= read -r linea; do
    if [[ -z "$linea" ]]; then
      continue
    fi
    ui "$linea"
  done < <(ss -ltnp 2>/dev/null | awk 'NR>1 { print }')
}

comprobar_recursos() {
  REQ_RAM_MB="$(leer_ram_mb)"
  REQ_DISCO_GB="$(leer_disco_gb)"
  if ((REQ_RAM_MB < RAM_MIN_MB)); then
    ui "✗"
    ui "Hacen falta 2 GB de RAM (hay ${REQ_RAM_MB} MB)."
    return 1
  fi
  if ((REQ_DISCO_GB < DISCO_MIN_GB)); then
    ui "✗"
    ui "Hacen falta 20 GB libres (hay ${REQ_DISCO_GB} GB)."
    return 1
  fi
}

comprobar_puertos() {
  if puerto_libre 80 && puerto_libre 443; then
    return 0
  fi
  explicar_puertos
  return 1
}

etapa_requisitos_comprobar() {
  comprobar_docker || return 1
  comprobar_herramientas || return 1
  comprobar_recursos || return 1
  comprobar_puertos || return 1
}

etapa_requisitos_aplicar() {
  local ram
  ram="$(awk -v mb="$REQ_RAM_MB" 'BEGIN { printf "%.1f", mb/1024 }')"
  ui "✓"
  ui "Docker ${REQ_DOCKER} · Compose v2 · ${ram} GB de RAM · ${REQ_DISCO_GB} GB libres"
  ui "✓"
  ui "Puertos 80 y 443 libres"
}
