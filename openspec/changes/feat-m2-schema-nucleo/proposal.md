# Proposal

Change: `feat/m2-schema-nucleo`. Módulo dueño: **suscripciones (M2)** — Javier. Spec tocada: `suscripciones`. Historias: DB-01 (3 pts) y M2-01 (2 pts), Avance 1. Contrato: [docs/contratos/datos-nucleo.md](../../../docs/contratos/datos-nucleo.md) v1.

## Why

El schema de arranque solo tenía `Usuario`, `Plan`, `Proyecto` y `Despliegue` con estados en texto. Eddy (M1), Eduardo (M3) y Derek (M4/M5) necesitan las tablas firmadas del núcleo para dejar los repositorios en memoria, y todos necesitan saber cuánto puede usar cada cuenta. Sin la suscripción Sandbox al registrarse, un usuario nuevo no puede crear su primer proyecto; sin el catálogo, la pantalla 06 no existe.

## What Changes

- **DB-01 · schema:** `apps/api/prisma/schema.prisma` exactamente como el contrato v1 (identidad, suscripciones, administración, proyectos y motor), con enums en minúscula, dinero en `Decimal(10,2)` e ids `uuid`. Migración `nucleo`.
- **DB-01 · `PrismaModule` global:** `PrismaService` en `compartido/prisma`, único `PrismaClient` de la API.
- **DB-01 · seed idempotente:** los cuatro planes v4.1 (precio de 365 días = 10 × el de 30), el administrador (`ADMIN_CORREO`, `ADMIN_CLAVE` obligatoria) y `cliente@deploya.app`, ambos con Sandbox. Contraseñas con scrypt en el formato `scrypt:<sal>:<hash>` de `HashContrasenaScrypt` (M1), para que el login acepte esas cuentas.
- **DB-01 · `SuscripcionesService`** exportado: `asignarSandbox(usuarioId)` idempotente y `cuotaDe(usuarioId)` con el error de dominio `SuscripcionNoEncontrada`.
- **M2-01 · catálogo:** `GET /suscripciones/planes` sin sesión y pantalla 06 en `/planes` (grupo `(billing)`), leída de la base.

## Non-goals

- Contratación, renovación y cambio de plan con `PasarelaPago` (M2-02, M2-04; A2): en `/planes` «Contratar» queda deshabilitado.
- «Plan actual» con sesión: la tabla ya lo soporta, se activa cuando M1 publique `@UsuarioActual()`.
- Ciclo §4.4 y bloqueos por cuota (M2-05, M5-03).
- Tablas fuera del núcleo (espacios de trabajo, complementos, dominios, métricas, notificaciones, `LimitePlan`).
- `prisma migrate deploy` al arrancar compose (lo hace Derek en ENG-01).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `suscripciones`: «Catálogo» (planes activos ordenados, importes y CPU como número) y «Sandbox inicial» (idempotente, sin vencimiento) con escenarios nuevos.

## Impact

- Código: `apps/api/prisma/**`, `apps/api/src/compartido/prisma/**`, `apps/api/src/modules/suscripciones/**`, `apps/api/src/app.module.ts`, `apps/web/src/app/(billing)/planes/**`, `apps/web/src/lib/planes.ts`, `apps/web/src/hooks/use-planes.ts`, `apps/web/src/components/shell/nav-panel.tsx`.
- Dependencias: ninguna nueva (`node:crypto`).
- Consumidores: M1 llama a `asignarSandbox` al registrar; M3 y M4/M5 cambian sus stubs de cuota por adaptadores sobre `cuotaDe`; los repositorios en memoria pasan a Prisma.
- Diagramas: `clases-unificado.mmd` (repositorios de M2).
