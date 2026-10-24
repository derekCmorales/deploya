# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Diseño

- [x] 1.1 Propuesta de Eddy (animar las ilustraciones actuales de 01 y 03), revisada con Derek

## 2. Web

- [x] 2.1 Ilustraciones de 01 y 03 con el movimiento nuevo; utilidades `dy-aparece`, `dy-crece-x`, `dy-crece-centro`, `dy-respira` y `dy-oscila` en `globals.css` y en la tabla Movimiento del README de diseño
- [x] 2.2 Pruebas: «Movimiento reducido», «Ilustración decorativa», «Solo tokens» (`node --test` en `test/ilustraciones-acceso.test.mjs`) y que las utilidades nuevas solo animen `transform` y `opacity`
- [ ] 2.3 Capturas en claro y oscuro en el PR

## 3. Cierre

- [ ] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
