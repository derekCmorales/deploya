# Proposal

Change: `feat/instalador-autoalojado`. Módulo dueño: **instalacion (transversal)** — Derek. Specs tocadas: `instalacion`. Historias: **SP-16 (2.5 pts), SP-19 (1.5 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 30 Deploya autoalojado · instalación; 32 (versión y respaldos).

## Why

Autoalojar tiene que ser un comando que explique lo que hace. Hoy `scripts/desplegar-vps.sh` sirve para nuestro VPS, no para alguien que llega de fuera.

## What Changes

- `scripts/instalar.sh [--continuar] [--sin-comodin] [--codigo-nuevo]` con cinco etapas: Requisitos → Dominio → Certificado → Servicios → Administrador. Comprueba antes de escribir; si falla, explica qué hacer; `--continuar` retoma; genera secretos y `.env` con permisos 600; imprime el código de configuración.
- `scripts/respaldar.sh [--restaurar <fecha>]` y `scripts/actualizar.sh [--volver]`, que dejan su estado en JSON para la pantalla 32.
- `shellcheck` y pruebas de shell en CI.

## Non-goals

- Multi-nodo, Kubernetes o actualizaciones automáticas.
- Respaldos remotos.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `instalacion`: «Instalador por etapas», «Actualizar y respaldar».
- `suscripciones`: «Seed de autoalojado sin administrador».

## Impact

- `scripts/instalar.sh`, `scripts/respaldar.sh`, `scripts/actualizar.sh`, `scripts/lib/*.sh`; reutiliza `desplegar-vps.sh`.
- CI: `shellcheck` y pruebas con `bats` (con Eddy).
- Contrato: `docs/contratos/instalacion.md`.
