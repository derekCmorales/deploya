# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su prueba con el mismo nombre, que importa código de producción. Cero datos fijos en pantalla y cero `any`. Guía paso a paso: [C1 en docs/handoff/prompt-eduardo-correcciones-m7.md](../../../docs/handoff/prompt-eduardo-correcciones-m7.md#c1--pr-45--métricas-16-y-13c--rama-featm7-metricas).

## 1. Gráficas

- [x] 1.1 Piezas compartidas y `GraficaUso` (normal y compacta): eje X por tiempo, tramo de aviso en `warn`, área al 5 %, ejes, hover con puntero y teclado, tooltip con versión
- [x] 1.2 `GraficaUso` en `/sistema` (normal, compacta y sin datos)
- [x] 1.3 Pruebas `node --test`: «Un hueco corta la línea», «Tono de aviso desde el 80 %», «Los eventos caen en su hora»

## 2. Pantallas

- [x] 2.1 `lib/metricas.ts`: tipo de la respuesta de `GET /proyectos/:id/metricas` y `vistaMetricas` (puro)
- [x] 2.2 Pestaña Métricas (16) contra la API: `Segmented`, banner desde el 80 %, leyenda, dos `Card`, «Ver tabla», `Skeleton`, error y «El contenedor no está corriendo»
- [x] 2.3 Tarjeta 13c en el Resumen contra la API
- [x] 2.4 Pruebas: «Memoria cerca del límite», «Despliegue en la ventana», «Sin datos», «Hover y teclado», «Resumen de 24 h», «Resumen sin muestras»

## 3. Cierre

- [x] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro
- [x] 3.2 `pnpm check` en verde; PR con la plantilla llena
- [x] 3.3 `/opsx-archive` después del merge (archivado en el PR que cierra el sprint)
