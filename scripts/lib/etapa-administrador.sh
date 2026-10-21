# shellcheck shell=bash
# Etapa 5. Imprime el código una vez. El hash sha256 y el vencimiento van a
# .env; el seed de autoalojado los copia a ConfiguracionInstalacion.
# El código en claro no entra en la bitácora.

etapa_administrador_comprobar() {
  local modo
  modo="$(valor_env MODO_INSTALACION || true)"
  if [[ "$modo" == "autoalojado" ]]; then
    return 0
  fi
  marcar_fallo "El entorno no quedó en modo autoalojado."
  return 1
}

mostrar_codigo() {
  if [[ -z "$CODIGO_EN_CURSO" ]]; then
    printf '%s\n' "El código es el que imprimió --codigo-nuevo." "(vence en ${MINUTOS_VIGENCIA_CODIGO} min)"
    return 0
  fi
  printf '%s\n' "Código de configuración:" "$CODIGO_EN_CURSO" "(vence en ${MINUTOS_VIGENCIA_CODIGO} min)"
}

hay_administrador() {
  local salida
  [[ -f "$ARCHIVO_ENTORNO" ]] || return 1
  preparar_compose
  salida="$(invocar_compose exec -T postgres psql -tA -U "$(valor_env POSTGRES_USER)" -d "$(valor_env POSTGRES_DB)" -c "SELECT 1 FROM \"Usuario\" WHERE rol = 'administrador' LIMIT 1" 2>/dev/null || true)"
  [[ "$salida" == *1* ]]
}

publicar_codigo() {
  preparar_compose
  invocar_compose run --rm migracion
}

guardar_codigo_en_entorno() {
  reemplazar_env HASH_CODIGO_CONFIGURACION "$HASH_CODIGO"
  reemplazar_env CODIGO_VENCE "$VENCE_CODIGO"
}

etapa_administrador_aplicar() {
  if [[ -z "$CODIGO_EN_CURSO" && "$CODIGO_PENDIENTE" != 1 ]]; then
    ui "Si no anotaste el código, genera otro con ./scripts/instalar.sh --codigo-nuevo"
  else
    marcar_ok "→ Abre https://${DOMINIO_BASE}/configurar"
    mostrar_codigo
  fi
  instalar_programa || return 1
  refrescar_disponible || true
}

emitir_codigo_nuevo() {
  if [[ -f "$ARCHIVO_ENTORNO" ]] && hay_administrador; then
    ui "Ya hay un administrador. El código no se regenera."
    return 1
  fi
  HASH_CODIGO=""
  VENCE_CODIGO=""
  CODIGO_EN_CURSO=""
  # preparar_codigo (secretos.sh) lee FORZAR_CODIGO.
  # shellcheck disable=SC2034
  FORZAR_CODIGO=1
  preparar_codigo
  # shellcheck disable=SC2034
  FORZAR_CODIGO=0
  rm -f "${DEPLOYA_HOME}/codigo.pendiente"
  if [[ -f "$ARCHIVO_ENTORNO" ]]; then
    guardar_codigo_en_entorno
    publicar_codigo || return 1
  else
    guardar_pendiente
  fi
  mostrar_codigo
}
