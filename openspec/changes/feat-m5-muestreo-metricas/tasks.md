# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Muestreo

- [ ] 1.1 Puerto, adaptador y doble; `MuestreoMetricas` y purga
- [ ] 1.2 Pruebas: «Muestra de un contenedor Saludable», «Un Detenido no se muestrea», «Purga de 24 h»

## 2. Lectura

- [ ] 2.1 `GET /proyectos/:id/metricas` y `docs/contratos/metricas.md` (día 3)
- [ ] 2.2 Pruebas: «Promedio cada 30 min», «Despliegues en la ventana»

## 3. Tiempos

- [ ] 3.1 `tiemposDe` sobre `EtapaDespliegue` (día 4)
- [ ] 3.2 Pruebas: «Reversión sin construcción», «Fallido en Construcción»

## 4. Cierre

- [ ] 4.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 4.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 4.3 `/opsx-archive` después del merge
