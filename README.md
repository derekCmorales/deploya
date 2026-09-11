# Deploya

PaaS de alojamiento web: de un repositorio (o un zip) a un contenedor con subdominio HTTPS. Monolito modular **NestJS + Next.js**, cola Redis, PostgreSQL.

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
| Derek — arquitecto | [docs/roles/derek-motor-despliegue/](docs/roles/derek-motor-despliegue/) | M4 M5 M6 + tools M8 |
| Eddy — cuentas | [docs/roles/eddy-cuentas-seguridad/](docs/roles/eddy-cuentas-seguridad/) | M1 M10 |
| Javier — monetización | [docs/roles/javier-monetizacion-admin/](docs/roles/javier-monetizacion-admin/) | M2 M9 |
| Eduardo — proyectos | [docs/roles/eduardo-proyectos-ux/](docs/roles/eduardo-proyectos-ux/) | M3 M7 + UI M8 |

## Documentación común

| Qué | Dónde |
|---|---|
| Cómo trabajamos (Scrum, OpenSpec, git) | [METODOLOGIA.md](METODOLOGIA.md) |
| Propuesta de producto | [docs/propuesta.md](docs/propuesta.md) |
| Arquitectura C4 + ciclo | [docs/arquitectura.md](docs/arquitectura.md) |
| ERD / clases / C4 únicos | [docs/diagramas/compartido/](docs/diagramas/compartido/) |
| Git, ramas, PRs | [docs/guia-equipo.md](docs/guia-equipo.md) |
| Agentes y Cursor | [AGENTS.md](AGENTS.md) |

## Nunca a `main`

Ramas `feat/m<n>-<slug>`, `fix/`, `docs/`, `chore/`. Commits `feat(m1):`. OpenSpec **antes** de codear: `/opsx-propose` → apply → archive.
