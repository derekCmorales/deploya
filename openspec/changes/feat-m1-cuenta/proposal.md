# Proposal

Change: `feat/m1-cuenta`. Módulo dueño: **identidad (M1)** — Eddy. Spec tocada: `identidad`. Historias: **M1-06** Mi cuenta · Perfil (2 pts) y **M1-07** Mi cuenta · Seguridad (2 pts), Avance 3. Pantallas 05 y 05b.

## Why

El requisito «Mi cuenta» ya está en el spec de identidad, pero no hay ruta ni pantalla: el cliente no puede corregir su nombre, cambiar su contraseña sabiendo la actual ni cerrar las sesiones que dejó abiertas. Todo lo necesario (política de contraseña, hash, `RepositorioSesiones.revocarTodas`) ya existe por M1-03 y M1-05.

## What Changes

- `GET /identidad/cuenta` → `{ nombre, correo, rol, verificado, creado }` (con sesión).
- `PATCH /identidad/cuenta` `{ nombre }`: recorta espacios, 1 a 64 caracteres (`NombreInvalido` → 400).
- `POST /identidad/cuenta/contrasena` `{ actual, nueva }`: verifica la actual (`ContrasenaActualIncorrecta` → 400), aplica la política de registro (`ContrasenaDebil`), guarda el hash y **revoca las demás sesiones**; la actual sigue viva.
- `DELETE /identidad/sesiones`: revoca **todas** las sesiones, incluida la actual, y borra la cookie (204).
- «Último cambio» de 05b se omite: no hay columna para eso y no se agrega ninguna (sin migración).
- Web: `/cuenta` (05) y `/cuenta/seguridad` (05b) con la navegación lateral Perfil / Seguridad; «Cuenta» del menú de usuario lleva a 05.

## Non-goals

- Cambiar el correo y segundo factor (fuera de alcance, punto 20).
- Lista de dispositivos o sesiones individuales.
- Avatar subido por el usuario (las iniciales salen del nombre).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Mi cuenta» gana sus escenarios de nombre, contraseña y cierre de todas las sesiones.

## Impact

- Código: `identidad/cuenta.controller.ts`, `identidad/cuenta.service.ts`, reutiliza `PoliticaContrasena`, `HashContrasena`, `RepositorioSesiones`.
- Web: `apps/web/src/app/(auth)/cuenta/` o grupo `(cuenta)`; `lib/api-identidad.ts`.
- Sin cambios de tablas ni de contratos con otros módulos.
