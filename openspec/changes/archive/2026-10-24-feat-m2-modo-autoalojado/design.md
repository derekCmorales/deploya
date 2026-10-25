# Design

## Context

`CuotaPlanPuerto` (M5) y `CuotaProyectosPuerto` (M3) ya leen los límites por puerto; `SuscripcionesService.cuotaDe` es el único punto de lectura.

## Decisions

### 1. Strategy por puerto, registrada en el módulo

Cada `*.module.ts` elige la implementación según el modo con un `useFactory`. Ningún servicio pregunta por el modo.

### 2. Un solo plan «Autoalojado»

Así `Suscripcion` sigue existiendo y M3/M5 no cambian; solo cambia de dónde salen los límites.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `CatalogoPlanes`, `PoliticaCuotas`, `AltaPrimerUsuario` | Strategy | O, D | Cambiar de modo es cambiar implementaciones |
| `LimitesDeInstalacion` | Adapter | L | Cumple el mismo contrato que `CuotasDelPlan` |
| `ConfiguracionInstalacion` | Repository | S | Una sola fila, un solo escritor |

Cambios de clases y puertos: `CatalogoPlanes`, `PoliticaCuotas`, `AltaPrimerUsuario` y sus implementaciones; `RepositorioConfiguracionInstalacion` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Regresiones en la nube:** las pruebas existentes de M2, M3 y M5 corren con `nube` sin cambios; las nuevas cubren `autoalojado`.
