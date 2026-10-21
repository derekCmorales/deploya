# shellcheck shell=bash
# Command: respaldo previo, versión nueva, migración y reinicio de la plataforma.
# Los contenedores de proyecto llevan la etiqueta app.deploya.proyecto y no se detienen:
# compose solo reconstruye y recrea api, web y trabajador.
# El sondeo va por la URL pública (Traefik): desde el host el nombre del contenedor no resuelve.

ETIQUETA_PROYECTO="app.deploya.proyecto"
PREFIJO_RED_PROYECTO="deploya-p-"
SEGUNDOS_SONDEO=5

leer_json() {
  local archivo="$1" clave="$2" linea valor
  [[ -f "$archivo" ]] || return 1
  while IFS= read -r linea || [[ -n "$linea" ]]; do
    if [[ "$linea" == *"\"${clave}\""* ]]; then
      valor="${linea#*:}"
      valor="${valor//\"/}"
      valor="${valor//,/}"
      valor="${valor// /}"
      printf '%s' "$valor"
      return 0
    fi
  done < "$archivo"
  return 1
}

subdominios_publicados() {
  docker ps --filter "label=${ETIQUETA_PROYECTO}" --format "{{.Label \"${ETIQUETA_PROYECTO}\"}}" \
    | sed -n "s/^${PREFIJO_RED_PROYECTO}//p" | sort -u
}

dominio_publico() {
  if [[ -z "$DOMINIO_BASE" ]]; then
    DOMINIO_BASE="$(valor_env DOMINIO_BASE || true)"
  fi
  printf '%s' "$DOMINIO_BASE"
}

# Cualquier respuesta HTTP cuenta: un 500 de la app no es un corte; un timeout o un rechazo, sí.
app_responde() {
  curl --silent --output /dev/null --max-time "$SEGUNDOS_SONDEO" "https://${1}/"
}

sondear_proyectos() {
  local subdominio dominio host
  dominio="$(dominio_publico)"
  while IFS= read -r subdominio; do
    if [[ -z "$subdominio" ]]; then
      continue
    fi
    host="${subdominio}.${dominio}"
    if ! app_responde "$host"; then
      ui "✗ ${host} dejó de responder."
      return 1
    fi
  done < <(subdominios_publicados)
}

version_descrita() {
  git describe --tags --always
}

traer_etiquetas() {
  git fetch --tags --quiet origin
}

lista_etiquetas() {
  git tag --list 'v*' 2>/dev/null || true
}

disponible_para() {
  local actual="$1" ultima
  ultima="$(lista_etiquetas | sed '/^$/d' | sort -V | tail -1)"
  if [[ -z "$ultima" || "$ultima" == "$actual" ]]; then
    return 0
  fi
  if [[ "$(printf '%s\n%s\n' "$actual" "$ultima" | sort -V | tail -1)" == "$ultima" ]]; then
    printf '%s' "$ultima"
  fi
}

# Deja el checkout en la etiqueta pedida. Detached a propósito: la instalación sigue versiones, no una rama.
poner_codigo_en() {
  git checkout --quiet --detach "$1"
}

# Las migraciones viajan dentro de la imagen: hay que construir antes de migrar.
construir_plataforma() {
  preparar_compose
  invocar_compose build api web worker migracion
}

migrar() {
  preparar_compose
  invocar_compose run --rm migracion
}

json_valor() {
  if [[ -z "$1" || "$1" == "null" ]]; then
    printf 'null'
    return
  fi
  printf '"%s"' "$1"
}

escribir_version() {
  local instalada="$1" disponible="$2" previo="$3" anterior="$4"
  asegurar_respaldos
  cat > "${DIR_RESPALDOS}/version.json" <<EOF
{
  "instalada": $(json_valor "$instalada"),
  "disponible": $(json_valor "$disponible"),
  "respaldoPrevio": $(json_valor "$previo"),
  "versionAnterior": $(json_valor "$anterior")
}
EOF
}

refrescar_disponible() {
  local instalada disponible previo anterior archivo
  traer_etiquetas || true
  instalada="$(version_descrita || true)"
  disponible="$(disponible_para "$instalada")"
  archivo="${DIR_RESPALDOS}/version.json"
  previo="$(leer_json "$archivo" respaldoPrevio || true)"
  anterior="$(leer_json "$archivo" versionAnterior || true)"
  escribir_version "$instalada" "$disponible" "$previo" "$anterior"
}

anunciar_volver() {
  ui "Si algo sale mal,"
  ui "./scripts/actualizar.sh --volver"
  ui "restaura el respaldo previo."
}

anunciar_respaldo() {
  ui "✓"
  ui "Respaldo previo · ${ULTIMO_TAR}"
}

anunciar_exito() {
  ui "✓"
  ui "${1} descargada · migraciones aplicadas"
  ui "✓"
  ui "api, web y trabajador reiniciados · las apps publicadas no se cortan"
  anunciar_volver
}

aplicar_migracion() {
  if construir_plataforma && migrar; then
    return 0
  fi
  ui "La migración falló."
  anunciar_volver
  return 1
}

paso_respaldo() {
  crear_respaldo || return 1
  anunciar_respaldo
  sondear_proyectos
}

version_objetivo() {
  printf '%s' "${DEPLOYA_VERSION_OBJETIVO:-$(disponible_para "$1")}"
}

actualizar() {
  local anterior objetivo nueva
  traer_etiquetas || true
  anterior="$(version_descrita)"
  objetivo="$(version_objetivo "$anterior")"
  if [[ -z "$objetivo" ]]; then
    ui "✓ Ya estás en la última versión (${anterior})."
    escribir_version "$anterior" "" "$(leer_json "${DIR_RESPALDOS}/version.json" respaldoPrevio || true)" "$(leer_json "${DIR_RESPALDOS}/version.json" versionAnterior || true)"
    return 0
  fi
  sondear_proyectos || return 1
  paso_respaldo || return 1
  escribir_version "$anterior" "$objetivo" "$ULTIMO_TAR" "$anterior"
  poner_codigo_en "$objetivo"
  nueva="$(version_descrita)"
  aplicar_migracion || return 1
  sondear_proyectos || return 1
  levantar_plataforma
  sondear_proyectos || return 1
  escribir_version "$nueva" "$(disponible_para "$nueva")" "$ULTIMO_TAR" "$anterior"
  anunciar_exito "$nueva"
}

volver_actualizacion() {
  local archivo anterior previo fecha
  archivo="${DIR_RESPALDOS}/version.json"
  if [[ ! -f "$archivo" ]]; then
    ui "No hay una actualización que volver."
    return 1
  fi
  traer_etiquetas || true
  anterior="$(leer_json "$archivo" versionAnterior)"
  previo="$(leer_json "$archivo" respaldoPrevio)"
  fecha="$(basename "$previo" .tar.gz)"
  # Primero el código y sus imágenes; luego la base, con la plataforma detenida, y arriba la versión anterior.
  poner_codigo_en "$anterior"
  construir_plataforma || return 1
  restaurar_fecha "$fecha" || return 1
  escribir_version "$anterior" "$(disponible_para "$anterior")" "$previo" "$anterior"
  ui "✓ Versión ${anterior} y la base anteriores."
}
