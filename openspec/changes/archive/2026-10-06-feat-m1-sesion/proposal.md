# Proposal

Change: `feat/m1-sesion`. Módulo dueño: **identidad (M1)**, Eddy; lo termina Derek para cerrar el Avance 1. Historia: M1-03 iniciar y cerrar sesión + guard (3 pts). Pantallas 03 y 03b. Incluye el cableado de adaptadores (Derek) que el recorrido necesita en compose.

## Why

El «Terminado cuando» de M1-03 es: cuenta sin verificar no entra y `/projects` exige sesión. Sin eso la demo se corta después de verificar el correo. Además, en compose la API y el trabajador son procesos distintos: con usuarios, proyectos y despliegues en memoria, un despliegue creado por la API nunca llega al trabajador, y con `NODE_ENV=production` el usuario de desarrollo no aplica (todo respondía 401).

## What Changes

- `POST /identidad/sesion` (login), `GET /identidad/sesion` (quién soy) y `DELETE /identidad/sesion` (logout). Cookie `deploya_sesion` HttpOnly, SameSite=Lax, 7 días; `Secure` cuando la web va por HTTPS. En la base solo queda la huella sha256 del token.
- `SesionService` (separado de `IdentidadService`), puerto `RepositorioSesiones`, errores `CredencialesInvalidas` (401), `CuentaNoVerificada` y `CuentaSuspendida` (403).
- `SesionGuard` y `@UsuarioActual()` exportados por `IdentidadModule`; M3 y M4 los usan en lugar de `@UsuarioSolicitante()` y `USUARIO_DESARROLLO`, que se borran.
- Adaptadores Prisma de `Usuario`, `TokenCuenta`, `Sesion`, `Proyecto`, `Despliegue` (con etapas y bitácora) y `Artefacto`.
- `asignarSandbox` y `cuotaDe` de M2 reemplazan a los stubs en M1 (registro), M3 (límite de proyectos) y M5 (`--cpus` y `--memory`).
- Compose: servicio `migracion` (`prisma migrate deploy` + seed idempotente) del que dependen la API y el trabajador.
- Web: `/ingresar` (03 y estados de 03b), sesión compartida en el header («Salir») y el grupo `(projects)` redirige a `/ingresar?siguiente=…` sin sesión.

## Non-goals

- Reenviar la verificación y el motivo de la suspensión en 03b (M1-04, A2).
- Roles y 403 de administración (M1-04), recuperar contraseña (M1-05), Mi cuenta (M1-06, M1-07).
- Cerrar sesión en todos los dispositivos (M1-07).

## Capabilities

### Modified Capabilities

- `identidad`: inicio y cierre de sesión, guard y usuario actual.

## Impact

- Código: `apps/api/src/modules/identidad`, `apps/api/src/adapters/prisma`, módulos de M3, M4 y M5 (solo binding), `apps/web/src/app/(auth)/ingresar`, `apps/web/src/hooks/use-sesion.tsx`, `components/shell`.
- Contratos: [despliegues.md](../../../docs/contratos/despliegues.md) (el usuario sale de la sesión).
- Config: `ADMIN_CLAVE` obligatoria en `.env` para compose; se borra `USUARIO_DESARROLLO`.
