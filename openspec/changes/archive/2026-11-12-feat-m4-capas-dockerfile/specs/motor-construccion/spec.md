# Spec Delta

## ADDED Requirements

### Requirement: Capas del Dockerfile generado

Cuando la receta detectada no es `dockerfile`, el `Dockerfile.deploya` SHALL armarse con la base de la receta más capas comunes, sin que la base las repita. Toda receta SHALL recibir la capa de puerto (`ENV PORT=8080` y `EXPOSE 8080`, una sola vez cada una). Las recetas que no fijan su propio usuario dentro de la base (Python, Go y sitio estático) SHALL recibir una capa `USER` final sin privilegios; Node SHALL conservar el `USER node` de su base y no recibir otro. En ninguna receta la imagen final SHALL correr como `root`. Las capas comunes SHALL ser las mismas en el alta (M3) y en el trabajador.

En el trabajador, antes de escribir `Dockerfile.deploya`, el sistema SHALL agregar tres etiquetas del despliegue: `org.opencontainers.image.revision` con el sha del commit, `org.opencontainers.image.source` con la URL del repositorio y `deploya.proyecto` con el subdominio. La bitácora de Recepción SHALL registrar la línea «Capas: <stack> · <capa> · …» con las capas en el orden en que se aplicaron. El `Dockerfile` propio del repositorio SHALL usarse sin capas ni etiquetas.

#### Scenario: Capas comunes en una receta

- **WHEN** la rama tiene `go.mod` y no tiene `Dockerfile`
- **THEN** el `Dockerfile.deploya` contiene `ENV PORT=8080` y `EXPOSE 8080` una sola vez cada uno, y su última instrucción `USER` es `USER nonroot:nonroot`

#### Scenario: El sitio estático no termina como root

- **WHEN** la rama solo tiene `index.html`
- **THEN** la base cambia a `USER root` para limpiar el sitio, y la última instrucción `USER` del `Dockerfile.deploya` es `USER 101`

#### Scenario: Node no recibe un usuario extra

- **WHEN** la rama tiene `package.json` con script `start`
- **THEN** el `Dockerfile.deploya` tiene una sola instrucción `USER`, `USER node`, antes de `npm ci` o `npm install`

#### Scenario: Etiquetas del despliegue

- **WHEN** el trabajador construye con receta el commit `a1b2c3d…` del proyecto `mi-api` desde `https://github.com/ana/mi-api`
- **THEN** el `Dockerfile.deploya` contiene `LABEL org.opencontainers.image.revision="a1b2c3d…"`, `LABEL org.opencontainers.image.source="https://github.com/ana/mi-api"` y `LABEL deploya.proyecto="mi-api"`

#### Scenario: Las capas en la bitácora

- **WHEN** el trabajador construye un proyecto Python sin `Dockerfile`
- **THEN** la bitácora de Recepción registra «Capas: Python 3.12 · puerto 8080 · usuario 10001 · etiqueta revision · etiqueta source · etiqueta proyecto»

#### Scenario: El Dockerfile propio no se decora

- **WHEN** la rama tiene `Dockerfile`
- **THEN** no se escribe `Dockerfile.deploya`, se construye con el del repositorio sin etiquetas agregadas y la bitácora no registra la línea «Capas»

#### Scenario: Un valor de etiqueta con comillas

- **WHEN** un valor de etiqueta contiene `"` o `\`
- **THEN** el carácter se escapa con `\` dentro de las comillas del `LABEL`, y el Dockerfile sigue siendo válido
