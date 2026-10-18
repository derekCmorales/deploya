# Tasks

Sin base ni reloj reales. Pruebas web con `node --test`.

## 1. Consumo

- [x] 1.1 `periodoDe(hoy)` y `ConsumoService`; `GET /observabilidad/consumo`
- [x] 1.2 Pruebas: «Consumo cerca del límite», «Mes nuevo» (el 1.º el contador vuelve a 0), la reversión no suma

## 2. Actividad

- [x] 2.1 `agruparPorDia` y `ActividadService`; `GET /proyectos/:id/actividad`
- [x] 2.2 Pruebas: «Actividad de 12 semanas» (84 días, días sin despliegues en 0, fallidos contados), proyecto ajeno → 404

## 3. Web

- [x] 3.1 `ConsumoPeriodo` (dos `Meter`) y `ActividadProyecto` (`MapaActividad`); avisar a Javier (08) y a Derek (13) para montarlos
- [x] 3.2 Pruebas `node --test`: texto «12 semanas · N despliegues · M con fallo», fecha «Se reinicia el …»
- [ ] 3.3 Revisión contra los artboards 08 y 13 en claro y oscuro

## 4. Cierre

- [x] 4.1 `clases-unificado.mmd`; `pnpm check` en verde
- [ ] 4.2 `/opsx-archive` después del merge
