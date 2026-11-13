# Proposal

Change: `feat/m4-capas-dockerfile`. Módulo dueño: **motor-construccion (M4)**, Derek. Spec tocada: `motor-construccion`. Práctica del patrón **Decorator** (GoF) sobre la detección de stack de M4-03, ya en `main`.

## Why

Cuando el repositorio no trae `Dockerfile`, cada receta genera un `Dockerfile.deploya` con su plantilla ([plantillas.ts](../../../apps/api/src/modules/construccion/deteccion/plantillas.ts)). Las cuatro plantillas repiten las mismas capas (`ENV PORT=8080` + `EXPOSE 8080` y el `USER` final sin privilegios), y no hay forma de agregar una capa nueva sin editar las cuatro ni de agregar capas que solo conoce el trabajador, como el commit que se construye. Una capa nueva por herencia (`PlantillaNodeConEtiquetas`, `PlantillaGoConEtiquetasYUsuario`…) sería la explosión de subclases que Decorator evita.

## What Changes

- El Dockerfile generado pasa a ser un **componente** `DockerfileReceta` (`instrucciones()` y `descripcion()`). Cada receta devuelve solo su **base** (`DockerfileBase`), sin las capas comunes.
- Un **decorador base** `DecoradorDockerfile` guarda el componente envuelto y le delega. Tres **decoradores concretos**:
  - `ConPuertoDeploya`: `ENV PORT=8080` + `EXPOSE 8080`, en las cuatro recetas.
  - `ConUsuarioSinPrivilegios(usuario)`: `USER <usuario>` final, solo en las recetas que lo declaran (Python, Go, estática; Node ya fija `USER node` antes de `npm ci`).
  - `ConEtiqueta(clave, valor)`: `LABEL`; se aplica varias veces (revisión, fuente y proyecto).
- La pila se arma en **dos momentos**: `DeteccionStackService` aplica las capas comunes (igual en el alta y en el trabajador) y `PasoRecepcion` agrega las etiquetas del commit antes de escribir `Dockerfile.deploya`.
- La bitácora registra las capas aplicadas: «Capas: Go 1.23 · puerto 8080 · usuario nonroot:nonroot · etiqueta revision · …».
- Contrato de despliegues **v3.4 (solo cambia el tipo de un campo que M3 ignora)**: `ResultadoDeteccion.dockerfile` pasa de `string | null` a `DockerfileReceta | null`.
- Diagrama de clases del patrón en `docs/diagramas/m1-m10/m4-clases-capas-dockerfile.mmd` y en `clases-unificado.mmd`.

## Non-goals

- Decorar el `Dockerfile` propio del cliente: sigue mandando tal cual (receta `dockerfile`).
- `HEALTHCHECK` en la imagen (distroless no trae `curl`; M5 ya verifica la salud desde afuera).
- Meter las variables del proyecto en la imagen (son secretas; M5 las inyecta al ejecutar).
- Capas activables por variable de entorno, nuevas recetas o versiones finas de los lenguajes.
- Cambios de UI.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `motor-construccion`: nuevo requisito **Capas del Dockerfile generado** (capas comunes, usuario solo donde aplica, etiquetas del despliegue, el Dockerfile propio no se decora, bitácora de capas).

## Impact

- Código (Derek): `construccion/deteccion/` (`dockerfile-receta.ts`, `capas/`, `plantillas.ts`, recetas), `deteccion-stack.service.ts`, `pipeline/paso-recepcion.ts`.
- M3 (Eduardo): ningún cambio de código, porque `ProyectosService` no lee `dockerfile`. El contrato lo actualiza este change, y el aviso del cambio de tipo va en la descripción del PR.
- Pruebas: las de `deteccion-stack.service.spec.ts` y `pipeline-despliegue.spec.ts` se ajustan; una prueba por decorador y por escenario, sin Docker ni red.
- Imagen resultante: mismas instrucciones efectivas que hoy, más tres `LABEL` OCI.
