# Proposal

Change: `feat/m9-limpieza-diaria`. Módulo dueño: **administracion (M9)** — Javier. Specs tocadas: `administracion`. Historia: **EST-01b (2 pts)** (entrega final, [plan-avances.md § Entrega final](../../../docs/plan-avances.md#entrega-final--100--entrega-y-exposición-viernes-6-de-noviembre)). Pantallas: ninguna (32 solo muestra la fecha de la última limpieza).

## Why

Con la plataforma abierta en el VPS, `TokenCuenta`, `Sesion` e `Invitacion` crecen sin límite: nadie borra los tokens usados o vencidos, las sesiones revocadas o expiradas ni las invitaciones viejas. Son filas con huellas de credenciales que no sirven para nada y que entran en cada respaldo.

## What Changes

- Tarea diaria nueva en BullMQ, como la del ciclo §4.4 (`upsertJobScheduler`, 00:35 UTC, no se duplica al reiniciar).
- `PurgaDatosVencidosPuerto` con un adaptador Prisma que borra:
  - `TokenCuenta` usados o vencidos hace más de 7 días;
  - `Sesion` revocadas hace más de 7 días o sin actividad hace más de 14 días (7 de expiración + 7 de gracia);
  - `Invitacion` usadas, revocadas o vencidas hace más de 30 días.
- `POST /admin/limpieza/ejecutar` (solo Administrador) para correrla a mano en la demo, igual que el ciclo.
- Se guarda cuántas filas borró y cuándo en `ConfiguracionInstalacion`; 32 lo muestra en una línea.

## Non-goals

- Borrar cuentas, pagos, despliegues, bitácoras de construcción o acciones administrativas.
- Configurar los plazos desde la interfaz.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `administracion`: «Limpieza diaria».

## Impact

- API: `administracion/limpieza/` (servicio, tarea, controlador), `adapters/prisma/purga-datos-vencidos.prisma.ts`.
- Datos: migración con `ultimaLimpieza` y `filasLimpiadas` en `ConfiguracionInstalacion` (datos-nucleo.md, avisar a Eddy por `Sesion` y `TokenCuenta`).
- Web: una línea en 32.
