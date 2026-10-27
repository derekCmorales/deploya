# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [x] 1.1 `MetricasNodoPuerto` (`MetricasNodoSistema` lee `/proc` y `statfs`, stub), `ConsultaInfraestructuraPuerto` (Prisma) e `InfraestructuraService`; `GET /admin/infraestructura` con `SesionGuard` + `RolGuard`
- [x] 1.2 Pruebas: «Vista del nodo», «Cola atascada», «Cliente no puede», más orden de la cola, fallidas de 24 h, muestra vigente y el adaptador Prisma

## 2. Web

- [x] 2.1 Pantalla 27 con `GraficaUso compacta` (serie armada con las lecturas cada 5 s), cola, tabla de entornos y la entrada «Infraestructura» del panel para el administrador

## 3. Cierre

- [x] 3.1 Revisión contra la ficha 27 en claro y oscuro (la web con una API falsa y capturas de Playwright; el canvas no se pudo abrir desde el entorno del agente)
- [x] 3.2 `clases-unificado.mmd` (`MetricasNodoPuerto`, `ConsultaInfraestructuraPuerto`, `InfraestructuraService`); `pnpm check` en verde
- [x] 3.3 `/opsx-archive` (se archiva en el PR que cierra el sprint)
