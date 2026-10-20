# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [ ] 1.1 Servicio, endpoint y acción administrativa
- [ ] 1.2 Pruebas: «Reactivar con suscripción vigente», «Reactivar con suscripción suspendida», «Cuenta no suspendida», «Cliente no puede»

## 2. Web

- [ ] 2.1 Botón y diálogo de 25c
- [ ] 2.2 Prueba `node --test` del texto del aviso según la suscripción

## 3. Cierre

- [ ] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
