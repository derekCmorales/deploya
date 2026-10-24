# Proposal

Change: `feat/m9-ajustes-instalacion`. Módulo dueño: **administracion (M9)** — Javier (scripts: Derek, SP-19). Specs tocadas: `administracion`. Historias: **SP-18 (3 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 32 Admin · Instalación.

## Why

Quien autoaloja necesita ver si la instalación está sana y controlar quién entra, cuánto usa cada proyecto y si hay respaldos, sin entrar al servidor.

## What Changes

- `/admin/instalacion` (solo autoalojado): Estado, Versión, Registro, Límites por proyecto y Respaldos.
- `SaludInstalacion` (Composite): Docker, DNS comodín, certificado (`CertificadoPuerto`), disco y último envío de correo.
- Registro abierto · con invitación · cerrado; `Invitacion` de un solo uso que vence en 7 días; M1 respeta la política al registrar (`PoliticaRegistroPuerto`).
- Límites por proyecto con la estimación de cuántos caben en el servidor.
- Lee el estado que dejan `respaldar.sh` y `actualizar.sh`.

## Non-goals

- Actualizar desde la web (se hace con el script).
- Respaldos remotos (S3, etc.).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `administracion`: «Ajustes de la instalación».

## Impact

- API: `administracion/instalacion/` (`InstalacionService`, `SaludInstalacion` y una clase por comprobación), `InvitacionesService`; M1 consume `PoliticaRegistroPuerto`.
- Prisma: `Invitacion`.
- Web: `(admin)/admin/instalacion`.
- Contrato: `docs/contratos/instalacion.md`.
