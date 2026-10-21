# shellcheck shell=bash
# Etapa 4. Escribe .env (600) y levanta la plataforma. Solo corre si 1–3 pasaron.
# /configurar todavía no existe (asistente de Eddy): basta cualquier respuesta HTTPS.
# El certificado DNS-01 tarda; se reintenta en vez de un solo curl.

INTENTOS_HTTPS=36
PAUSA_HTTPS_SEG=5

etapa_servicios_comprobar() {
  local dir
  dir="$(dirname "$ARCHIVO_ENTORNO")"
  if [[ ! -d "$dir" || ! -w "$dir" ]]; then
    marcar_fallo "No puedo escribir el entorno en ${dir}."
    return 1
  fi
  if [[ ! -f "${RAIZ}/docker-compose.yml" ]]; then
    marcar_fallo "Falta docker-compose.yml."
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
  # El compose de la nube exige estas claves al interpolar. El seed autoalojado no crea cuentas.
  agregar_env ADMIN_CLAVE "$SECRETO_ADMIN"
  agregar_env CLIENTE_CLAVE "$SECRETO_CLIENTE"
  agregar_env HASH_CODIGO_CONFIGURACION "$HASH_CODIGO"
  agregar_env CODIGO_VENCE "$VENCE_CODIGO"
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
  preparar_codigo
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

pausa_https() {
  printf '%s' "${DEPLOYA_PAUSA_HTTPS_SEG:-$PAUSA_HTTPS_SEG}"
}

limite_https() {
  printf '%s' "${DEPLOYA_INTENTOS_HTTPS:-$INTENTOS_HTTPS}"
}

https_responde() {
  curl --silent --output /dev/null --max-time 10 --connect-timeout 5 "https://${DOMINIO_BASE}/"
}

mes_corto() {
  case "$1" in
    Jan) printf 'ene' ;;
    Feb) printf 'feb' ;;
    Mar) printf 'mar' ;;
    Apr) printf 'abr' ;;
    May) printf 'may' ;;
    Jun) printf 'jun' ;;
    Jul) printf 'jul' ;;
    Aug) printf 'ago' ;;
    Sep) printf 'sep' ;;
    Oct) printf 'oct' ;;
    Nov) printf 'nov' ;;
    Dec) printf 'dic' ;;
    *) printf '%s' "$1" ;;
  esac
}

fecha_certificado() {
  local linea mes dia anio
  linea="$(printf '%s\n' "$1" | awk '/notAfter=/{ print; exit }')"
  mes="${linea%% *}"
  mes="${mes#notAfter=}"
  dia="$(printf '%s\n' "$linea" | awk '{ print $2 }')"
  anio="$(printf '%s\n' "$linea" | awk '{ print $4 }')"
  printf '%s %s %s' "$dia" "$(mes_corto "$mes")" "$anio"
}

leer_certificado() {
  local host="$1" pem texto
  pem="$(timeout 10 openssl s_client -servername "$host" -connect "${host}:443" </dev/null 2>/dev/null | sed -n '/BEGIN CERTIFICATE/,/END CERTIFICATE/p' || true)"
  if [[ -z "$pem" ]]; then
    return 1
  fi
  texto="$(printf '%s\n' "$pem" | openssl x509 -noout -enddate -ext subjectAltName 2>/dev/null || true)"
  if [[ -z "$texto" ]]; then
    return 1
  fi
  printf '%s\n' "$texto"
}

certificado_cubre() {
  local texto="$1" host="$2"
  [[ "$texto" == *"DNS:${host}"* ]] || return 1
  if [[ "${SIN_COMODIN:-0}" == "1" ]]; then
    return 0
  fi
  [[ "$texto" == *"DNS:*.${host}"* ]]
}

https_listo() {
  local texto
  https_responde || return 1
  texto="$(leer_certificado "$DOMINIO_BASE")" || return 1
  certificado_cubre "$texto" "$DOMINIO_BASE" || return 1
  CERT_TEXTO="$texto"
}

esperar_https() {
  local n=0 pausa limite
  pausa="$(pausa_https)"
  limite="$(limite_https)"
  while (( n < limite )); do
    n=$((n + 1))
    if https_listo; then
      return 0
    fi
    if (( n < limite )); then
      sleep "$pausa"
    fi
  done
  return 1
}

anunciar_certificado() {
  local cuando="$1"
  if [[ "${SIN_COMODIN:-0}" == "1" ]]; then
    marcar_ok "Certificado emitido por Let's Encrypt · vence ${cuando}"
    return 0
  fi
  marcar_ok "Comodín emitido por Let's Encrypt · vence ${cuando}"
}

comprobar_https() {
  if ! esperar_https; then
    marcar_fallo "HTTPS en ${DOMINIO_BASE} no respondió con el certificado."
    return 1
  fi
  marcar_ok "postgres · redis · api · web · trabajador · traefik"
  anunciar_certificado "$(fecha_certificado "$CERT_TEXTO")"
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
