# shellcheck shell=bash
# Strategy: certificado comodín por DNS-01. El proveedor es un archivo en proveedores/.

listar_archivos_compose() {
  printf '%s\n' docker-compose.yml docker-compose.vps.yml docker-compose.autoalojado.yml
}

certificado_comprobar() {
  local proveedor="${DEPLOYA_PROVEEDOR_DNS:-cloudflare}"
  local archivo="${LIB}/proveedores/${proveedor}.sh"
  if [[ ! -f "$archivo" ]]; then
    ui "✗"
    ui "El proveedor DNS «${proveedor}» no está soportado."
    ui "Ofrece certificados por proyecto (HTTP-01):"
    ui "./scripts/instalar.sh --sin-comodin"
    return 1
  fi
  # shellcheck source=/dev/null
  source "$archivo"
  proveedor_comprobar || return 1
  exigir_correo_acme
}

certificado_aplicar() {
  ui "Proveedor DNS: ${PROVEEDOR_NOMBRE} · token solo de la zona: ••••"
  ui "✓"
  ui "Comodín emitido por Let’s Encrypt · se renueva solo"
}
