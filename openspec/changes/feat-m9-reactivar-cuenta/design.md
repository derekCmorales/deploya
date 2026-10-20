# Design

## Context

`SuspensionService` ya cambia `estadoCuenta`, revoca sesiones y detiene contenedores por `ContenedoresClientePuerto`; `reanudarTodosDe` ya existe para la renovación.

## Decisions

### 1. Simétrica a suspender

Mismo puerto (`CuentasSuspensionPuerto`), mismo registro de auditoría, misma pantalla.

### 2. La suscripción decide los contenedores

Reactivar la cuenta no salta el ciclo §4.4: con la suscripción Suspendida no se reanudan.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ReactivacionCuentaService` | Service Layer | S | Un caso de uso |
| `ContenedoresClientePuerto` | Puerto (ya existe) | D | M9 no habla con Docker |
| `AccionAdministrativa` | Registro de auditoría | S | Igual que suspender |

Cambios de clases y puertos: `ReactivacionCuentaService`, `CuentasSuspensionPuerto.reactivar` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- Ninguno grande: el flujo inverso ya está probado.
