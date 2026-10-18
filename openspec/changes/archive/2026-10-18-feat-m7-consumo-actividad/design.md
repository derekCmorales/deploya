# Design

## Context

`BloqueosService` (M5-03) ya cuenta las construcciones del mes con `contarConstruccionesDesde(usuarioId, inicioDeMes)`; `SuscripcionesService.cuotaDe` da los límites; `MapaActividad` y `Meter` ya existen en `apps/web/src/components`.

## Goals / Non-Goals

**Goals:** dos lecturas simples y dos componentes autocontenidos.

**Non-Goals:** métricas en vivo, histórico de meses.

## Decisions

### 1. Misma regla de mes que el bloqueo

`periodoDe(hoy)` devuelve `{ desde: 1.º del mes UTC, reinicia: 1.º del mes siguiente UTC }`. El bloqueo y el consumo usan la misma función, así nunca dicen cosas distintas.

### 2. Agrupar en el dominio, no en SQL

`agruparPorDia(despliegues, hoy, DIAS_ACTIVIDAD = 84)` recibe `{ creado, estado }[]` y devuelve los 84 días aunque no tengan despliegues (total 0). Se prueba con listas literales.

### 3. Componentes que se montan solos

`ConsumoPeriodo` y `ActividadProyecto` piden sus datos con `pedirApi` y muestran `Skeleton` mientras cargan. Quien los usa (Javier en 08, Derek en 13) solo los coloca.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ConsumoService`, `ActividadService` | Facade de lectura | S, D | Leen por puertos de M2, M3 y M4 |
| `agruparPorDia`, `periodoDe` | Funciones puras | S | Se prueban sin base ni reloj |
| `ConsumoPeriodo`, `ActividadProyecto` | Container / Presentational | S | Datos y dibujo separados; `Meter` y `MapaActividad` no cambian |

Cambios de clases: `ConsumoService`, `ActividadService` → `clases-unificado.mmd`.

## Risks / Trade-offs

- **Zona horaria:** todo en UTC, igual que el bloqueo; la web solo formatea.
