# shellcheck shell=bash
# Etapa 3. Delega en la estrategia elegida (comodín DNS-01 o HTTP-01).

exigir_correo_acme() {
  if [[ -n "${DEPLOYA_ACME_CORREO:-}" ]]; then
    return 0
  fi
  ui "✗"
  ui "Falta el correo de Let's Encrypt (DEPLOYA_ACME_CORREO)."
  return 1
}

etapa_certificado_comprobar() {
  certificado_comprobar
}

etapa_certificado_aplicar() {
  certificado_aplicar
}
