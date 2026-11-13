# Proposal

Change: `feat/m3-ruta-dockerfile-alta`. Owning module: **proyectos (M3)**, owned by Eduardo. Touched specs: `proyectos`. Screens: **11a** (field), **11d** (the «Construcción» line).

## Why

The wizard (11a) only accepts a `Dockerfile` in the root of the branch. In a monorepo with several images
(`apps/api/Dockerfile`, `apps/web/Dockerfile`…) the client cannot pick one when creating the project. Today they have
to put a `Dockerfile` in the root just to pass the wizard, accept that deploy #1 builds the wrong image (and fails),
and only then change «Ruta del Dockerfile» in 19.

The spec already expects it: the scenario «Falta el Dockerfile» says «en la ruta indicada», and the 11a sheet lists
«URL, rama y Dockerfile». Configuración (19) already saves `rutaDockerfile`, and the engine already builds with it
(`docker build -f`).

## What Changes

- 11a: an optional field «Ruta del Dockerfile», relative to the repository, prefilled with `Dockerfile`.
- `POST /proyectos/validar-repositorio` and `POST /proyectos` accept `rutaDockerfile`. It is normalized and validated
  with the same rule as 19 (`rutaDockerfileDe`, moved from `cambios-proyecto.ts`).
- The validation reads the `Dockerfile` at that path (contents API) and suggests the port from its `EXPOSE`.
  `DeteccionStackService.detectar` receives the path, as it already does in Recepción.
- The project is saved with that path; without one it stays `Dockerfile`, as today.
- Changing the branch or the repository in 19 validates with the path saved in the project, not with the root.
- 11a and 11d show the chosen path.

## Non-goals

- Choosing the build context (it is still the root of the clone).
- Several Dockerfiles per project, or private repositories.
- Changing Recepción, Construcción or the engine contract.

## Capabilities

### Modified Capabilities

- `proyectos`: «Alta desde repositorio».

## Impact

- API: `proyectos/dominio` (`alta-proyecto.ts`, `ruta-dockerfile.ts`, `cambios-proyecto.ts`, `proyecto.ts`),
  `adaptadores/fuente-github-publica.ts`, `proyectos.service.ts`. No migration: the `rutaDockerfile` column already
  exists.
- Web: `use-alta-proyecto.ts`, `paso-repositorio.tsx`, `lib/proyectos.ts`, sheet `11a-Nuevo-fuente.md`.
- Compatible: a client that does not send `rutaDockerfile` gets the same result as before.
