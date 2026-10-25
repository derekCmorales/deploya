# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Datos (Javier)

- [x] 1.1 Migración `contrasenaCambiadaEn` y `datos-nucleo.md` v2

## 2. API y web (Eddy)

- [x] 2.1 Escribir la fecha al cambiar y al restablecer; `GET /identidad/cuenta` la devuelve
- [x] 2.2 05b con la fecha o «Nunca la has cambiado»
- [x] 2.3 Pruebas: «Fecha después de cambiarla», «Fecha después de restablecerla», «Nunca cambiada» (API y web)

## 3. Cierre

- [x] 3.1 Revisión contra la ficha 05b (posición junto al botón y textos); solo tokens, sirve en claro y oscuro
- [x] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [x] 3.3 `/opsx-archive` después del merge (PR #51)
