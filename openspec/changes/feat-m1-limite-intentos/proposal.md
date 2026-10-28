# Proposal

Change: `feat/m1-limite-intentos`. Módulo dueño: **identidad (M1)** — Eddy. Specs tocadas: `identidad`. Historia: **EST-01a (2 pts)** (entrega final, [plan-avances.md § Entrega final](../../../docs/plan-avances.md#entrega-final--100--entrega-y-exposición-viernes-6-de-noviembre)). Pantallas: 01 Registro, 02 Verificación, 03 Iniciar sesión, 04 Recuperar.

## Why

La plataforma sale a internet con dominio propio. Hoy solo el código de configuración (SP-17) tiene límite de intentos: iniciar sesión, registrarse, reenviar la verificación y pedir la recuperación se pueden repetir sin freno, lo que permite adivinar contraseñas y usar el SMTP del proveedor para mandar correo en masa.

## What Changes

- `LimiteIntentos` (hoy en `identidad/instalacion/`) pasa a `identidad/dominio/` con su máximo y su ventana por parámetro; el código de configuración lo sigue usando igual.
- `POST /identidad/sesion`: 5 fallos por IP y correo en 15 min → `429 DemasiadosIntentos` con `Retry-After`. Un inicio correcto limpia el conteo.
- `POST /identidad/registro`: 10 por IP por hora.
- `POST /identidad/verificacion/reenvio` y `POST /identidad/recuperacion`: 3 por correo por hora. Pasado el límite, la respuesta **es la misma** que siempre (no revela si la cuenta existe), pero no se manda correo.
- Web: 01, 03 y 04 muestran «Demasiados intentos. Vuelve a intentar en N min.» con el `Banner` del design system.

## Non-goals

- Captcha, bloqueo de cuentas o segundo factor.
- Límite repartido entre varios procesos (la API es un solo proceso, ADR 0002).
- Límites en el resto de la API.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Límite de intentos».

## Impact

- API: `identidad/dominio/limite-intentos.ts`, `sesion.controller.ts`, `identidad.controller.ts`, `recuperacion.controller.ts`, `ErroresIdentidadFilter` (429).
- Web: `(auth)` 01, 03 y 04.
- Datos: ninguno (en memoria).
