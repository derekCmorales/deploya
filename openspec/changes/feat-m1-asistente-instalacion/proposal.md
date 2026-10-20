# Proposal

Change: `feat/m1-asistente-instalacion`. Módulo dueño: **identidad (M1)** — Eddy. Specs tocadas: `identidad`. Historias: **SP-17 (2 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 31 Autoalojado · Configura tu instalación.

## Why

En autoalojado no hay administrador por seed. Quien instala necesita crear el primero de forma segura (un servidor público lo puede abrir cualquiera) y dejar listo el correo, el registro y los límites sin editar archivos.

## What Changes

- `/configurar` (solo autoalojado y mientras no haya administrador) con `Pasos` en vertical: código de configuración → administrador → dominio y HTTPS (solo lectura) → correo → registro y límites.
- `POST /instalacion/codigo`, `POST /instalacion/administrador`, `POST /instalacion/correo/prueba`, `PATCH /instalacion/correo` (contrato `instalacion.md`).
- El paso de registro y límites usa la API de Javier (`feat-m9-ajustes-instalacion`).

## Non-goals

- Cambiar el dominio desde la web (lo hace `instalar.sh`).
- Varios administradores en el asistente.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Primera configuración».

## Impact

- API: `identidad/instalacion/` (`PrimeraConfiguracionService`, controlador). Lee `ConfiguracionInstalacion` por el puerto de Javier.
- Web: `app/(auth)/configurar/`; `components/deploya/pasos.tsx` gana variante vertical si hace falta.
