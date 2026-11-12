# Tasks

No real Docker, network, database or clock in the unit tests. Each `Scenario` in the spec delta has its own `it(...)`.

## 1. API

- [x] 1.1 `rutaDockerfileDe` in `dominio/ruta-dockerfile.ts`, used by `cambios-proyecto.ts` and `alta-proyecto.ts`
- [x] 1.2 `ConsultaRepositorio`, `AltaProyecto` and `ValidacionRepositorio` carry `rutaDockerfile`
- [x] 1.3 `FuenteGitHubPublica` reads `contents/<ruta>` and returns the path; `ProyectosService` passes it to
  detection, saves it in `crear` and uses it in `configurar`
- [x] 1.4 Tests: «Ruta del Dockerfile en el alta», «Ruta del Dockerfile inexistente sin stack reconocido», «Cambiar la
  rama con un Dockerfile fuera de la raíz», invalid and empty paths, and the adapter reads the path

## 2. Web

- [x] 2.1 «Ruta del Dockerfile» field in 11a (`use-alta-proyecto`, `paso-repositorio`), with `ruta-invalida` shown next to
  the field
- [x] 2.2 Path on the 11a card and in the «Construcción» line of 11d
- [x] 2.3 Test in `test/proyectos.test.mjs`; sheet `11a-Nuevo-fuente.md` updated

## 3. Close-out

- [x] 3.1 `pnpm test` (api and web), `tsc --noEmit` and `pnpm validate:mermaid` all green
- [ ] 3.2 `/opsx-archive` after the merge
