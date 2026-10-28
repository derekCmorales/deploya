# Proposal

Change: `feat/m1-asistente-instalacion`. Módulo dueño: **identidad (M1)** — Eddy; adaptador de correo en **notificaciones (M10)** — Eddy. Specs tocadas: `identidad`, `notificaciones`. Historias: **SP-17 (2 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 31 Autoalojado · Configura tu instalación.

## Why

En autoalojado no hay administrador por seed. Quien instala necesita crear el primero de forma segura (un servidor público lo puede abrir cualquiera) y dejar listo el correo, el registro y los límites sin editar archivos.

## What Changes

- `/configurar` (solo autoalojado) con `Pasos` en vertical: código de configuración → administrador → dominio y HTTPS (solo lectura) → correo → registro y límites. Sin administrador muestra el paso 1; con administrador y sesión de administrador sigue en los pasos 3 a 5; con administrador y sin sesión, 404.
- `POST /instalacion/codigo` y `POST /instalacion/administrador` (abiertos solo mientras no hay administrador). Crear el administrador consume el código y **deja la sesión iniciada** (misma cookie que el login).
- `POST /instalacion/correo/prueba` y `PATCH /instalacion/correo` con sesión de administrador. El SMTP se guarda en `ConfiguracionInstalacion` (columnas de Javier, `datos-nucleo.md` v2.3) con la contraseña cifrada; no se escribe el `.env`.
- M10: un adaptador de `CorreoPuerto` que lee el correo de la instalación en cada envío (SMTP guardado, «sin correo» o las `SMTP_*` del `.env`), dentro de `CorreoConRegistro`.
- La raíz redirige a `/configurar` mientras `GET /instalacion/modo` diga `configurada: false`.
- El paso 5 usa la API de Javier tal cual (`PATCH /admin/instalacion/registro` y `/limites`).

Contrato: [instalacion.md](../../../docs/contratos/instalacion.md) v1.8.

## Non-goals

- Cambiar el dominio desde la web (lo hace `instalar.sh`).
- Varios administradores en el asistente.
- Escribir el `.env` desde la API.
- Editar el SMTP desde Admin · Instalación (32): la base queda lista, la pantalla no cambia en este change.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Primera configuración».
- `notificaciones`: «Correo de la instalación».

## Impact

- API: `identidad/instalacion/` (`PrimeraConfiguracionService`, `InstalacionController`); usa `AltaPrimerUsuario` y `RepositorioConfiguracionInstalacion` (`SuscripcionesModule`), `SesionService` (M1) y `CifradorVariables` (`VariablesModule`).
- M10: `CorreoSegunInstalacion` (o el nombre que elija Eddy) en `notificaciones/adaptadores/`; `NotificacionesModule` lo pone dentro de `CorreoConRegistro`.
- Web: `app/(auth)/configurar/`; `components/deploya/pasos.tsx` gana variante vertical si hace falta.
- Sin migraciones: las columnas ya existen (`20261025120000_correo_instalacion`).
