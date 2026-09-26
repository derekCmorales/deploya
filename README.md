# Deploya

PaaS de alojamiento web: de un repositorio público de GitHub con `Dockerfile` a un contenedor con los límites de tu plan y subdominio HTTPS. Monolito modular **NestJS + Next.js**, cola Redis, PostgreSQL.

**Alcance núcleo v4.1** (recortado por el curso): [docs/alcance.md](docs/alcance.md). Qué entrega cada quien y cuándo: [docs/plan-avances.md](docs/plan-avances.md). Lo demás está documentado como *fuera de alcance · solo si da el tiempo*.

Ciclo de despliegue: **Recepción → Construcción → Ejecución → Enrutamiento → Operación**.

## Empieza aquí (5 pasos)

Necesitas [Docker](https://docs.docker.com/get-docker/) y Docker Compose v2.

1. Clona el repo y entra en la carpeta.
2. Copia el entorno de ejemplo: `cp .env.example .env`
3. Levanta todo: `docker compose up --build`
4. Comprueba: API [http://localhost:3001/health](http://localhost:3001/health) y web [http://localhost:3000](http://localhost:3000)
5. Lee **tu kit** (tabla de abajo) y [METODOLOGIA.md](METODOLOGIA.md) antes del primer PR.

Sin Docker, en local: `pnpm install && pnpm build && pnpm test` (API en `3001` con Postgres/Redis a mano).

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
| Cómo trabajamos (Scrum, OpenSpec, git) | [METODOLOGIA.md](METODOLOGIA.md) |
| Propuesta de producto (histórica, alcance completo) | [docs/propuesta.md](docs/propuesta.md) |
| Arquitectura C4 + ciclo | [docs/arquitectura.md](docs/arquitectura.md) |
| ERD / clases / C4 únicos | [docs/diagramas/compartido/](docs/diagramas/compartido/) |
| Git, ramas, PRs | [docs/guia-equipo.md](docs/guia-equipo.md) |
| Kit visual (UI de todos los módulos) | [docs/kit-visual.md](docs/kit-visual.md) |
| Agentes y Cursor | [AGENTS.md](AGENTS.md) |

## Nunca a `main`

Ramas `feat/m<n>-<slug>`, `fix/`, `docs/`, `chore/`. Commits `feat(m1):`. OpenSpec **antes** de codear: `/opsx-propose` → apply → archive.
