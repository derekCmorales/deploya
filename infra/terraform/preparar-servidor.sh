#!/usr/bin/env bash
# Prepara la EC2 de Deploya en el primer arranque. cloud-init lo instala en
# /usr/local/sbin/deploya-preparar.sh y lo corre una vez (runcmd); se puede repetir a mano sin
# romper nada. No lee ni escribe secretos: .env.vps se copia después, a mano (docs/infra-vps.md §0).
# Bitácora: /var/log/cloud-init-output.log.
set -euo pipefail

CONFIGURACION=/etc/deploya/servidor.env
USUARIO=deploya
CLON=/srv/deploya
RESPALDOS=/var/backups/deploya
MARCA=/var/lib/deploya/preparado
COMPOSE_MINIMO=2.24.0
INTENTOS=5
export DEBIAN_FRONTEND=noninteractive

# Imágenes que se descargan de antemano para que la primera construcción de la demo no espere a
# Docker Hub. Son las de las recetas de detección de stack
# (apps/api/src/modules/construccion/deteccion/plantillas.ts y deteccion.constantes.ts) y las de
# docker-compose.yml (node:22-alpine también es la base de Dockerfile.api y Dockerfile.web).
# Si cambian allí, cámbialas aquí. `docker image prune -f` del cron no las borra: tienen etiqueta.
IMAGENES_BASE=(
  node:22-alpine
  python:3.12-slim
  golang:1.23-alpine
  gcr.io/distroless/static:nonroot
  nginxinc/nginx-unprivileged:alpine
  traefik:v3.3
  postgres:16-alpine
  redis:7-alpine
)

registrar() {
  printf '[deploya-preparar] %s\n' "$*"
}

reintentar() {
  local intento
  for intento in $(seq 1 "$INTENTOS"); do
    if "$@"; then
      return 0
    fi
    registrar "falló (intento ${intento}/${INTENTOS}): $*"
    sleep $((intento * 5))
  done
  return 1
}

cargar_configuracion() {
  # shellcheck source=/dev/null
  . "$CONFIGURACION"
  : "${REPOSITORIO:?Falta REPOSITORIO en $CONFIGURACION}"
  : "${RAMA:?Falta RAMA en $CONFIGURACION}"
}

instalar_docker() {
  if command -v docker > /dev/null && docker compose version > /dev/null 2>&1; then
    registrar "Docker ya está instalado"
    return
  fi
  registrar "Instalando Docker CE y el plugin compose desde el repositorio oficial de Docker"
  install -m 0755 -d /etc/apt/keyrings
  reintentar curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  local codigo_version
  codigo_version="$(. /etc/os-release && printf '%s' "$VERSION_CODENAME")"
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' \
    "$(dpkg --print-architecture)" "$codigo_version" > /etc/apt/sources.list.d/docker.list
  reintentar apt-get update -q
  reintentar apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
}

verificar_compose() {
  local version
  version="$(docker compose version --short | sed 's/^v//')"
  # docker-compose.vps.yml usa `!reset` y `!override`: con Compose < 2.24 no parsea.
  if [ "$(printf '%s\n%s\n' "$COMPOSE_MINIMO" "$version" | sort -V | head -n1)" != "$COMPOSE_MINIMO" ]; then
    registrar "Docker Compose ${version} es menor que ${COMPOSE_MINIMO}" >&2
    exit 1
  fi
  registrar "Docker Compose ${version}"
}

preparar_usuario() {
  usermod -aG docker "$USUARIO"
  install -d -m 0755 -o "$USUARIO" -g "$USUARIO" "$CLON"
  # respaldar.sh exige 700 (scripts/lib/comun.sh).
  install -d -m 0700 -o "$USUARIO" -g "$USUARIO" "$RESPALDOS"
  local bitacora
  for bitacora in /var/log/deploya-respaldo.log /var/log/deploya-prune.log; do
    touch "$bitacora"
    chown "$USUARIO:$USUARIO" "$bitacora"
    chmod 0640 "$bitacora"
  done
}

clonar_repositorio() {
  if [ -d "$CLON/.git" ]; then
    registrar "El clon ya existe en $CLON"
    return
  fi
  registrar "Clonando $REPOSITORIO ($RAMA) en $CLON"
  reintentar sudo -u "$USUARIO" git clone --branch "$RAMA" "$REPOSITORIO" "$CLON"
}

descargar_imagenes() {
  local imagen
  for imagen in "${IMAGENES_BASE[@]}"; do
    # Una imagen que no baja no detiene la preparación: se descargará en la primera construcción.
    reintentar docker pull -q "$imagen" || registrar "No se pudo descargar $imagen; se bajará al construir"
  done
}

aplicar_ajustes() {
  sysctl --system > /dev/null
  # El drop-in de sshd lo escribió cloud-init; la recarga es inocua si ssh aún no corre.
  systemctl try-reload-or-restart ssh.service || true
}

main() {
  cargar_configuracion
  aplicar_ajustes
  instalar_docker
  verificar_compose
  preparar_usuario
  clonar_repositorio
  descargar_imagenes
  install -d -m 0755 "$(dirname "$MARCA")"
  date -u +%Y-%m-%dT%H:%M:%SZ > "$MARCA"
  registrar "Listo. Falta copiar $CLON/.env.vps (chmod 600) y correr scripts/desplegar-vps.sh como $USUARIO"
}

main "$@"
