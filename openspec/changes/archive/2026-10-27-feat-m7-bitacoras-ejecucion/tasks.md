# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [x] 1.1 `ContenedorPuerto.bitacora` (`ContenedorDocker` con `docker logs --timestamps --since --tail`, stub), `SalidaContenedorPuerto` con `SalidaContenedorBullMq` (petición y respuesta por la cola `bitacoras`; el trabajador la consume) y `GET /proyectos/:id/bitacora?desde=`
- [x] 1.2 Prueba: «Líneas nuevas» con el doble del puerto (`SalidaContenedorMemoria`), más nivel por prefijo, 500 líneas, `desde` estricto, 404, 400 y 503

## 2. Web

- [x] 2.1 Pestaña 15 (`/projects/[proyecto]/bitacoras`): `Segmented`, búsqueda, `Bitacora`, `PuntoVivo`, pausa, descarga y la pestaña en `MarcoProyecto`
- [x] 2.2 Pruebas: «Pausa sin perder líneas», «Filtro por nivel» (`test/bitacoras.test.mjs`)

## 3. Cierre

- [x] 3.1 Revisión contra la ficha 15 en claro y oscuro (la web con una API falsa y capturas de Playwright; el canvas no se pudo abrir desde el entorno del agente)
- [x] 3.2 `clases-unificado.mmd` (`ContenedorPuerto.bitacora`, `SalidaContenedorPuerto`, `BitacoraEjecucionService`); `pnpm check` en verde
- [x] 3.3 `/opsx-archive` (se archiva en el PR que cierra el sprint)
