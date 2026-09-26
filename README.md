# Deploya

PaaS de alojamiento web: de un repositorio público de GitHub con `Dockerfile` a un contenedor con los límites de tu plan y subdominio HTTPS. Monolito modular **NestJS + Next.js**, cola Redis, PostgreSQL.

**Alcance núcleo v4.1** (recortado por el curso): [docs/alcance.md](docs/alcance.md). Qué entrega cada quien y cuándo: [docs/plan-avances.md](docs/plan-avances.md). Lo demás está documentado como *fuera de alcance · solo si da el tiempo*.

Ciclo de despliegue: **Recepción → Construcción → Ejecución → Enrutamiento → Operación**.

## Empieza aquí (5 pasos)

Necesitas [Docker](https://docs.docker.com/get-docker/) con Compose v2, y para trabajar fuera de Docker Node 22 y pnpm 9 (`corepack enable`).

1. Clona el repo y entra en la carpeta.
2. Copia el entorno de ejemplo: `cp .env.example .env`
3. Levanta todo: `docker compose up --build`
4. Comprueba: API [http://localhost:3001/health](http://localhost:3001/health) y web [http://localhost:3000](http://localhost:3000) (catálogo del design system en `/sistema`).
5. Lee **tu kit** (tabla de abajo), [METODOLOGIA.md](METODOLOGIA.md) y [docs/ingenieria.md](docs/ingenieria.md) antes del primer PR.

## Comandos

| Para | Comando |
|---|---|
| Todo en Docker | `docker compose up --build` |
| Solo base y cola (para desarrollar fuera de Docker) | `docker compose up postgres redis` |
| API con recarga | `set -a; . ./.env; set +a; pnpm dev:api` → `http://localhost:3001` |
| Web con recarga | `pnpm dev:web` → `http://localhost:3000` |
| Pruebas (API + web) | `pnpm test` |
| Cobertura de la API | `pnpm test:cov` |
| Lo mismo que CI antes de pedir revisión | `pnpm check` |
| Copiar los `.mmd` a los documentos que los embeben | `pnpm diagramas:sync` |
| Prisma (con `DATABASE_URL` exportada) | `pnpm --filter @deploya/api exec prisma db push` y `pnpm --filter @deploya/api prisma:seed` |

## Tu kit está en `docs/roles/…`

| Eres | Kit | Módulos |
|---|---|---|
| Derek — arquitecto | [docs/roles/derek-motor-despliegue/](docs/roles/derek-motor-despliegue/) | M4 M5 M6 (M8 fuera de alcance) |
| Eddy — cuentas | [docs/roles/eddy-cuentas-seguridad/](docs/roles/eddy-cuentas-seguridad/) | M1 M10 |
| Javier — monetización | [docs/roles/javier-monetizacion-admin/](docs/roles/javier-monetizacion-admin/) | M2 M9 |
| Eduardo — proyectos | [docs/roles/eduardo-proyectos-ux/](docs/roles/eduardo-proyectos-ux/) | M3 M7 + web |

## Documentación común

| Qué | Dónde |
|---|---|
| **Alcance núcleo v4.1** (qué entra y qué no) | [docs/alcance.md](docs/alcance.md) |
| **Plan de avances** (30 / 50 / 80 / 100 %) | [docs/plan-avances.md](docs/plan-avances.md) |
| **Estándar de ingeniería** (SOLID, clean code, patrones, pruebas) | [docs/ingenieria.md](docs/ingenieria.md) |
| Cómo trabajamos (Scrum, definición de terminado) | [METODOLOGIA.md](METODOLOGIA.md) |
| Git, ramas, PRs y OpenSpec | [docs/guia-equipo.md](docs/guia-equipo.md) |
| Arquitectura C4 + ciclo | [docs/arquitectura.md](docs/arquitectura.md) (anexo largo: [arquitectura-maestro.md](docs/arquitectura-maestro.md)) |
| ERD / clases / C4 únicos | [docs/diagramas/compartido/](docs/diagramas/compartido/) |
| Contratos entre módulos | [docs/contratos/](docs/contratos/) |
| Decisiones de arquitectura | [docs/adr/](docs/adr/) |
| **Design system v4.1** (fuente madre de UI, guía de construcción, fichas por pantalla) | [docs/diseno/](docs/diseno/README.md) |
| Auditoría SOLID del repo | [docs/AUDITORIA_SOLID_CLEAN.md](docs/AUDITORIA_SOLID_CLEAN.md) |
| Propuesta de producto (histórica, alcance completo) | [docs/propuesta.md](docs/propuesta.md) |
| Reglas para agentes (Claude, Cursor, Copilot, OpenCode) | [AGENTS.md](AGENTS.md) |

## Mapa del repo

| Carpeta | Qué hay |
|---|---|
| `apps/api` | NestJS: `src/modules/<modulo>` (M1–M10), `src/adapters` (puertos y stubs), `prisma/` |
| `apps/web` | Next.js: rutas por grupo `(auth)`, `(billing)`, `(admin)`, `(projects)`; design system en `src/components` |
| `e2e` | Smoke del compose (CI) y, en la entrega final, el recorrido e2e |
| `openspec` | Un spec por módulo en `specs/`, changes en curso en `changes/` y cerrados en `changes/archive/` |
| `docs` | Todo lo de la tabla de arriba |
| `scripts` | Validación de Mermaid y sincronización de diagramas |
| `.agents` `.claude` `.cursor` `.github` `.opencode` | Comandos y skills de OpenSpec generados para cada herramienta (no editar); reglas de Cursor en `.cursor/rules` |

## Nunca a `main`

Ramas `feat/m<n>-<slug>`, `fix/`, `docs/`, `chore/`. Commits `feat(m1):`. OpenSpec **antes** de codear: `/opsx-propose` → apply → archive. Plantillas de issue (historia y error) y de PR en `.github/`.
