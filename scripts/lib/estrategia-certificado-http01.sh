# shellcheck shell=bash
# Strategy: certificados por proyecto (HTTP-01) cuando el DNS del proveedor no está soportado.
# docker-compose.vps.yml interpola CF_DNS_API_TOKEN; este modo no lo usa y deja un marcador vacío de secreto.

listar_archivos_compose() {
  printf '%s\n' \
    docker-compose.yml \
    docker-compose.vps.yml \
    docker-compose.autoalojado.yml \
    docker-compose.http01.yml
}

certificado_comprobar() {
  # Lo lee etapa-servicios al armar .env; este modo no usa DNS-01.
  # shellcheck disable=SC2034
  PROVEEDOR_TOKEN="no-aplica"
  exigir_correo_acme
}

certificado_aplicar() {
  marcar_ok "Certificados por proyecto (HTTP-01)"
}
