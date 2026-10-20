# shellcheck shell=bash
# Etapa 4. Escribe .env (600) y levanta la plataforma. Solo corre si 1–3 pasaron.

etapa_servicios_comprobar() {
  local dir
  dir="$(dirname "$ARCHIVO_ENTORNO")"
  if [[ ! -d "$dir" || ! -w "$dir" ]]; then
    ui "✗"
    ui "No puedo escribir el entorno en ${dir}."
    return 1
  fi
  if [[ ! -f "${RAIZ}/docker-compose.yml" ]]; then
    ui "✗"
    ui "Falta docker-compose.yml."
    return 1
  fi
}

abrir_entorno() {
  ENTORNO_TMP="$(mktemp)"
  printf '%s\n' "# Generado por scripts/instalar.sh. Permisos 600." > "$ENTORNO_TMP"
}

agregar_env() {
  printf '%s="%s"\n' "$1" "$2" >> "$ENTORNO_TMP"
}

cerrar_entorno() {
  install -m 600 "$ENTORNO_TMP" "$ARCHIVO_ENTORNO"
  rm -f "$ENTORNO_TMP"
}

agregar_plataforma() {
  agregar_env MODO_INSTALACION autoalojado
  agregar_env DOMINIO_BASE "$DOMINIO_BASE"
  agregar_env ESQUEMA_PUBLICO https
  agregar_env CERT_RESOLVER letsencrypt
  agregar_env POSTGRES_USER deploya
  agregar_env POSTGRES_DB deploya
  agregar_env POSTGRES_PASSWORD "$SECRETO_PG"
  agregar_env CLAVE_CIFRADO_VARIABLES "$(secreto_32)"
  agregar_env SECRETO_SESION "$(secreto_32)"
  agregar_env ADMIN_CORREO "${DEPLOYA_ADMIN_CORREO:-admin@${DOMINIO_BASE}}"
  agregar_env ADMIN_CLAVE "$SECRETO_ADMIN"
  agregar_env CLIENTE_CLAVE "$SECRETO_CLIENTE"
  agregar_env ACME_CORREO "$DEPLOYA_ACME_CORREO"
  agregar_env CF_DNS_API_TOKEN "${PROVEEDOR_TOKEN:-no-aplica}"
}

agregar_correo() {
  local remitente="Deploya <no-responder@${DOMINIO_BASE}>"
  agregar_env SMTP_HOST "${DEPLOYA_SMTP_HOST:-127.0.0.1}"
  agregar_env SMTP_PORT "${DEPLOYA_SMTP_PORT:-25}"
  agregar_env SMTP_USUARIO "${DEPLOYA_SMTP_USUARIO:-}"
  agregar_env SMTP_CLAVE "${DEPLOYA_SMTP_CLAVE:-}"
  agregar_env CORREO_REMITENTE "${DEPLOYA_CORREO_REMITENTE:-$remitente}"
  agregar_env GITHUB_TOKEN "${DEPLOYA_GITHUB_TOKEN:-}"
}

olvidar_secretos() {
  unset SECRETO_PG SECRETO_ADMIN SECRETO_CLIENTE
}

escribir_entorno() {
  SECRETO_PG="$(secreto_32)"
  SECRETO_ADMIN="$(secreto_32)"
  SECRETO_CLIENTE="$(secreto_32)"
  abrir_entorno
  agregar_plataforma
  agregar_correo
  cerrar_entorno
  olvidar_secretos
}

generar_plataforma() {
  mkdir -p "$(dirname "$GENERADO")"
  sed "s/__DOMINIO_BASE__/${DOMINIO_BASE}/g" \
    "${RAIZ}/infra/traefik/plataforma.vps.yml" > "$GENERADO"
}

levantar_servicios() {
  invocar_compose up -d --build
  invocar_compose run --rm migracion
}

comprobar_https() {
  local url="https://${DOMINIO_BASE}/configurar"
  if ! curl --fail --silent --show-error --max-time 15 "$url" >/dev/null; then
    ui "✗"
    ui "Los servicios no responden en ${url}."
    return 1
  fi
  ui "✓"
  ui "postgres · redis · api · web · trabajador · traefik"
}

etapa_servicios_aplicar() {
  if [[ ! -f "$ARCHIVO_ENTORNO" ]]; then
    escribir_entorno
  fi
  generar_plataforma
  preparar_compose
  levantar_servicios
  comprobar_https
}
