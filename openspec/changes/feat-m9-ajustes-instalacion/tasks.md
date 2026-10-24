# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Estado y versión

- [x] 1.1 `SaludInstalacion` con cinco comprobaciones y lectura del JSON de los scripts
- [x] 1.2 Prueba: «Estado con aviso», «Solo en autoalojado»

## 2. Registro e invitaciones

- [x] 2.1 Política, `Invitacion` y `PoliticaRegistroPuerto` (falta que Eddy lo llame en el registro de M1)
- [x] 2.2 Pruebas: «Registro con invitación», «Invitación vencida o reusada», «Registro cerrado»

## 3. Límites y web

- [x] 3.1 `PATCH /admin/instalacion/limites`; pantalla 32
- [x] 3.2 Prueba: «Límites en el próximo despliegue»

## 4. Cierre

- [ ] 4.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 4.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 4.3 `/opsx-archive` después del merge
