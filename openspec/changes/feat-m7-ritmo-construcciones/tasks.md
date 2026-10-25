# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su prueba con el mismo nombre, que importa código de producción. Cero datos fijos en pantalla y cero `any`. Guía paso a paso: [C3 en docs/handoff/prompt-eduardo-correcciones-m7.md](../../../docs/handoff/prompt-eduardo-correcciones-m7.md#c3--pr-50--ritmo-de-construcciones-08c--rama-featm7-ritmo-construcciones).

## 1. API

- [ ] 1.1 `RepositorioDespliegues.fechasDeConstruccionDesde` (mismo criterio que `contarConstruccionesDesde`) en memoria y Prisma, y en `clases-unificado.mmd`
- [ ] 1.2 `diariosDe` puro, `ConsumoService.diario` y `GET /observabilidad/consumo/diario`
- [ ] 1.3 Pruebas: la reversión no cuenta, día 1, otro mes, febrero

## 2. Web

- [ ] 2.1 `lib/proyeccion.ts`: días del mes desde el contrato, proyección `null` el día 1, zona de aviso y frase
- [ ] 2.2 `GraficaRitmo` rehecha y montada en `ConsumoPeriodo`; si la petición falla, la tarjeta no aparece
- [ ] 2.3 Pruebas: «Proyección en zona de aviso», «Se acaba antes», «Primer día»

## 3. Cierre

- [ ] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro
- [ ] 3.2 `pnpm check` en verde (incluye diagramas)
- [ ] 3.3 `/opsx-archive` después del merge
