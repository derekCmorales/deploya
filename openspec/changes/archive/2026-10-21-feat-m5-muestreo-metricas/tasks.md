# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Muestreo

- [x] 1.1 Puerto, adaptador y doble; `MuestreoMetricas` y purga
- [x] 1.2 Pruebas: «Muestra de un contenedor Saludable», «Un Detenido no se muestrea», «Purga de 24 h»

## 2. Lectura

- [x] 2.1 `GET /proyectos/:id/metricas` y `docs/contratos/metricas.md` (día 3)
- [x] 2.2 Pruebas: «Promedio cada 30 min», «Despliegues en la ventana»

## 3. Tiempos

- [x] 3.1 `tiemposDe` sobre `EtapaDespliegue` (día 4)
- [x] 3.2 Pruebas: «Reversión sin construcción», «Fallido en Construcción»

## 4. Correcciones de la revisión (contrato 1.1)

- [x] 4.1 `pico` sobre muestras crudas y `aviso` en `RespuestaMetricas`; pruebas «Pico de la ventana» y «serie vacía si el contenedor no corre»
- [x] 4.2 Cubos de 24 h alineados a :00/:30 UTC; prueba de que `en` cae en :00 o :30
- [x] 4.3 Muestreo en lotes de `CONTENEDORES_EN_PARALELO`; prueba con más contenedores que el lote
- [x] 4.4 `docs/contratos/metricas.md` en versión 1.1 con historial

## 5. Cierre

- [x] 5.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI — sin UI en este change
- [x] 5.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [x] 5.3 `/opsx-archive`: archivado en el PR #40 antes del merge
