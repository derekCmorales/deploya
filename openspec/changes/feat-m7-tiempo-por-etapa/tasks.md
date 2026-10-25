# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su prueba con el mismo nombre, que importa código de producción. Cero datos fijos en pantalla y cero `any`. Guía paso a paso: [C2 en docs/handoff/prompt-eduardo-correcciones-m7.md](../../../docs/handoff/prompt-eduardo-correcciones-m7.md#c2--pr-49--tiempo-por-etapa-14c--rama-featm7-tiempo-por-etapa).

## 1. API

- [ ] 1.1 Dominio puro sobre `TiemposDespliegue`: mediana de Saludables, % de Construcción, fallos, última reversión
- [ ] 1.2 `TiemposService` (proyecto ajeno → 404) y `GET /proyectos/:id/despliegues/tiempos?ultimos=14` en `ObservabilidadModule`
- [ ] 1.3 Pruebas: «Mediana», «Dónde falló», «Reversión» y proyecto ajeno

## 2. Web

- [ ] 2.1 `GraficaEtapas` rehecha: una columna apilada por despliegue, fallo en `bad`, reversión ↺, mediana punteada, tooltip, teclado y «Ver tabla»
- [ ] 2.2 Tarjeta 14c encima de la tabla de 14, contra la API
- [ ] 2.3 Prueba `node --test` de `lib/tiempos.ts` (indicadores de la cabecera)

## 3. Cierre

- [ ] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro
- [ ] 3.2 Contrato `metricas.md` con la respuesta final; `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
