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

- [x] 3.1 Correrla con datos viejos sembrados a mano: PostgreSQL 16 con las migraciones y el seed, Redis y el trabajador (`dist/trabajador.js`) del stack de compose. `POST /admin/limpieza/ejecutar` borró 4 filas (token usado hace 8 días, sesión inactiva hace 15, sesión revocada hace 8, invitación vencida hace 31) y dejó las vigentes; la segunda corrida, 0; un Cliente, 403. El trabajador registró `limpieza-diaria` en la cola `limpieza` (00:35 UTC)
- [x] 3.2 `clases-unificado.mmd`, `datos-nucleo.md` y `pnpm check` en verde
- [x] 3.3 `/opsx-archive` después del merge
