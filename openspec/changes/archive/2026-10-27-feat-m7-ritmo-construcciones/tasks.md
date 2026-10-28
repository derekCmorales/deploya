# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su prueba con el mismo nombre, que importa código de producción. Cero datos fijos en pantalla y cero `any`. Guía paso a paso: [C3 en docs/handoff/prompt-eduardo-correcciones-m7.md](../../../docs/handoff/prompt-eduardo-correcciones-m7.md#c3--pr-50--ritmo-de-construcciones-08c--rama-featm7-ritmo-construcciones).

## 1. API

- [x] 1.1 `RepositorioDespliegues.fechasDeConstruccionDesde` (mismo criterio que `contarConstruccionesDesde`) en memoria y Prisma, y en `clases-unificado.mmd`
- [x] 1.2 `diariosDe` puro, `ConsumoService.diario` y `GET /observabilidad/consumo/diario`
- [x] 1.3 Pruebas: la reversión no cuenta, día 1, otro mes, febrero

## 2. Web

- [x] 2.1 `lib/proyeccion.ts`: días del mes desde el contrato, proyección `null` el día 1, zona de aviso y frase
- [x] 2.2 `GraficaRitmo` rehecha y montada en `ConsumoPeriodo`; si la petición falla, la tarjeta no aparece
- [x] 2.3 Pruebas: «Proyección en zona de aviso», «Se acaba antes», «Primer día»

## 3. Cierre

- [x] 3.1 Revisión contra la ficha 08c en claro y oscuro (capturas en el PR: zona de aviso, se acaba antes, día 1, hover y sin API)
- [x] 3.2 `pnpm check` en verde (incluye diagramas) — CI «Build y pruebas» en success
- [x] 3.3 `/opsx-archive` después del merge (archivado en el PR que cierra el sprint)
