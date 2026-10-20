# shellcheck shell=bash
# Etapa 5. Imprime el código de un solo uso. El hash lo guarda M2, no este script.

etapa_administrador_comprobar() {
  local modo
  modo="$(valor_env MODO_INSTALACION || true)"
  if [[ "$modo" == "autoalojado" ]]; then
    return 0
  fi
  ui "✗"
  ui "El entorno no quedó en modo autoalojado."
  return 1
}

mostrar_codigo() {
  local codigo
  codigo="$(codigo_configuracion)"
  ui "Código de configuración:"
  ui "$codigo"
  ui "(vence en 30 min)"
}

etapa_administrador_aplicar() {
  ui "→ Abre"
  ui "https://${DOMINIO_BASE}/configurar"
  mostrar_codigo
}

emitir_codigo_nuevo() {
  mostrar_codigo
}
