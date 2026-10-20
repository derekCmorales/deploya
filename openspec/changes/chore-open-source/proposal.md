# Proposal

Change: `chore/open-source`. Módulo dueño: **transversal** — Derek. Specs tocadas: `instalacion`. Historias: **SP-09 (1.5 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: —.

## Why

Para que Deploya sea de código abierto (ADR 0008) el repositorio necesita licencia, documentación para quien llega de fuera y la certeza de que el historial no expone secretos.

## What Changes

- `LICENSE` con la licencia que elija el equipo (propuesta: AGPL-3.0).
- `README.md` para quien llega de fuera (qué es, cómo probarlo, cómo instalarlo, cómo contribuir).
- `CONTRIBUTING.md` (OpenSpec primero, ramas, Conventional Commits, `pnpm check`) y `SECURITY.md` (cómo reportar y qué protege la plataforma).
- `gitleaks` sobre todo el historial y en CI.

## Non-goals

- Hacer público el repositorio sin el acuerdo de los cuatro y la consulta al catedrático.
- Traducir la documentación.

## Capabilities

### New Capabilities

- `instalacion`: código abierto, instalador y operación de Deploya autoalojado (transversal, Derek).

### Modified Capabilities

- (ninguna)

## Impact

- Raíz: `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`.
- CI: paso de `gitleaks` en `.github/workflows` (con Eddy, dueño de workflows).
