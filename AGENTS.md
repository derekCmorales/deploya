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

## Calidad — SOLID, clean code, patrones y pruebas (base del curso)

Estándar completo y referencias: [docs/ingenieria.md](docs/ingenieria.md). Auditoría: [docs/AUDITORIA_SOLID_CLEAN.md](docs/AUDITORIA_SOLID_CLEAN.md). Aplica a **cada historia**, la escriba una persona o un agente:

- **SOLID:** controlador adapta, servicio orquesta, política decide, adaptador habla con el exterior (S). Se extiende con una nueva implementación de un puerto, no con `if/switch` por tipo (O). Stubs, dobles y adaptadores reales cumplen el mismo contrato (L). Puertos estrechos (I). Servicios reciben puertos por constructor; nunca `new` de Docker, Prisma, SMTP ni `Date.now()` en el dominio (D).
- **Puertos como `abstract class`** (token de Nest), sin prefijo `I`. Un módulo solo usa lo que otro exporta en su `*.module.ts`.
- **Clean code:** nombres del dominio en español, funciones cortas, sin números mágicos, errores de dominio con nombre, sin `any`, sin código comentado.
- **Patrones nombrados** en el `design.md` del change (Repository, Adapter, Strategy, State, Facade, Observer…) con su porqué.
- **Pruebas unitarias obligatorias:** cada `Scenario` del spec delta tiene su `it(...)`; sin Docker, red, base ni reloj reales; AAA; ≥ 80 % de líneas en dominio y servicios tocados (`pnpm --filter @deploya/api test:cov`). `pnpm test` en verde antes de cerrar una tarea.
- Si cambias un puerto, clase o estado, actualiza `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR.

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
| Eduardo | `proyectos`, `observabilidad`, `apps/web` ([design system v4.1](docs/diseno/README.md)) |
| Derek | `construccion`, `orquestacion`, `enrutamiento`, `herramientas` (stub), compose, `adapters` |

## Bootstrap

El andamiaje ya está en `main`: módulo Nest registrado + `GET /<modulo>/health` por módulo. Los PRs de andamiaje (`chore/`) no implementan dominio; desde el Avance 1 cada historia de [docs/plan-avances.md](docs/plan-avances.md) implementa el dominio real con su change de OpenSpec. Los `health` se mantienen.

## Diseño — fuente madre

Toda la UI sale de **`docs/diseno/`** (design system v4.1): principios y componentes en `docs/diseno/README.md`, cómo armar una pantalla y el prompt para agentes en `docs/diseno/guia-construccion.md`, y una ficha por pantalla en `docs/diseno/pantallas/`. Código: tokens en `apps/web/src/app/globals.css`, componentes en `apps/web/src/components` (catálogo en `/sistema`). Un agente que construya una pantalla **debe** leer esos tres documentos antes de escribir código. Nada de hex, paletas por módulo, otro shell ni otro set de iconos. El canvas de Claude Design es solo para mirar.
