# shellcheck shell=bash
# Command: respaldo previo, versión nueva, migración y reinicio de la plataforma.
# Los contenedores de proyecto llevan la etiqueta app.deploya.proyecto y no se detienen.

nombres_de_proyectos() {
  docker ps --filter "label=app.deploya.proyecto" --format '{{.Names}}'
}

sondear_proyectos() {
  local nombre
  while IFS= read -r nombre; do
    if [[ -z "$nombre" ]]; then
      continue
    fi
    if ! curl --fail --silent --max-time 5 "http://${nombre}/" >/dev/null; then
      ui "✗ ${nombre} dejó de responder."
      return 1
    fi
  done < <(nombres_de_proyectos)
}

version_descrita() {
  git describe --tags --always
}

traer_codigo() {
  git pull --ff-only origin "${DEPLOYA_RAMA:-main}"
}

regresar_codigo() {
  git checkout "$1"
}

migrar() {
  if command -v prisma >/dev/null 2>&1; then
    prisma migrate deploy
    return
  fi
  preparar_compose
  invocar_compose exec -T api npx prisma migrate deploy
}

reiniciar_plataforma() {
  preparar_compose
  invocar_compose restart api web worker
}

escribir_version() {
  local instalada="$1" disponible="$2" previo="$3" anterior="$4" disp="null"
  if [[ -n "$disponible" && "$disponible" != "null" ]]; then
    disp="\"${disponible}\""
  fi
  cat > "${DIR_RESPALDOS}/version.json" <<EOF
{
  "instalada": "${instalada}",
  "disponible": ${disp},
  "respaldoPrevio": "${previo}",
  "versionAnterior": "${anterior}"
}
EOF
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
  if migrar; then
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

actualizar() {
  local anterior nueva
  sondear_proyectos || return 1
  anterior="$(version_descrita)"
  paso_respaldo || return 1
  traer_codigo
  nueva="$(version_descrita)"
  escribir_version "$anterior" "$nueva" "$ULTIMO_TAR" "$anterior"
  sondear_proyectos || return 1
  aplicar_migracion || return 1
  sondear_proyectos || return 1
  reiniciar_plataforma
  sondear_proyectos || return 1
  escribir_version "$nueva" "null" "$ULTIMO_TAR" "$anterior"
  anunciar_exito "$nueva"
}

volver_actualizacion() {
  local archivo anterior previo fecha
  archivo="${DIR_RESPALDOS}/version.json"
  if [[ ! -f "$archivo" ]]; then
    ui "No hay una actualización que volver."
    return 1
  fi
  anterior="$(leer_json "$archivo" versionAnterior)"
  previo="$(leer_json "$archivo" respaldoPrevio)"
  fecha="$(basename "$previo" .tar.gz)"
  restaurar_fecha "$fecha"
  regresar_codigo "$anterior"
  escribir_version "$anterior" "null" "$previo" "$anterior"
  ui "✓ Versión ${anterior} y la base anteriores."
}
