# shellcheck shell=bash
# Command: pg_dump + entorno sin la clave de cifrado + manifiesto. Conserva 7.

# CONSERVA_RESPALDOS vive en comun.sh (el cron y ultimo.json usan el mismo número).

clave_es() {
  [[ "${1%%=*}" == "CLAVE_CIFRADO_VARIABLES" ]]
}

filtrar_entorno() {
  local origen="$1" destino="$2" linea
  : > "$destino"
  while IFS= read -r linea || [[ -n "$linea" ]]; do
    if clave_es "$linea"; then
      continue
    fi
    printf '%s\n' "$linea" >> "$destino"
  done < "$origen"
  chmod 600 "$destino"
}

escribir_manifiesto() {
  cat > "$2" <<EOF
{
  "fecha": "${1}",
  "incluye": ["base.sql", "entorno.env"],
  "claveCifrado": "omitida"
}
EOF
}

# Siempre dentro del contenedor: en el servidor postgres no publica puertos (ports: !reset []).
# --clean --if-exists: el volcado borra lo que encuentre antes de recrearlo, así restaura
# aunque una migración haya quedado a medias.
volcar_base() {
  local salida="$1"
  preparar_compose
  invocar_compose exec -T postgres pg_dump --clean --if-exists --no-owner \
    -U "$(valor_env POSTGRES_USER)" "$(valor_env POSTGRES_DB)" > "$salida"
}

# ON_ERROR_STOP y una sola transacción: un error deja la base como estaba, no a medias.
cargar_base() {
  local sql="$1"
  preparar_compose
  invocar_compose exec -T postgres psql --quiet -v ON_ERROR_STOP=1 --single-transaction \
    -U "$(valor_env POSTGRES_USER)" -d "$(valor_env POSTGRES_DB)" < "$sql" > /dev/null
}

empaquetar() {
  ULTIMO_TAR="${DIR_RESPALDOS}/${2}.tar.gz"
  tar -czf "$ULTIMO_TAR" -C "$1" base.sql entorno.env manifiesto.json
}

tamano_mb() {
  local bytes
  bytes="$(wc -c < "$1")"
  awk -v b="$bytes" 'BEGIN { printf "%.1f", b/1048576 }'
}

podar_respaldos() {
  local -a archivos=()
  mapfile -t archivos < <(find "$DIR_RESPALDOS" -maxdepth 1 -type f -name '*.tar.gz' | sort)
  while ((${#archivos[@]} > CONSERVA_RESPALDOS)); do
    rm -f "${archivos[0]}"
    archivos=("${archivos[@]:1}")
  done
}

escribir_ultimo() {
  local mb hora
  mb="$(tamano_mb "$ULTIMO_TAR")"
  hora="$(printf '%02d:00' "$HORA_RESPALDO")"
  cat > "${DIR_RESPALDOS}/ultimo.json" <<EOF
{
  "ultimo": "${1}",
  "tamanoMb": ${mb},
  "ruta": "${ULTIMO_TAR}",
  "programa": "diario",
  "hora": "${hora}",
  "conserva": ${CONSERVA_RESPALDOS}
}
EOF
}

avisar_clave() {
  ui "Guarda la clave de cifrado fuera de este servidor."
  ui "Sin CLAVE_CIFRADO_VARIABLES, un respaldo restaura los proyectos pero no puede leer sus variables de entorno."
}

crear_respaldo() {
  local marca sello trabajo
  if [[ ! -f "$ARCHIVO_ENTORNO" ]]; then
    ui "Falta el entorno (${ARCHIVO_ENTORNO})."
    return 1
  fi
  asegurar_respaldos
  marca="$(marca_tiempo)"
  sello="$(sello_respaldo "$marca")"
  trabajo="$(mktemp -d)"
  volcar_base "${trabajo}/base.sql"
  filtrar_entorno "$ARCHIVO_ENTORNO" "${trabajo}/entorno.env"
  escribir_manifiesto "$marca" "${trabajo}/manifiesto.json"
  empaquetar "$trabajo" "$sello"
  rm -rf "$trabajo"
  podar_respaldos
  escribir_ultimo "$marca"
  avisar_clave
}

restaurar_entorno() {
  local respaldo="$1" clave tmp
  clave="$(valor_env CLAVE_CIFRADO_VARIABLES || true)"
  tmp="$(mktemp)"
  cat "$respaldo" > "$tmp"
  if [[ -n "$clave" ]]; then
    printf '%s="%s"\n' CLAVE_CIFRADO_VARIABLES "$clave" >> "$tmp"
  fi
  install -m 600 "$tmp" "$ARCHIVO_ENTORNO"
  rm -f "$tmp"
}

fecha_valida() {
  [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]
}

sello_valido() {
  [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}Z$ ]]
}

archivo_del_dia() {
  find "$DIR_RESPALDOS" -maxdepth 1 -type f -name "$1T*.tar.gz" | sort | tail -1
}

buscar_respaldo() {
  local pedido="$1" del_dia
  if sello_valido "$pedido" && [[ -f "${DIR_RESPALDOS}/${pedido}.tar.gz" ]]; then
    printf '%s' "${DIR_RESPALDOS}/${pedido}.tar.gz"
    return 0
  fi
  if ! fecha_valida "$pedido"; then
    return 1
  fi
  del_dia="$(archivo_del_dia "$pedido")"
  if [[ -n "$del_dia" ]]; then
    printf '%s' "$del_dia"
    return 0
  fi
  if [[ -f "${DIR_RESPALDOS}/${pedido}.tar.gz" ]]; then
    printf '%s' "${DIR_RESPALDOS}/${pedido}.tar.gz"
    return 0
  fi
  return 1
}

restaurar_fecha() {
  local pedido="$1" archivo trabajo
  if ! sello_valido "$pedido" && ! fecha_valida "$pedido"; then
    ui "La fecha es AAAA-MM-DD o la marca del archivo."
    return 1
  fi
  asegurar_respaldos
  if ! archivo="$(buscar_respaldo "$pedido")"; then
    ui "No hay respaldo ${pedido}."
    return 1
  fi
  trabajo="$(mktemp -d)"
  tar -xzf "$archivo" -C "$trabajo"
  # Solo la plataforma se detiene; las apps publicadas siguen sirviendo.
  detener_plataforma
  if ! cargar_base "${trabajo}/base.sql"; then
    rm -rf "$trabajo"
    levantar_plataforma
    ui "✗ No se pudo restaurar ${pedido}: la base quedó como estaba."
    return 1
  fi
  restaurar_entorno "${trabajo}/entorno.env"
  rm -rf "$trabajo"
  levantar_plataforma
  ui "✓ Restaurado ${pedido}."
}
