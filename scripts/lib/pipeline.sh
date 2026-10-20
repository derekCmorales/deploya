# shellcheck shell=bash
# Pipeline: cada etapa comprueba y aplica. --continuar no repite las hechas.

ETAPAS_ID=(requisitos dominio certificado servicios administrador)
ETAPAS_NOMBRE=(Requisitos Dominio Certificado Servicios Administrador)

recordar_modo() {
  if [[ "$CONTINUAR" == "1" && "$(estado_leer sin_comodin || true)" == "1" ]]; then
    SIN_COMODIN=1
  fi
  estado_poner sin_comodin "$SIN_COMODIN"
  if [[ -z "${DEPLOYA_DOMINIO:-}" ]]; then
    # etapa-dominio lee DOMINIO_BASE.
    # shellcheck disable=SC2034
    DOMINIO_BASE="$(estado_leer dominio_base || true)"
  fi
}

etapa_ya_hecha() {
  [[ "$CONTINUAR" == "1" && "$(estado_leer "$1" || true)" == "hecha" ]]
}

correr_una() {
  local n="$1" id="$2" nombre="$3"
  ui "[${n}/5]"
  ui "$nombre"
  "etapa_${id}_comprobar" || return 1
  "etapa_${id}_aplicar" || return 1
  estado_poner "$id" hecha
}

correr_etapas() {
  local i n id
  for i in "${!ETAPAS_ID[@]}"; do
    id="${ETAPAS_ID[$i]}"
    n=$((i + 1))
    if etapa_ya_hecha "$id"; then
      bitacora "omite etapa ${n} ${ETAPAS_NOMBRE[$i]}"
      continue
    fi
    correr_una "$n" "$id" "${ETAPAS_NOMBRE[$i]}" || return 1
  done
}
