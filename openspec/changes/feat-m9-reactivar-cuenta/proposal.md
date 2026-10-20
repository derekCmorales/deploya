# Proposal

Change: `feat/m9-reactivar-cuenta`. Módulo dueño: **administracion (M9)** — Javier. Specs tocadas: `administracion`. Historias: **SP-05 (2 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 25c Admin · Reactivar cuenta.

## Why

Hoy suspender una cuenta no tiene vuelta atrás desde la interfaz: en la demo se reactiva por SQL. Es el punto 1 de fuera de alcance y la mitad del flujo ya existe (`reanudarTodosDe`).

## What Changes

- `POST /admin/usuarios/:id/reactivacion { detalle }`: Suspendida → Activa, borra `motivoSuspension`, deja `AccionAdministrativa` `reactivar-cuenta`.
- Si la suscripción está vigente, `ContenedoresClientePuerto.reanudarTodosDe`; si está Suspendida, los contenedores esperan a la renovación.
- Pantalla 25c: «Reactivar cuenta» en el detalle y el diálogo.

## Non-goals

- Reactivar en lote.
- Cambiar el estado de la suscripción al reactivar la cuenta.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `administracion`: «Reactivar cuenta».

## Impact

- API: `administracion/reactivacion-cuenta.service.ts`, `usuarios-admin.controller.ts`, `CuentasSuspensionPuerto.reactivar`.
- Web: `(admin)/admin/usuarios` (botón y diálogo).
- Datos: valor nuevo de `AccionAdministrativa.accion`.
