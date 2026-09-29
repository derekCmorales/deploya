# Proposal

Change: `feat/m1-registro-verificacion`. Módulo dueño: **identidad (M1)** — Eddy. Historias: M1-01 registro (3 pts) y M1-02 verificación (2 pts), Avance 1. Pantallas 01, 01b y 02. Depende de `feat/m10-correo-verificacion` (`CorreoPuerto`).

## Why

El recorrido del Avance 1 empieza con «un usuario nuevo se registra y verifica su correo». Hoy M1 es solo `health`. Sin cuenta activa no hay login (M1-03, martes), y sin login los demás módulos no tienen usuario.

## What Changes

- `POST /identidad/registro`: correo único (normalizado), contraseña con `PoliticaContrasena` (las mismas cuatro reglas que la web), confirmación, hash con `scrypt`, cuenta *pendiente*, Sandbox pedido a M2 y correo de verificación por `CorreoPuerto`.
- `POST /identidad/verificacion`: token de 24 h y un solo uso; se guarda solo su huella sha256.
- Puertos `RepositorioUsuarios`, `RepositorioTokensCuenta`, `HashContrasena`, `GeneradorToken` y `AsignacionSandboxPuerto`; adaptadores en memoria y stub de Sandbox hasta DB-01 y M2.
- Web: `/registro` (01 y sus estados de 01b) y `/verificar` (02: bandeja, válido y no válido). Se borra el stub `/auth` y «Cuenta» apunta a `/registro`.

## Non-goals

- Iniciar y cerrar sesión, `SesionGuard` y `@UsuarioActual()` (M1-03, martes).
- Reenviar el correo con cuenta atrás, estados de login y 403 (M1-04, A2).
- Recuperar contraseña (M1-05) y Mi cuenta (M1-06, M1-07).
- Adaptadores Prisma: llegan cuando DB-01 esté en `main`.
- Header público de las pantallas de acceso (Planes · tema · Iniciar sesión): el shell actual es compartido.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: registro y verificación con contrato HTTP, errores de dominio y códigos que lee la web.

## Impact

- Código: `apps/api/src/modules/identidad`, `apps/web/src/app/(auth)`, `apps/web/src/lib/{cuenta,api-identidad}.ts`.
- Datos: `Usuario` y `TokenCuenta` de [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) (DB-01, Javier).
- Contrato con M2: `asignarSandbox(usuarioId)`.
- Config: `URL_WEB` para armar el enlace del correo.
