# Design

## Context

El alta (M3-02) ya valida repositorio, rama y nombre; el borrado (M3-04, parte) ya está. `PasoRecepcion` lee `rama` y `rutaDockerfile` del proyecto y `PasoEjecucion` lee `puertoInterno` en cada despliegue, así que guardar es suficiente para que el próximo use lo nuevo.

## Goals / Non-Goals

**Goals:** editar los cinco campos con las mismas reglas del alta y mover el borrado a 19.

**Non-Goals:** cambiar subdominio, desplegar al guardar.

## Decisions

### 1. Value Object de cambios

`CambiosProyecto.de(cuerpo)` valida cada campo presente con los mismos VO del alta (`NombreProyecto`, `RutaDockerfile`, `PuertoInterno`) y descarta los ausentes. `ProyectosService.configurar(usuarioId, id, cambios)` verifica dueño, unicidad del nombre y, si cambió repositorio o rama, llama a `ProveedorFuente` como en el alta.

### 2. El subdominio no se toca

`RepositorioProyectos.actualizar` no acepta `subdominio` en su tipo: el compilador lo impide.

### 3. Formulario con borrador

La web guarda un borrador local; `cambiosDe(original, borrador)` devuelve solo lo que cambió y habilita «Guardar cambios». «Descartar» vuelve al original.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `CambiosProyecto` | Value Object | S | Las reglas del alta se reutilizan, no se copian |
| `ProyectosService.configurar` | Service Layer | S | Orquesta validación y guardado |
| `ProveedorFuente` (existente) | Adapter | D | Validar el repositorio sin red en las pruebas |
| `RepositorioProyectos.actualizar` | Repository | I | El tipo no deja cambiar el subdominio |
| `cambiosDe` (web) | Función pura | S | El formulario solo pinta |

Cambios de clases: `CambiosProyecto`, `RepositorioProyectos.actualizar` → `clases-unificado.mmd`.

## Risks / Trade-offs

- **Cambiar el repositorio con despliegues anteriores:** el historial conserva sus commits; revertir a un artefacto viejo sigue funcionando porque la imagen no depende del repositorio.
