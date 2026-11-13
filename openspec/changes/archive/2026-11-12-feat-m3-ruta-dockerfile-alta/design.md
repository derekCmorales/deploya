# Design

## Context

`Proyecto.rutaDockerfile` exists from the start. Configuración (19) edits it, and Recepción passes it to
`DeteccionStackService.detectar(lector, rutaDockerfile)` and to `docker build -f`. Only the wizard pins
`RUTA_DOCKERFILE`, both when validating (`FuenteGitHubPublica.dockerfile` asks for `contents/Dockerfile`) and when
saving.

## Decisions

### 1. One path rule

The normalization in `cambios-proyecto.ts` (`./`, `/`, `..`, `\`, empty segments) moves to
`dominio/ruta-dockerfile.ts` (`rutaDockerfileDe`). The wizard and 19 use the same function: a path that is valid in one
place is valid in the other (DRY).

### 2. Optional field, compatible default

An empty or missing `rutaDockerfile` in the wizard means the root. `ConsultaRepositorio` and `AltaProyecto` get the
field as optional, so existing callers (tests, `configurar`) keep working without changes.

### 3. The validation reports the path

`ValidacionRepositorio.rutaDockerfile` returns the path that was checked. The web shows it on the 11a card and in the
«Construcción» line of 11d, without guessing it again.

### 4. `configurar` validates with the saved path

When the branch or the repository changes, `configurar` checks the project's `rutaDockerfile` (or the new one, if it
changes too). Before, it validated the root and could reject a monorepo with an `EXPOSE` only in its subfolder.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `rutaDockerfileDe` | Value Object (función pura) | S | One validation and normalization rule for the path |
| `validarAltaProyecto` / `validarConsultaRepositorio` | Parse, don't validate | S | The controller receives an already valid `AltaProyecto` |
| `ProveedorFuente` / `FuenteGitHubPublica` | Puerto + Adapter | O, L | Same contract; the adapter reads the requested path, and the test double does too |
| `ProyectosService` | Service Layer | S, D | Passes the path to the port and to `DeteccionStackService`; decides nothing about the file |
| `LectorDockerfileEn` | Decorator (already existing) | O | Reused: detection reads the Dockerfile at the chosen path |

No class, port or state changes in `docs/diagramas/compartido/clases-unificado.mmd`. `ProveedorFuente.validar` and
`DeteccionStackService.detectar` keep their signatures; only optional fields are added to the domain types.

## Risks / Trade-offs

- A wrong path with no recognized stack in the root fails in 11a with «falta Dockerfile y no se reconoce el stack», as
  before; the field stays visible so it can be fixed.
- The build context is still the root: a `Dockerfile` in a subfolder must use paths relative to the root, which is
  what monorepos do.
