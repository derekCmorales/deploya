# shellcheck shell=bash
# Elige el archivo de la estrategia. El if solo compone; la lista de compose
# vive en cada estrategia, no en un switch de comun.sh.

cargar_estrategia() {
  if [[ "$1" == "1" ]]; then
    # shellcheck source=estrategia-certificado-http01.sh
    source "${LIB}/estrategia-certificado-http01.sh"
    return
  fi
  # shellcheck source=estrategia-certificado-comodin.sh
  source "${LIB}/estrategia-certificado-comodin.sh"
}

cargar_estrategia_guardada() {
  if [[ "$(estado_leer sin_comodin || true)" == "1" ]]; then
    cargar_estrategia 1
    return
  fi
  cargar_estrategia 0
}
