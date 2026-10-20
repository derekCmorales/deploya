# shellcheck shell=bash
# Etapa 2. El comodín tiene que apuntar a esta máquina antes de escribir .env.

URL_IP_PUBLICA="https://ifconfig.me"

dominio_valido() {
  [[ "$1" =~ ^[A-Za-z0-9.-]+$ ]]
}

leer_dominio() {
  if [[ -n "${DEPLOYA_DOMINIO:-}" ]]; then
    DOMINIO_BASE="$DEPLOYA_DOMINIO"
  fi
  if [[ -z "$DOMINIO_BASE" && -t 0 ]]; then
    printf 'Dominio base: '
    IFS= read -r DOMINIO_BASE
  fi
  if [[ -z "$DOMINIO_BASE" ]]; then
    ui "✗"
    ui "Falta el dominio base (DEPLOYA_DOMINIO)."
    return 1
  fi
  if ! dominio_valido "$DOMINIO_BASE"; then
    ui "✗"
    ui "El dominio base no es un nombre válido."
    return 1
  fi
}

ip_de_esta_maquina() {
  curl -4fsS --max-time 5 "$URL_IP_PUBLICA"
}

ip_del_comodin() {
  dig +short A "*.${DOMINIO_BASE}" | awk 'NR==1 { print }'
}

frase_dns() {
  if [[ -z "$1" ]]; then
    printf '*.%s no resuelve, no apunta a esta máquina (%s).' "$DOMINIO_BASE" "$2"
    return
  fi
  printf '*.%s apunta a %s, no a esta máquina (%s).' "$DOMINIO_BASE" "$1" "$2"
}

explicar_dns() {
  local etiqueta="${DOMINIO_BASE%%.*}"
  ui "✗"
  ui "$(frase_dns "$1" "$2")"
  ui "Qué hacer"
  ui "1. En tu proveedor DNS crea un registro A:"
  ui "*.${etiqueta} → ${2}"
  ui "2. Espera a que propague (normalmente minutos) 3. Sigue donde quedó:"
  ui "./scripts/instalar.sh --continuar"
  ui "No se instaló nada todavía. Bitácora: $(bitacora_visible)"
}

etapa_dominio_comprobar() {
  leer_dominio || return 1
  if ! IP_LOCAL="$(ip_de_esta_maquina)"; then
    ui "✗"
    ui "No pude saber la IP de esta máquina."
    return 1
  fi
  IP_DNS="$(ip_del_comodin || true)"
  if [[ "$IP_DNS" != "$IP_LOCAL" ]]; then
    explicar_dns "$IP_DNS" "$IP_LOCAL"
    return 1
  fi
}

etapa_dominio_aplicar() {
  estado_poner dominio_base "$DOMINIO_BASE"
  ui "✓"
  ui "*.${DOMINIO_BASE} → ${IP_LOCAL} (esta máquina)"
}
