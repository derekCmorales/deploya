# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [ ] 1.1 `PoliticaLimpieza`, `PurgaDatosVencidosPuerto` y su doble en memoria
- [ ] 1.2 `LimpiezaService` y registro en `ConfiguracionInstalacion` (migración)
- [ ] 1.3 Pruebas: «Borra lo vencido», «Respeta lo vigente», «Correr dos veces el mismo día»
- [ ] 1.4 Adaptador Prisma, cola BullMQ y `POST /admin/limpieza/ejecutar`
- [ ] 1.5 Prueba: «Cliente no puede»

## 2. Web

- [ ] 2.1 «Última limpieza: <fecha> · N filas» en 32

## 3. Cierre

- [ ] 3.1 Correrla en compose con datos viejos sembrados a mano
- [ ] 3.2 `clases-unificado.mmd`, `datos-nucleo.md` y `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
