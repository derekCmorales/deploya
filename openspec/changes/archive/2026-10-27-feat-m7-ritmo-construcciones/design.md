# Design

## Context

M7-03 ya calcula el período (`periodoDe`) y cuenta construcciones; falta agrupar por día.

## Decisions

### 1. Proyección en la web

`proyectar(diarios, diasDelMes)` es una función pura; la API solo da los datos.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ConsumoService.diario` | Facade de lectura (ya existe) | S | Mismo período que el bloqueo |
| `proyectar` | Función pura | S | Se prueba sin reloj |

Cambios de clases y puertos: `ConsumoService.diario` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Inicio de mes:** con pocos días la proyección es ruidosa; no se dibuja el día 1.
