# Design

## Context

El repo hoy es del curso y no tiene licencia; sin licencia no es código abierto aunque sea público.

## Decisions

### 1. Licencia AGPL-3.0

El ADR 0008 compara Apache-2.0 y AGPL-3.0. Este change elige **AGPL-3.0** (`LICENSE`). El ADR sigue en estado Propuesto hasta el merge de `feat-m2-modo-autoalojado`; aquí no se marca Aceptado.

### 2. Escaneo antes de abrir

El repositorio ya es público: si `gitleaks` encuentra algo, ese secreto ya está expuesto y se rota de inmediato (y se actualiza en el VPS). No se reescribe la historia de `main`.

### 3. Gitleaks en CI y en la prueba

CI corre el job `secretos`: checkout completo y binario oficial 8.30.1 con checksum verificado, sin acciones de terceros (`gitleaks/gitleaks-action` pide licencia a organizaciones). Lo agrega Derek, acordado con Eddy. La prueba «Historial sin secretos» hace lo mismo en local: usa `gitleaks` del PATH si es 8.30.1 o superior y, si no, baja el binario de su plataforma (linux o darwin, x64 o arm64) con el SHA-256 del `checksums.txt` oficial.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| — | — | — | Change de documentación y CI |

Cambios de clases y puertos: ninguno → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Secretos en el historial:** se rotan; reescribir historia no se hace en `main` (AGENTS.md).
