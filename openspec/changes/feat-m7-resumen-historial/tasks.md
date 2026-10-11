# Tasks

Requiere el layout del proyecto (`feat-m7-vista-despliegue`, PR #31) en `main`. Las acciones por fila usan `feat-m4-acciones-despliegue` y `feat-m5-reversion-instantanea`; si llegan después, la fila muestra solo lo que ya existe. Sin base ni reloj reales.

## 1. API

- [ ] 1.1 `RepositorioDespliegues.historialDe` (Prisma y memoria) y `GET /proyectos/:id/despliegues?filtro=&antesDe=`
- [ ] 1.2 Pruebas: «Filtrar fallidos», «Cargar más» (cursor sin repetir filas), «Fila activa marcada», proyecto ajeno → 404
- [ ] 1.3 `LineaTiempoDespliegue` y `ResumenProyectoService`; `GET /proyectos/:id/resumen`
- [ ] 1.4 Pruebas: «Proyecto saludable» (URL, versión activa con digest, recursos), «Proyecto sin despliegue Saludable» (`activo = null`, último Fallido), línea de tiempo con los cuatro hitos y sin el hito de una etapa no terminada

## 2. Web · 13 Resumen

- [ ] 2.1 `/projects/[proyecto]/page.tsx`: estado actual con `RielEtapas`, `CopyField` de la URL, versión activa, imagen, recursos, `LineaTiempo`; acciones de cabecera (Visitar, Reiniciar, Detener, Desplegar) con los 202 y 409 ya existentes; hueco para `<ActividadProyecto>` (M7-03)
- [ ] 2.2 Pruebas `node --test`: `textoRecursos`, `tiempoRelativo` con `ahora` fijo

## 3. Web · 14 Despliegues

- [ ] 3.1 `/projects/[proyecto]/despliegues/page.tsx`: `Segmented` Todos / Saludables / Fallidos, `Table`, fila activa, «Cargar más», acciones por fila con `Dialog`
- [ ] 3.2 Pruebas `node --test`: `accionDeFila` para cada caso, armado de la consulta con filtro y cursor
- [ ] 3.3 Revisión contra los artboards 13 y 14 en claro y oscuro; solo componentes de `apps/web/src/components`

## 4. Cierre

- [ ] 4.1 `clases-unificado.mmd`; `pnpm check` en verde; cobertura ≥ 80 % en `observabilidad/`
- [ ] 4.2 Demo: tres despliegues de `hola-deploya`; 14 filtra el fallido; revertir a #1 desde 14 y ver 13 con la versión activa #1
- [ ] 4.3 `/opsx-archive` después del merge
