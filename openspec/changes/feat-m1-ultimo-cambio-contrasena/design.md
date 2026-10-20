# Design

## Context

M1-07 ya cambia la contraseña y revoca las otras sesiones; M1-05 ya restablece. Ambos tienen `Reloj` inyectado.

## Decisions

### 1. La fecha la escribe M1

Javier crea la columna (dueño de `prisma/`), pero el único escritor es M1 (regla 1 de datos-nucleo).

### 2. Nulo = nunca

No se rellena con la fecha de alta: «Nunca la has cambiado» es más honesto.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `CuentaService`, `RecuperacionService` | Service Layer | S | Un caso de uso por método |
| `RepositorioUsuarios.marcarContrasenaCambiada` | Repository | I, D | Método nuevo y estrecho |

Cambios de clases y puertos: `RepositorioUsuarios` (método nuevo) → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Migración:** columna nula, sin backfill; sin riesgo para cuentas existentes.
