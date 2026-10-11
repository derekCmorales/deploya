# Proposal

Change: `feat/m1-recuperacion`. Módulos dueños: **identidad (M1)** y **notificaciones (M10)** — Eddy. Specs tocadas: `identidad`, `notificaciones`. Historias: **M1-05** recuperar contraseña (3 pts) y **M10-02** correo de recuperación (1 pt), Avance 2. Pantallas 04 y 24. Diagrama: [m1-actividad-recuperacion-contrasena.mmd](../../../docs/diagramas/m1-m10/m1-actividad-recuperacion-contrasena.mmd).

## Why

Hoy un cliente que olvida su contraseña pierde la cuenta: 03 ya muestra «Olvidé mi contraseña», pero no lleva a ningún lado. `TokenCuenta` ya admite el tipo `recuperacion` (DB-01) y `CorreoPuerto` ya envía plantillas (M10-01); falta el flujo.

## What Changes

- `POST /identidad/recuperacion` `{ correo }` → **202** siempre, con la misma respuesta exista o no la cuenta (respuesta neutra). Si la cuenta está Activa: invalida los tokens de recuperación anteriores sin usar, crea uno de 30 minutos (solo su huella sha256 en la base) y envía la plantilla de recuperación.
- `POST /identidad/recuperacion/restablecer` `{ token, contrasena, confirmacion }` → **204**. Valida con `PoliticaContrasena`, cambia el hash, marca el token usado y **revoca todas las sesiones** del usuario.
- Errores con nombre: `TokenNoValido` (vencido, usado o desconocido → 410), `ContrasenaDebil`, `ContrasenasNoCoinciden` (400). Mismo `ErroresIdentidadFilter`.
- M10: `PlantillaRecuperacion` (asunto, botón y enlace en texto plano a `${WEB_URL}/restablecer?token=…`, aviso de 30 minutos y un solo uso).
- Web `(auth)`: `/recuperar` (paso 1 y confirmación neutra) y `/restablecer?token=` (paso 2 con `RequisitosContrasena` y estado «Este enlace ya no sirve»), según la ficha 04. El enlace de 03 apunta a `/recuperar`.

## Non-goals

- Limitar solicitudes por IP (solo se invalida el token anterior).
- Recuperar una cuenta pendiente o suspendida (la respuesta es neutra y no se envía nada).
- Cambiar la contraseña con sesión iniciada (es M1-07, Avance 3).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Recuperación de contraseña» con escenarios completos.
- `notificaciones`: «Plantillas» precisa el contenido del correo de recuperación.

## Impact

- Código: `identidad/recuperacion.service.ts`, controlador, `RepositorioTokensCuenta.invalidarVigentes`, `RepositorioUsuarios.cambiarHash`, `RepositorioSesiones.revocarTodasDe`; `notificaciones/dominio/plantilla-recuperacion.ts`.
- Web: `apps/web/src/app/(auth)/recuperar` y `(auth)/restablecer`; `lib/api-identidad.ts`.
- Sin cambios de schema. `clases-unificado.mmd`: métodos nuevos de los tres repositorios y `RecuperacionService`.
