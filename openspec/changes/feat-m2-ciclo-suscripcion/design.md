# Design

## Context

`Suscripcion` ya guarda `estado`, `estadoDesde`, `vence` y `planSiguienteId` (datos-nucleo 1.2). `BloqueosService` (M5-03) ya bloquea Vencida, Suspendida y Cancelada. M5-02 dejó la cola `operacion` con los manejadores `detener` y `reiniciar`. Diagrama: [m2-estados-suscripcion.mmd](../../../docs/diagramas/m1-m10/m2-estados-suscripcion.mmd).

## Goals / Non-Goals

**Goals:** que el reloj mueva las suscripciones solas, que una Suspendida tenga los contenedores detenidos y que renovar los vuelva a arrancar.

**Non-Goals:** renovación automática, correos, borrar datos.

## Decisions

### 1. Política pura + servicio que aplica

`PoliticaCiclo.siguiente({ estado, vence, estadoDesde, plan, planSiguienteId }, ahora)` devuelve `{ estado, aplicarDescenso }` o `null` si no cambia. Constantes: `DIAS_POR_VENCER = 7`, `DIAS_GRACIA = 5`, `DIAS_HASTA_CANCELAR = 30`. Sin fechas de sistema: `Reloj` inyectado.

### 2. Un salto por corrida

Cada ejecución mueve una suscripción como mucho un estado; si el trabajador estuvo apagado tres días, la siguiente corrida la lleva a Vencida y la de mañana a Suspendida si corresponde. Es idempotente: correrla dos veces el mismo día no cambia nada la segunda vez.

### 3. Observer hacia M5

`CicloSuscripcionService` no conoce Docker ni la cola: al pasar a Suspendida llama a `ContenedoresClientePuerto.detenerTodos(usuarioId)`; al reactivar, `reanudarTodos(usuarioId)`. El adaptador vive en M2 y delega en `AccionesProyectoService` (exportado por `OrquestacionModule`). M9-02 usa el mismo puerto al suspender una cuenta.

### 4. Tarea diaria

`ColaCicloPuerto` (BullMQ con `repeat: { pattern: "5 0 * * *", tz: "UTC" }`) en el trabajador; el procesador llama a `CicloSuscripcionService.ejecutar()`. `POST /admin/ciclo/ejecutar` (`RolGuard`, `@Roles("administrador")`) lo invoca directo para la demo y devuelve `{ cambios: [{ usuarioId, de, a }] }`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `PoliticaCiclo` | State (tabla de transiciones) + función pura | S, O | Un estado nuevo es una fila, no un `if` más; se prueba con fechas literales |
| `CicloSuscripcionService` | Service Layer | S | Lee, pide a la política y guarda; no decide |
| `ContenedoresClientePuerto` → `ContenedoresClienteM5` | Adapter, Observer | D, I | M2 avisa sin conocer M5; puerto de dos métodos |
| `AccionesProyectoService.detenerTodosDe/reanudarTodosDe` (M5) | Facade + Command | S, O | Reusa los manejadores de la cola `operacion`; sin `switch` nuevo |
| `ColaCicloPuerto` | Adapter | D | La tarea diaria se prueba sin Redis |

Cambios de clases: `PoliticaCiclo`, `CicloSuscripcionService`, `ContenedoresClientePuerto`, `ColaCicloPuerto`, dos métodos en `AccionesProyectoService` → `clases-unificado.mmd` y `m2-estados-suscripcion.mmd`.

## Risks / Trade-offs

- **Reloj del servidor vs. UTC:** todas las comparaciones en UTC; la prueba fija `ahora`.
- **Detener muchos contenedores a la vez:** van por la cola, uno por trabajo; si uno falla, los demás siguen y queda en la bitácora del trabajador.
