# 0003 — Construcción con el Dockerfile del repo o con una receta por stack detectado

- **Estado:** Propuesto
- **Fecha:** 2026-09-27
- **Autor:** @derekCmorales · **Módulos:** M4 (consumidor: M3)
- **Change de OpenSpec:** `feat/m4-deteccion-stack` (y `feat/m4-motor-construccion` para el caso Dockerfile)

## Contexto

El núcleo v4.1 exigía `Dockerfile` en la raíz. En la retroalimentación de la entrega 1 el curso pidió concentrar esfuerzo en **detectar el stack**. Buildpacks (Paketo, Nixpacks) resuelven eso, pero agregan binarios pesados, imágenes de cientos de MB y poco control del resultado para cuatro stacks.

## Decisión

El `Dockerfile` del repo **manda**. Si no hay, `DeteccionStackService` prueba **recetas** en orden fijo (Strategy): Node (`package.json` con script `start`), Python (`requirements.txt` o `pyproject.toml` más `main.py` o `app.py`), Go (`go.mod`) y estático (`index.html`). La receta genera un `Dockerfile.deploya` en el clon y se construye igual que un Dockerfile propio. Todas escuchan en `PORT=8080`. Sin coincidencias: `StackNoReconocido`, que M3 muestra en 11e.

Las recetas son **puras**: deciden sobre un mapa de archivos ya leído, así que la misma detección sirve en el alta (M3 lee por la API de GitHub) y en el trabajador (lee del disco), cada uno con su `LectorFuente`.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Dockerfile o receta propia** (elegida) | Imágenes pequeñas y explicables; recetas probables sin Docker; la misma detección en 11a y en el trabajador | Solo cuatro stacks; cada uno lo mantenemos nosotros |
| Nixpacks / Paketo buildpacks | Muchos stacks | Binario extra en el worker, imágenes grandes, difícil de probar y de explicar en la demo |
| Seguir exigiendo Dockerfile | Cero trabajo | Contradice la retroalimentación del curso |

## Consecuencias

- **OCP:** un stack nuevo es una clase `RecetaX extends RecetaStack` registrada en la lista; el servicio no cambia.
- **LSP:** `RecetaDockerfile` es una receta más (devuelve el Dockerfile del repo), sin `if` especiales.
- `Proyecto.receta` guarda la última detectada; `Artefacto.receta` la usada en cada versión.
- Deuda aceptada: sin detección de versión fina (Node 22, Python 3.12 y Go 1.23 fijos); monorepos no se detectan.
