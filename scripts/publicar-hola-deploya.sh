#!/usr/bin/env bash
# Publica ejemplos/hola-deploya como repositorio público con las ramas main, roto y sin-dockerfile.
# Uso: scripts/publicar-hola-deploya.sh [dueño/repositorio]   (por defecto derekCmorales/hola-deploya)
# Requiere git y gh autenticado (gh auth login).
set -euo pipefail

DESTINO="${1:-derekCmorales/hola-deploya}"
ORIGEN="$(cd "$(dirname "$0")/.." && pwd)/ejemplos/hola-deploya"
TRABAJO="$(mktemp -d)"
trap 'rm -rf "$TRABAJO"' EXIT

cp "$ORIGEN/server.js" "$ORIGEN/package.json" "$ORIGEN/Dockerfile" "$ORIGEN/README.md" "$TRABAJO/"
cd "$TRABAJO"
git init -q -b main
git add .
git commit -qm "feat: app mínima con Dockerfile"

git checkout -qb roto
cp "$ORIGEN/variantes/roto/Dockerfile" "$ORIGEN/variantes/roto/package.json" .
git commit -qam "test: build que falla con código 127 (tsc no instalado)"

git checkout -q main
git checkout -qb sin-dockerfile
git rm -q Dockerfile
git commit -qm "test: sin Dockerfile para la detección de stack"

git checkout -q main
gh repo create "$DESTINO" --public --description "App de ejemplo para la demo de Deploya" --source . --remote origin
git push -q -u origin main roto sin-dockerfile
echo "Publicado: https://github.com/$DESTINO (ramas main, roto, sin-dockerfile)"
