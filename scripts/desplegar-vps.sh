#!/usr/bin/env bash
# Publica la rama indicada (main por defecto) en el VPS. Idempotente: se puede correr las veces que haga
# falta y deja el servidor igual. Se ejecuta EN EL VPS, dentro del clon del repo, con un .env.vps completo.
#   scripts/desplegar-vps.sh            # main
#   RAMA=Entrega-85% scripts/desplegar-vps.sh
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

ARCHIVO_ENTORNO=".env.vps"
RAMA="${RAMA:-main}"
GENERADO="infra/traefik/plataforma.generada.yml"

[ -f "$ARCHIVO_ENTORNO" ] || { echo "Falta $ARCHIVO_ENTORNO (cp .env.vps.example .env.vps y rellénalo)." >&2; exit 1; }

# Carga solo para leer DOMINIO_BASE; compose vuelve a leer el archivo con --env-file.
set -a
# shellcheck disable=SC1090
. "./$ARCHIVO_ENTORNO"
set +a
: "${DOMINIO_BASE:?Define DOMINIO_BASE en $ARCHIVO_ENTORNO}"

COMPOSE=(docker compose --env-file "$ARCHIVO_ENTORNO" -f docker-compose.yml -f docker-compose.vps.yml)

echo "==> Actualizando $RAMA"
git fetch origin "$RAMA"
git checkout "$RAMA"
git pull --ff-only origin "$RAMA"

echo "==> Rutas de la plataforma para $DOMINIO_BASE"
sed "s/__DOMINIO_BASE__/${DOMINIO_BASE}/g" infra/traefik/plataforma.vps.yml > "$GENERADO"

echo "==> Construyendo y levantando"
"${COMPOSE[@]}" up -d --build

echo "==> Migraciones y seed (idempotentes)"
"${COMPOSE[@]}" run --rm migracion

echo "==> Esperando a la API"
for intento in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T api node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    echo "API en línea: https://api.${DOMINIO_BASE}/health"
    echo "Web: https://${DOMINIO_BASE}"
    exit 0
  fi
  sleep 3
done

echo "La API no respondió a tiempo. Revisa: ${COMPOSE[*]} logs api traefik" >&2
exit 1
