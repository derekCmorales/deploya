# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [ ] 1.1 `ConsumoService.diario` y endpoint
- [ ] 1.2 Prueba: la reversión no cuenta

## 2. Web

- [ ] 2.1 `GraficaRitmo` en `ConsumoPeriodo`
- [ ] 2.2 Pruebas: «Proyección en zona de aviso», «Se acaba antes», «Primer día»

## 3. Cierre

- [ ] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
