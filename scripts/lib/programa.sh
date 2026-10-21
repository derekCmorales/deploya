# shellcheck shell=bash
# Programa el respaldo diario (ficha 32: «Diario · guarda 7») a las 03:00.
# DEPLOYA_CRON apunta a otro archivo en las pruebas; no se toca el cron del sistema.

escribir_cron() {
  local destino="$1" dir hora
  dir="$(dirname "$destino")"
  mkdir -p "$dir" 2>/dev/null || true
  if [[ ! -w "$dir" ]]; then
    return 1
  fi
  hora="$(printf '%02d:00' "$HORA_RESPALDO")"
  cat > "$destino" <<EOF
# Respaldo diario de Deploya a las ${hora}. Conserva ${CONSERVA_RESPALDOS}.
SHELL=/bin/bash
0 ${HORA_RESPALDO} * * * root ${RAIZ}/scripts/respaldar.sh
EOF
  chmod 644 "$destino"
}

escribir_crontab_usuario() {
  local linea tmp
  linea="0 ${HORA_RESPALDO} * * * ${RAIZ}/scripts/respaldar.sh # deploya-respaldo"
  tmp="$(mktemp)"
  crontab -l 2>/dev/null | grep -v 'deploya-respaldo' > "$tmp" || true
  printf '%s\n' "$linea" >> "$tmp"
  crontab "$tmp"
  rm -f "$tmp"
}

escribir_programa_json() {
  local hora
  hora="$(printf '%02d:00' "$HORA_RESPALDO")"
  asegurar_respaldos
  cat > "${DIR_RESPALDOS}/programa.json" <<EOF
{
  "programa": "diario",
  "hora": "${hora}",
  "conserva": ${CONSERVA_RESPALDOS}
}
EOF
}

instalar_programa() {
  local destino="${DEPLOYA_CRON:-/etc/cron.d/deploya-respaldo}"
  if ! escribir_cron "$destino"; then
    escribir_crontab_usuario || {
      marcar_fallo "No pude programar el respaldo diario (cron 0 ${HORA_RESPALDO} * * *)."
      return 1
    }
  fi
  escribir_programa_json
}
