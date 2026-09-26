# AGENTS.md — Deploya

Instrucciones para humanos y agentes que tocan este repo.

## Stack

- Monolito modular: **NestJS** (`apps/api`) + **Next.js** (`apps/web`)
- PostgreSQL, Redis, Docker (runtime de usuario; no en el bootstrap)
- pnpm workspaces
- OpenSpec (`openspec/`) con harness en `.cursor/commands` (`opsx-*`) y skills — **no reescribir esas skills**

## Alcance

Núcleo v4.1: [docs/alcance.md](docs/alcance.md) (manda sobre la propuesta). Pantallas de referencia: canvas **Deploya v4.1**. Lo que está en *fuera de alcance · solo si da el tiempo* **no** se implementa sin un change de OpenSpec aprobado y sin haber terminado lo **Debe** del módulo. M8 (asistente e integración) queda como stub. Fuente: solo repositorio público de GitHub con `Dockerfile` (sin zip ni detección de stack).

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
| Eduardo | `proyectos`, `observabilidad`, `apps/web` ([kit visual](docs/kit-visual.md): Geist, claro/oscuro) |
| Derek | `construccion`, `orquestacion`, `enrutamiento`, `herramientas` (stub), compose, `adapters` |

## Bootstrap

El andamiaje ya está en `main`: módulo Nest registrado + `GET /<modulo>/health` por módulo. Los PRs de andamiaje (`chore/`) no implementan dominio; desde el Avance 1 cada historia de [docs/plan-avances.md](docs/plan-avances.md) implementa el dominio real con su change de OpenSpec. Los `health` se mantienen.

La web usa el **kit visual canónico** ([docs/kit-visual.md](docs/kit-visual.md)): tokens, AppShell mínimo, Geist, toggle claro/oscuro. Rutas actuales = stubs; cada historia con UI implementa su pantalla del canvas v4.1 encima del kit. Specs con UI deben reutilizar ese documento; no paleta nueva.
