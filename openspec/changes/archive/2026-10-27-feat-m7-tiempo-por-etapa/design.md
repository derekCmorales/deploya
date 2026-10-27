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

### 3. La mediana se calcula una sola vez, en la API

`resumen.medianaMs` es la única fuente: la tarjeta la pasa a `GraficaEtapas` (`medianaMs`) para la línea
punteada y el resumen accesible. La web no repite la regla «Saludables sin reversión».

### 4. Accesibilidad igual que `GraficaUso`

`role="group"` con `aria-roledescription="gráfica"`, flechas, Inicio y Fin (`esTeclaDeNavegacion`, compartida
en `graficas/series.ts`), el tooltip se va al salir de la gráfica y «activa» va en tinta: Señal queda solo
para el punto en vivo (regla 3 de [Gráficas](../../../docs/diseno/README.md#gráficas)).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `TiemposService` | Facade de lectura | S, D | Lee por el puerto de M4 y devuelve `{ despliegues, resumen }` |
| `medianaSaludables`, `porcentajeConstruccion`, `fallos`, `ultimaReversion` | Funciones puras | S | Se prueban sin base |
| `tramosVisibles`, `indicadoresTiempos`, `subtituloTiempos` (`lib/tiempos.ts`) | Funciones puras | S | La gráfica y la tarjeta solo pintan; se prueban con `node --test` |

Cambios de clases y puertos: `TiemposService` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Orden de rutas:** depende del orden de `imports` en `AppModule`; `app.module.spec.ts` lo fija
  levantando la app y comprobando que `/despliegues/tiempos` queda antes que `/despliegues/:numero`.
- **Despliegues viejos sin tiempos:** las etapas sin `terminada` cuentan como 0 y se marcan en el tooltip.
