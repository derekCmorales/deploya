# Proposal

Change: `feat/m3-configuracion-proyecto`. Módulo: **proyectos (M3)** — Derek. Spec tocada: `proyectos`. Historia: **M3-04** Configuración y eliminar proyecto (3 pts, Avance 3). Pantallas 19 y 19b.

## Why

El borrado ya funciona (`feat-m3-eliminar-proyecto`, con limpieza de contenedor, imágenes y ruta por la cola de M5), pero vive en el detalle de la lista y no hay forma de cambiar el nombre, la rama, la ruta del `Dockerfile` ni el puerto sin borrar el proyecto y crearlo de nuevo.

## What Changes

- `PATCH /proyectos/:id` `{ nombre?, urlRepositorio?, rama?, rutaDockerfile?, puertoInterno? }` → 200 con el proyecto. Aplica en el **próximo** despliegue; no despliega solo.
  - `nombre`: 1–64, único por cliente (`NombreRepetido` → 409); **no** cambia el subdominio.
  - `urlRepositorio` y `rama`: misma validación que el alta (`LectorFuenteGitHub`, repositorio público y rama existente → `RepositorioInaccesible` / `RamaInexistente`).
  - `rutaDockerfile`: relativa, sin `..` (`RutaInvalida`).
  - `puertoInterno`: 1–65535 (`PuertoInvalido`).
- Web: `/projects/[proyecto]/configuracion` (19) con General, Fuente y Contenedor, «Descartar» y «Guardar cambios» (solo con cambios), y «Zona de peligro» que abre el `Dialog` 19b ya construido (conteos reales: variables y despliegues). Se quita «Eliminar proyecto» del detalle de la lista.

## Non-goals

- Cambiar el subdominio (fijo desde el alta) y dominios personalizados.
- Repositorios privados o carga por archivo.
- Desplegar automáticamente al guardar.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `proyectos`: «Configuración y eliminación» con sus validaciones y el cambio que aplica en el próximo despliegue.

## Impact

- Código: `ProyectosService.configurar`, `CambiosProyecto` (VO), `RepositorioProyectos.actualizar`, `PATCH /proyectos/:id`.
- Web: `apps/web/src/app/(projects)/projects/[proyecto]/configuracion/page.tsx`; mueve `eliminar-proyecto.tsx`.
- Sin cambios de tablas ni de contrato con M4: el pipeline ya lee rama, ruta y puerto del proyecto en cada despliegue.
