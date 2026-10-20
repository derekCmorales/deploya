# shellcheck shell=bash
# Etapa 1. Comprueba Docker, Compose v2, RAM, disco y los puertos 80 y 443.

comprobar_docker() {
  if ! REQ_DOCKER="$(docker version --format '{{.Server.Version}}' 2>/dev/null)"; then
    ui "✗"
    ui "Falta Docker. Instala Docker y Compose v2."
    return 1
  fi
  if ! REQ_COMPOSE="$(docker compose version --short 2>/dev/null)"; then
    ui "✗"
    ui "Falta Compose v2."
    return 1
  fi
  if [[ "$REQ_COMPOSE" != 2.* && "$REQ_COMPOSE" != v2* ]]; then
    ui "✗"
    ui "Hace falta Compose v2 (hay ${REQ_COMPOSE})."
    return 1
  fi
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
