# Design

## Context

`EtapaDespliegue` tiene `iniciada` y `terminada`; `tiemposDe` la expone (Derek, día 4).

## Decisions

### 1. Tonos de tinta en el orden del riel

Las etapas son ordinales; se distinguen por tono, leyenda y tooltip. Solo el fallo usa `bad`.

### 2. La ruta `tiempos` se registra antes que `:numero`

`ProyectosModule` (importado antes que `ObservabilidadModule`) arrastra `ConstruccionModule`, que
mapea `/proyectos/:id/despliegues/:numero` y se tragaría `tiempos` como número. `TiemposModule` se
importa en `AppModule` antes de `ProyectosModule`; el controlador vive en un módulo propio de la
feature, no se toca el controlador de M4 ni se cambia el orden de los módulos existentes.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `TiemposService` | Facade de lectura | S, D | Lee por el puerto de M4 y devuelve `{ despliegues, resumen }` |
| `medianaSaludables`, `porcentajeConstruccion`, `fallos`, `ultimaReversion` | Funciones puras | S | Se prueban sin base |

Cambios de clases y puertos: `TiemposService` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Despliegues viejos sin tiempos:** las etapas sin `terminada` cuentan como 0 y se marcan en el tooltip.
