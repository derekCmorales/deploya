# shellcheck shell=bash
# Etapa 2. La raíz (la web) y un nombre que solo cubre el comodín tienen que
# apuntar a esta máquina. dig +short puede devolver el CNAME antes que la A:
# solo cuentan las IPv4.
# shellcheck disable=SC2034

URL_IP_PUBLICA="https://ifconfig.me"
NOMBRE_COMPROBACION="deploya-comprobacion"
FALLO_COMODIN=""
FALLO_APEX=""
FALLO_COMODIN_SI=0
FALLO_APEX_SI=0
IP_LOCAL=""

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
    marcar_fallo "Falta el dominio base (DEPLOYA_DOMINIO)."
    return 1
  fi
  if ! dominio_valido "$DOMINIO_BASE"; then
    marcar_fallo "El dominio base no es un nombre válido."
    return 1
  fi
  ui "Dominio base: ${DOMINIO_BASE}"
}

ip_de_esta_maquina() {
  curl -4fsS --max-time 5 "$URL_IP_PUBLICA"
}

ips_de() {
  dig +short A "$1" | awk '/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ { print }'
}

# Imprime la IP distinta, o «ninguna» si no hubo A. 0 si todas son esta máquina.
evaluar_nombre() {
  local ip hay=0
  while IFS= read -r ip; do
    [[ -z "$ip" ]] && continue
    hay=1
    if [[ "$ip" != "$IP_LOCAL" ]]; then
      printf '%s' "$ip"
      return 1
    fi
  done < <(ips_de "$1" || true)
  if [[ "$hay" == 0 ]]; then
    printf '%s' "ninguna"
    return 1
  fi
}

anotar_fallo() {
  local cual="$1" resultado
  if resultado="$(evaluar_nombre "$2")"; then
    return 0
  fi
  if [[ "$resultado" == "ninguna" ]]; then
    resultado=""
  fi
  if [[ "$cual" == "comodin" ]]; then
    FALLO_COMODIN="$resultado"
    FALLO_COMODIN_SI=1
    return 0
  fi
  FALLO_APEX="$resultado"
  FALLO_APEX_SI=1
}

frase_apunta() {
  local nombre="$1" mala="$2"
  if [[ -z "$mala" ]]; then
    printf '%s no resuelve, no apunta a esta máquina (%s).' "$nombre" "$IP_LOCAL"
    return
  fi
  printf '%s apunta a %s, no a esta máquina (%s).' "$nombre" "$mala" "$IP_LOCAL"
}

registros_que_crear() {
  local etiqueta="${DOMINIO_BASE%%.*}"
  if [[ "$FALLO_COMODIN_SI" == 1 ]]; then
    ui "*.${etiqueta} → ${IP_LOCAL}"
  fi
  if [[ "$FALLO_APEX_SI" == 1 ]]; then
    ui "${etiqueta} → ${IP_LOCAL}"
  fi
}

explicar_dns() {
  if [[ "$FALLO_COMODIN_SI" == 1 ]]; then
    marcar_fallo "$(frase_apunta "*.${DOMINIO_BASE}" "$FALLO_COMODIN")"
  fi
  if [[ "$FALLO_APEX_SI" == 1 ]]; then
    marcar_fallo "$(frase_apunta "${DOMINIO_BASE}" "$FALLO_APEX")"
  fi
  ui "Qué hacer"
  ui "1. En tu proveedor DNS crea un registro A:"
  registros_que_crear
  ui "2. Espera a que propague (normalmente minutos)"
  ui "3. Sigue donde quedó:"
  ui "./scripts/instalar.sh --continuar"
  ui "No se instaló nada todavía. Bitácora: $(bitacora_visible)"
}

etapa_dominio_comprobar() {
  FALLO_COMODIN_SI=0
  FALLO_APEX_SI=0
  leer_dominio || return 1
  if ! IP_LOCAL="$(ip_de_esta_maquina)"; then
    marcar_fallo "No pude saber la IP de esta máquina."
    return 1
  fi
  anotar_fallo comodin "${NOMBRE_COMPROBACION}.${DOMINIO_BASE}"
  anotar_fallo apex "${DOMINIO_BASE}"
  if [[ "$FALLO_COMODIN_SI" == 0 && "$FALLO_APEX_SI" == 0 ]]; then
    return 0
  fi
  explicar_dns
  return 1
}

etapa_dominio_aplicar() {
  estado_poner dominio_base "$DOMINIO_BASE"
  marcar_ok "*.${DOMINIO_BASE} → ${IP_LOCAL} (esta máquina)"
  marcar_ok "${DOMINIO_BASE} → ${IP_LOCAL} (esta máquina)"
}
