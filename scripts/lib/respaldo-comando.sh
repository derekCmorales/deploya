# shellcheck shell=bash
# Command: pg_dump + entorno sin la clave de cifrado + manifiesto. Conserva 7.

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

volcar_base() {
  local salida="$1" user pass db
  user="$(valor_env POSTGRES_USER)"
  pass="$(valor_env POSTGRES_PASSWORD)"
  db="$(valor_env POSTGRES_DB)"
  if command -v pg_dump >/dev/null 2>&1; then
    PGPASSWORD="$pass" pg_dump --file="$salida" --host=127.0.0.1 --username="$user" --dbname="$db"
    return
  fi
  preparar_compose
  invocar_compose exec -T postgres pg_dump -U "$user" "$db" > "$salida"
}

cargar_base() {
  local sql="$1" user pass db
  user="$(valor_env POSTGRES_USER)"
  pass="$(valor_env POSTGRES_PASSWORD)"
  db="$(valor_env POSTGRES_DB)"
  if command -v psql >/dev/null 2>&1; then
    PGPASSWORD="$pass" psql --host=127.0.0.1 --username="$user" --dbname="$db" --file="$sql" >/dev/null
    return
  fi
  preparar_compose
  invocar_compose exec -T postgres psql -U "$user" -d "$db" < "$sql"
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
  while ((${#archivos[@]} > MAX_RESPALDOS)); do
    rm -f "${archivos[0]}"
    archivos=("${archivos[@]:1}")
  done
}

escribir_ultimo() {
  local mb
  mb="$(tamano_mb "$ULTIMO_TAR")"
  cat > "${DIR_RESPALDOS}/ultimo.json" <<EOF
{
  "ultimo": "${1}",
  "tamanoMb": ${mb},
  "ruta": "${ULTIMO_TAR}"
}
EOF
}

avisar_clave() {
  ui "Guarda la clave de cifrado fuera de este servidor."
  ui "Sin CLAVE_CIFRADO_VARIABLES, un respaldo restaura los proyectos pero no puede leer sus variables de entorno."
}

crear_respaldo() {
  local fecha trabajo
  if [[ ! -f "$ARCHIVO_ENTORNO" ]]; then
    ui "Falta el entorno (${ARCHIVO_ENTORNO})."
    return 1
  fi
  asegurar_respaldos
  fecha="$(fecha_respaldo)"
  trabajo="$(mktemp -d)"
  volcar_base "${trabajo}/base.sql"
  filtrar_entorno "$ARCHIVO_ENTORNO" "${trabajo}/entorno.env"
  escribir_manifiesto "$fecha" "${trabajo}/manifiesto.json"
  empaquetar "$trabajo" "$fecha"
  rm -rf "$trabajo"
  podar_respaldos
  escribir_ultimo "$fecha"
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

restaurar_fecha() {
  local fecha="$1" tar trabajo
  if ! fecha_valida "$fecha"; then
    ui "La fecha es AAAA-MM-DD."
    return 1
  fi
  asegurar_respaldos
  tar="${DIR_RESPALDOS}/${fecha}.tar.gz"
  if [[ ! -f "$tar" ]]; then
    ui "No hay respaldo ${fecha}."
    return 1
  fi
  trabajo="$(mktemp -d)"
  tar -xzf "$tar" -C "$trabajo"
  cargar_base "${trabajo}/base.sql"
  restaurar_entorno "${trabajo}/entorno.env"
  rm -rf "$trabajo"
  ui "✓ Restaurado ${fecha}."
}
