# AGENTS.md — Deploya

Instrucciones para humanos y agentes que tocan este repo.

## Stack

- Monolito modular: **NestJS** (`apps/api`) + **Next.js** (`apps/web`)
- PostgreSQL, Redis, Docker (runtime de usuario; no en el bootstrap)
- pnpm workspaces
- OpenSpec (`openspec/`) con harness en `.cursor/commands` (`opsx-*`) y skills — **no reescribir esas skills**

## Arquitectura mínima

- Ciclo: Recepción → Construcción → Ejecución → Enrutamiento → Operación
- La API **no** llama a Docker ni al enrutador de borde. Usa puertos:
  - `ContenedorPuerto`
  - `EnrutamientoPuerto`
  - `VerificacionEntornoPuerto`
- **Sin prefijo `I`** en puertos ni interfaces de dominio (`PasarelaPago`, `ProveedorFuente`, `CorreoPuerto`).
- Estados de **despliegue** ≠ estados de **suscripción** (§4.4). No mezclarlos.

## OpenSpec primero

Antes de codear una historia: `/opsx-propose` en el chat del repo, change `feat/m<n>-<slug>` bajo el spec del módulo. Luego `/opsx-apply`. Al merge: `/opsx-archive`.

Specs: `openspec/specs/<modulo>/spec.md`.

## Git — nunca a `main`

- Ramas: `feat/m<n>-<slug>`, `fix/`, `docs/`, `chore/`
- Commits: Conventional Commits `feat(m1):`, `fix(m4):`, `docs:`, `chore:`
- Integración solo por PR. CODEOWNERS asigna revisores.
- No force-push a `main`. No commits en `main`.

## Dueños (globs en `.cursor/rules/rol-*.mdc`)

| Dueño | Código |
|---|---|
| Eddy | `identidad`, `notificaciones`, `apps/web` `(auth)`, `.github/workflows` |
| Javier | `suscripciones`, `administracion`, `(billing)`, `(admin)`, `prisma` |
| Eduardo | `proyectos`, `observabilidad`, `apps/web` (UI neutra; **no hay kit visual canónico**) |
| Derek | `construccion`, `orquestacion`, `enrutamiento`, `herramientas`, compose, `adapters` |

## Bootstrap

Stubs: módulo Nest registrado + `GET /<modulo>/health`. **No** implementar auth, pagos ni motor reales en PRs de andamiaje.

La web es placeholder **neutro** (fuentes del sistema). Sistema de diseño / mockups en curso: no fijar paleta ni fingir UI final.
