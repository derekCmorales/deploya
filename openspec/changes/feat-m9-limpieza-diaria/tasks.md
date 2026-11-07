# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [x] 1.1 `PoliticaLimpieza`, `PurgaDatosVencidosPuerto` y su doble en memoria
- [x] 1.2 `LimpiezaService` y registro en `ConfiguracionInstalacion` (migración)
- [x] 1.3 Pruebas: «Borra lo vencido», «Respeta lo vigente», «Correr dos veces el mismo día»
- [x] 1.4 Adaptador Prisma, cola BullMQ y `POST /admin/limpieza/ejecutar`
- [x] 1.5 Prueba: «Cliente no puede»

## 2. Web

- [x] 2.1 «Última limpieza: <fecha> · N filas» en 32

## 3. Cierre

- [ ] 3.1 Correrla en compose con datos viejos sembrados a mano (hecha contra PostgreSQL 16 local con las migraciones aplicadas: 4 filas borradas, las vigentes intactas, la segunda corrida 0; falta en compose)
- [x] 3.2 `clases-unificado.mmd`, `datos-nucleo.md` y `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
