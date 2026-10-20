# Design

## Context

El repo hoy es del curso y no tiene licencia; sin licencia no es código abierto aunque sea público.

## Decisions

### 1. La licencia la decide el equipo

El ADR 0008 compara Apache-2.0 y AGPL-3.0; se cierra en este change.

### 2. Escaneo antes de abrir

El repositorio ya es público: si `gitleaks` encuentra algo, ese secreto ya está expuesto y se rota de inmediato (y se actualiza en el VPS). No se reescribe la historia de `main`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| — | — | — | Change de documentación y CI |

Cambios de clases y puertos: ninguno → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Secretos en el historial:** se rotan; reescribir historia no se hace en `main` (AGENTS.md).
