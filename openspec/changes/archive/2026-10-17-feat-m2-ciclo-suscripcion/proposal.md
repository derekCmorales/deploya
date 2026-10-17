# Proposal

Change: `feat/m2-ciclo-suscripcion`. Módulo dueño: **suscripciones (M2)** — Javier; la parte de contenedores es de **orquestacion (M5)** — Derek. Specs tocadas: `suscripciones`, `orquestacion`. Historia: **M2-05** Ciclo §4.4 y bloqueos (5 pts, Avance 3). Pantallas 10c y 28 (suspendida).

## Why

Hoy una suscripción solo cambia de estado al contratar o renovar. Nadie la mueve a Por vencer, Vencida, Suspendida ni Cancelada, el descenso programado (M2-04) nunca se aplica y los contenedores de un cliente que dejó de pagar siguen corriendo. Es el punto 6 del recorrido que se evalúa.

## What Changes

- `PoliticaCiclo.siguiente(suscripcion, ahora)` pura: Activa → Por vencer (≤ 7 días) → Vencida (pasó `vence`) → Suspendida (5 días en Vencida) → Cancelada (30 días en Suspendida). Sandbox no vence.
- Al llegar a `vence` con `planSiguienteId` (descenso programado), se aplica el plan nuevo **sin cobro** si el cliente ya pagó la renovación; si no, sigue el ciclo normal (tarea 5.3 de M2-04).
- `CicloSuscripcionService.ejecutar()` recorre las suscripciones que pueden cambiar, guarda `estado` y `estadoDesde` y publica `SuscripcionSuspendida` y `SuscripcionReactivada`.
- Tarea diaria: trabajo repetible de BullMQ `ciclo-suscripciones` a las 00:05 UTC en el trabajador; `POST /admin/ciclo/ejecutar` (solo administración) lo corre a demanda para la demo.
- M5 (Derek): `AccionesProyectoService.detenerTodosDe(usuarioId)` y `reanudarTodosDe(usuarioId)` encolan `detener` o `reiniciar` por cada proyecto con despliegue activo. M2 los ve a través de su puerto `ContenedoresClientePuerto`.
- Renovar una Suspendida la deja Activa y pide `reanudarTodosDe` (la pantalla 28 lo promete: «volvemos a arrancar el último despliegue saludable»).
- Web: banner de 10c ya existe (WEB-02, Eduardo); pantalla de «Suscripción suspendida · panel bloqueado» de 28 cuando `estado = suspendida` (Javier).

## Non-goals

- Renovación automática y correos de vencimiento (fuera de alcance, puntos 4 y 5).
- Prorrateo; cancelación por el cliente.
- Borrar datos al pasar a Cancelada (se conservan; solo cambia el estado).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `suscripciones`: «Ciclo de vida §4.4» con todas sus transiciones, el descenso programado y la reactivación.
- `orquestacion`: «Suspensión» con detener y reanudar todos los contenedores de un cliente.

## Impact

- Código M2: `suscripciones/ciclo/`, `PoliticaCiclo`, `CicloSuscripcionService`, `ContenedoresClientePuerto`, trabajo `ciclo-suscripciones` en `trabajador.module.ts`.
- Código M5: `AccionesProyectoService.detenerTodosDe` y `reanudarTodosDe`; adaptador `ContenedoresClienteM5` en M2 sobre ese servicio.
- Contrato: `docs/contratos/despliegues.md` v3 (servicio interno M5 → M2 y M9).
- Sin cambios de tablas: `Suscripcion.estadoDesde` y `planSiguienteId` ya existen.
