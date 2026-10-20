# Design

## Context

`Bitacora` ya muestra líneas numeradas con `enCurso`; el polling ya existe en la vista de despliegue.

## Decisions

### 1. Leer, no guardar

`docker logs` es la fuente; no hay tabla nueva.

### 2. Nivel por heurística

Se detecta por prefijo (`ERROR`, `WARN`); lo demás es Info.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ContenedorPuerto.bitacora` | Adapter | I, D | Método nuevo en el puerto |
| `nivelDe(linea)` | Función pura | S | Se prueba sin Docker |

Cambios de clases y puertos: `ContenedorPuerto.bitacora` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Contenido no confiable:** se muestra solo como texto (regla de `Bitacora`).
