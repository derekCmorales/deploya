# AGENTS.md — Deploya

Instrucciones para humanos y agentes que tocan este repo. Si algo aquí choca con otro documento, manda este archivo; después [docs/ingenieria.md](docs/ingenieria.md) para el código y [docs/alcance.md](docs/alcance.md) para el producto.

## Antes de tocar código (orden de lectura)

1. [docs/alcance.md](docs/alcance.md) — qué entra en el núcleo v4.1 y qué queda *fuera de alcance · solo si da el tiempo*.
2. [docs/plan-avances.md](docs/plan-avances.md) — la historia, su dueño y su definición de terminado.
3. `openspec/specs/<modulo>/spec.md` — requisitos y escenarios del módulo.
4. [docs/ingenieria.md](docs/ingenieria.md) — SOLID, clean code, patrones y pruebas unitarias obligatorias.
5. Si hay UI: [docs/diseno/README.md](docs/diseno/README.md), [docs/diseno/guia-construccion.md](docs/diseno/guia-construccion.md) y la ficha de la pantalla en `docs/diseno/pantallas/`.
6. Si hay contrato entre módulos: [docs/contratos/](docs/contratos/).

## Stack

- Monolito modular: **NestJS** (`apps/api`) + **Next.js** (`apps/web`), pnpm workspaces.
- PostgreSQL (Prisma), Redis (BullMQ), Docker; todo con `docker compose up`.
- OpenSpec (`openspec/`). Sus comandos `opsx-*` y skills están generados para cada herramienta en `.agents/`, `.claude/`, `.cursor/`, `.github/` (prompts y skills) y `.opencode/`: **no se editan a mano**.

## Alcance

Núcleo v4.1 ([docs/alcance.md](docs/alcance.md), manda sobre la propuesta). Pantallas de referencia: canvas **Deploya v4.1**. Lo de *fuera de alcance · solo si da el tiempo* **no se borra ni se implementa** sin un change de OpenSpec propio y sin haber terminado lo **Debe** del módulo. M8 (asistente e integración) queda como stub. Fuente: solo repositorio público de GitHub con `Dockerfile`.

## Arquitectura

- Ciclo: Recepción → Construcción → Ejecución → Enrutamiento → Operación.
- Cada módulo en capas (hexagonal): entrada (controlador, trabajador) → servicio → dominio puro; el servicio depende de **puertos**, los adaptadores los implementan ([ingenieria.md §1](docs/ingenieria.md#1-arquitectura-monolito-modular-con-puertos-y-adaptadores)).
- La API **no** llama a Docker ni al enrutador de borde: `ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto`.
- Puertos como `abstract class` (token de Nest), **sin prefijo `I`**: `PasarelaPago`, `ProveedorFuente`, `CorreoPuerto`.
- Un módulo solo usa lo que otro exporta en su `*.module.ts`. Contratos entre módulos en [docs/contratos/](docs/contratos/); cambiarlos exige avisar al consumidor antes de mergear.
- Estados de **despliegue** ≠ estados de **suscripción** (§4.4). No mezclarlos.
- Nombres del dominio en español; sufijos de Nest en inglés (`ConstruccionService` = `ServicioConstruccion` del diagrama).

## Calidad — SOLID, clean code, patrones y pruebas (base del curso)

Estándar completo y referencias: [docs/ingenieria.md](docs/ingenieria.md). Auditoría: [docs/AUDITORIA_SOLID_CLEAN.md](docs/AUDITORIA_SOLID_CLEAN.md). Aplica a **cada historia**:

- **SOLID:** controlador adapta, servicio orquesta, política decide, adaptador habla con el exterior (S). Se extiende con una nueva implementación de un puerto, no con `if/switch` por tipo (O). Stubs, dobles y adaptadores reales cumplen el mismo contrato (L). Puertos estrechos (I). Servicios reciben puertos por constructor; nunca `new` de Docker, Prisma, SMTP ni `Date.now()` en el dominio (D).
- **Clean code:** nombres del dominio, funciones cortas, sin números mágicos, errores de dominio con nombre, sin `any`, sin código comentado.
- **Patrones nombrados** en el `design.md` del change (Repository, Adapter, Strategy, State, Facade, Observer…) con su porqué.
- **Pruebas unitarias obligatorias:** cada `Scenario` del spec delta tiene su `it(...)`; sin Docker, red, base ni reloj reales; ≥ 80 % de líneas en dominio y servicios tocados (`pnpm test:cov`). `pnpm test` en verde antes de cerrar una tarea.
- Si cambias un puerto, clase o estado, actualiza `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR y corre `pnpm diagramas:sync`.

## OpenSpec primero

Antes de codear una historia: `/opsx-propose`, change `feat/m<n>-<slug>` bajo el spec del módulo. Luego `/opsx-apply`. Tras el merge: `/opsx-archive`. Un spec por módulo en `openspec/specs/<modulo>/spec.md`; no un spec único del producto. Reglas de cada artefacto: `openspec/config.yaml`.

## Git — nunca a `main`

- Ramas: `feat/m<n>-<slug>`, `fix/`, `docs/`, `chore/`. Una historia = una rama = un PR.
- Commits: Conventional Commits `feat(m1):`, `fix(m4):`, `docs:`, `chore:`.
- Integración solo por PR con la plantilla; CODEOWNERS (`.github/CODEOWNERS`) asigna revisores.
- Para ponerte al día: `git merge origin/main` en tu rama. No reescribas historia de ramas compartidas ni hagas force-push a `main`.
- Antes de pedir revisión: `pnpm check` (pruebas, build y diagramas).

## Dueños (globs en `.cursor/rules/rol-*.mdc`)

| Dueño | Código |
|---|---|
| Eddy | `identidad`, `notificaciones`, `apps/web` `(auth)`, `.github/workflows`, `e2e` |
| Javier | `suscripciones`, `administracion`, `(billing)`, `(admin)`, `prisma` |
| Eduardo | `proyectos`, `observabilidad`, `apps/web` ([design system v4.1](docs/diseno/README.md)) |
| Derek | `construccion`, `orquestacion`, `enrutamiento`, `herramientas` (stub), compose, `adapters`, contratos, diagramas, ADR |

## Andamiaje

Cada módulo Nest está registrado y expone `GET /<modulo>/health`; los `health` y sus pruebas se mantienen. Las rutas web `/auth`, `/billing`, `/admin` y `/projects` son stubs: al crear la ruta real de tu pantalla, borra el stub de tu grupo y actualiza `components/shell/nav-panel.tsx`.

## Diseño — fuente madre

Toda la UI sale de **`docs/diseno/`** (design system v4.1). Código: tokens en `apps/web/src/app/globals.css`, componentes en `apps/web/src/components` (catálogo en `/sistema`). Un agente que construya una pantalla **debe** leer el README, la guía de construcción y la ficha antes de escribir código. Nada de hex, paletas por módulo, otro shell ni otro set de iconos. El canvas de Claude Design es para mirar; se construye desde las fichas.
