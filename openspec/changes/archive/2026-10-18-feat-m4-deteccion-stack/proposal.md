# Proposal

Change: `feat/m4-deteccion-stack`. Módulo dueño: **motor-construccion (M4)** — Derek. Specs tocadas: `motor-construccion`, `proyectos` (con Eduardo). Historia: **M4-03** (5 pts, Avance 2). ADR: [0003](../../../docs/adr/0003-construccion-dockerfile-o-receta.md).

## Why

En la retroalimentación de la primera entrega el curso pidió concentrar esfuerzo en **detectar el stack**. El núcleo v4.1 rechazaba cualquier repositorio sin `Dockerfile`. Con este change, un repositorio Node, Python, Go o un sitio estático se despliega sin que el cliente escriba un `Dockerfile`, y el `Dockerfile` propio sigue mandando cuando existe. Sale de *Fuera de alcance* (punto 10) con este change propio, como exige [AGENTS.md](../../../AGENTS.md).

## What Changes

- `DeteccionStackService.detectar(fuente: LectorFuente)` exportado por M4, con recetas en orden fijo: `RecetaDockerfile`, `RecetaNode`, `RecetaPython`, `RecetaGo`, `RecetaEstatica` (Strategy).
- `LectorFuente` como puerto: `LectorFuenteLocal` (disco del clon, en el trabajador) y el adaptador de M3 sobre la API pública de GitHub (en el alta).
- `PasoRecepcion` detecta después de clonar; si la receta no es `dockerfile`, escribe `Dockerfile.deploya` y `PasoConstruccion` lo usa. La bitácora dice qué se detectó.
- `Proyecto.receta` y `Artefacto.receta` se guardan (ya están en [datos-nucleo.md](../../../docs/contratos/datos-nucleo.md)).
- Contrato v2 (servicio interno): `detectar` y `ResultadoDeteccion`; error `StackNoReconocido` para 11e.

## Non-goals

- Buildpacks (Nixpacks, Paketo) y detección de versiones finas: Node 22, Python 3.12 y Go 1.23 fijos.
- Monorepos, subcarpetas y varios servicios por repositorio.
- Comando de arranque editable por el cliente.
- Cambios visuales fuera de 11a y 11e (los hace Eduardo con el contrato v2).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `motor-construccion`: nueva **Detección de stack**; «Construcción con Dockerfile» pasa a «Construcción con Dockerfile o receta».
- `proyectos`: el alta acepta un repositorio sin `Dockerfile` si M4 reconoce el stack; el error de 11e cambia de texto.

## Impact

- Código: `apps/api/src/modules/construccion/deteccion/` (servicio, recetas, plantillas de Dockerfile), `PasoRecepcion`; en M3 (Eduardo) el adaptador `LectorFuenteGitHub` y la llamada en 11a.
- Web: textos de 11a y 11e (Eduardo).
- Pruebas: una por receta con mapas de archivos en memoria; sin red ni Docker.
- Depende de `feat/m4-motor-construccion` mergeado.
