# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Gráficas

- [x] 1.1 Piezas compartidas y `GraficaUso` (normal y compacta) en `/sistema`
- [x] 1.2 Pruebas `node --test`: «Un hueco corta la línea», «Tono de aviso desde el 80 %», «Los eventos caen en su hora»

## 2. Pantallas

- [x] 2.1 Pestaña Métricas (16) con banner, `Segmented`, leyenda y «Ver tabla»
- [x] 2.2 Tarjeta 13c en el Resumen
- [x] 2.3 Pruebas: «Memoria cerca del límite», «Despliegue en la ventana», «Sin datos», «Hover y teclado», «Resumen de 24 h»

## 3. Cierre

- [x] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
