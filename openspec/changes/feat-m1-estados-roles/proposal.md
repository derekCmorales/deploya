# Proposal

Change: `feat/m1-estados-roles`. Módulo dueño: **identidad (M1)** — Eddy. Spec tocada: `identidad`. Historia: **M1-04** estados de login, reenviar verificación, roles y 403 (2 pts), Avance 2. Pantallas 02, 03b y 28 (403 y sesión expirada).

## Why

El Avance 1 dejó el login funcionando, pero tres huecos quedan a la vista en la demo: la pantalla 02 promete «Reenviar correo» y no hace nada; 03b muestra «Cuenta suspendida» sin el motivo que pide el diseño; y cualquier usuario con sesión puede abrir `/admin`, porque no hay guard de rol. Sin `RolGuard`, Javier no puede empezar M9 (Avance 3) con seguridad.

## What Changes

- `POST /identidad/verificacion/reenvio` `{ correo }` → **202** neutro. Si la cuenta está pendiente: invalida el token de verificación anterior, crea uno nuevo de 24 h y envía la plantilla de verificación. Cuenta atrás de **60 s** por cuenta: antes de tiempo responde **429** `{ codigo: "EsperaReenvio", segundos }`.
- `CuentaSuspendida` lleva `motivo` y `desde` (de `Usuario.motivoSuspension` y `estadoDesde`); el login los devuelve en el cuerpo del error para 03b.
- `RolGuard` + decorador `@Roles("administrador")`, exportados por `IdentidadModule` junto a `SesionGuard`. `AdministracionController` los usa: un Cliente recibe **403** `{ codigo: "SoloAdministracion" }`.
- `GET /identidad/sesion` incluye `rol` (si no lo trae ya).
- Web: 02 con «Reenviar correo» y cuenta atrás; 03b «Cuenta sin verificar» con «Reenviar correo» y «Suspendida» con motivo y fecha; 28 «Esta sección es solo para administración» (403) y «Sesión expirada» (un 401 `SinSesion` en una página con sesión lleva a `/ingresar?expirada=1`).

## Non-goals

- Pantallas de administración (M9-01 y M9-02, Avance 3: las hace Javier sobre este guard).
- Roles Operador y Soporte (*Fuera de alcance*).
- Escribir el motivo de suspensión (lo escribe M9; aquí solo se lee).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `identidad`: «Verificación de correo» (reenvío con cuenta atrás), «Inicio y cierre de sesión» (motivo de suspensión, sesión expirada) y «Roles» (guard exportado, administrador sí entra).

## Impact

- Código: `identidad/verificacion.service.ts` (o método nuevo en el servicio de registro), `rol.guard.ts`, `roles.decorator.ts`, `CuentaSuspendida`; `administracion.controller.ts` con el guard.
- Web: `(auth)/verificar`, `(auth)/ingresar`, `components/shell/requiere-sesion.tsx`, página 403 y `app/(admin)`.
- Sin cambios de schema (`motivoSuspension` y `estadoDesde` ya existen). `clases-unificado.mmd`: `RolGuard`, `@Roles`.
