# Design

## Context

`AltaPrimerUsuario` y `ConfiguracionInstalacion` vienen de `feat-m2-modo-autoalojado`; el código lo imprime `instalar.sh` (`feat-instalador-autoalojado`).

## Decisions

### 1. Código de un solo uso

Se guarda solo su hash y su vencimiento; al crear el administrador se borra. Evita que otro reclame la cuenta en un servidor recién expuesto.

### 2. Máquina de pasos en la web

Un paso no se marca hecho sin la respuesta de la API (regla de `Pasos`).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `PrimeraConfiguracionService` | Service Layer | S | Código, administrador y correo |
| `AltaPrimerUsuario` (de M2) | Strategy | O, D | M1 no sabe del modo |
| Asistente | State | S | Pasos con transiciones explícitas |

Cambios de clases y puertos: `PrimeraConfiguracionService` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Fuerza bruta del código:** 8 caracteres y límite de 5 intentos por IP en 15 min.
