# Proposal

Change: `feat/m1-ultimo-cambio-contrasena`. Módulo dueño: **identidad (M1)** — Eddy (pantalla); Javier (columna). Specs tocadas: `identidad`. Historias: **SP-03 (1 pt)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 05b Mi cuenta · Seguridad.

## Why

La pantalla 05b ya dibuja «Último cambio: 22 sep 2026», pero no hay dónde guardar esa fecha.

## What Changes

- Migración: `Usuario.contrasenaCambiadaEn DateTime?` (Javier, día 1; `docs/contratos/datos-nucleo.md` v2).
- `CuentaService.cambiarContrasena` y el restablecimiento (M1-05) la escriben con el `Reloj`.
- `GET /identidad/cuenta` suma `contrasenaCambiadaEn`; 05b muestra la fecha o «Nunca la has cambiado».

## Non-goals

- Historial de contraseñas o forzar el cambio cada N días.
- Bitácora de auditoría de cuenta (punto 16).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Último cambio de contraseña».

## Impact

- Prisma: `Usuario.contrasenaCambiadaEn` (migración de Javier).
- API: `identidad/cuenta.service.ts`, `identidad/recuperacion.service.ts`, `GET /identidad/cuenta`.
- Web: `/cuenta/seguridad`.
