# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Instalador (SP-16)

- [x] 1.1 Cinco etapas, estado y bitácora; secretos y `.env` 600; código de configuración
- [x] 1.2 Pruebas: «Servidor limpio», «DNS que no apunta», «Retomar»

## 2. Operación (SP-19)

- [x] 2.1 `respaldar.sh` y `actualizar.sh` con su JSON de estado
- [x] 2.2 Pruebas: «Actualizar sin cortar», «Volver», «Respaldo sin la clave»

## 3. CI

- [x] 3.1 `shellcheck` en el workflow: hecho por Derek (acordado con Eddy), job «Scripts (shellcheck)» en `ci.yml`. Las pruebas de shell corren con `node --test` dentro de `pnpm test` («Build y pruebas»), con dobles de `docker`, `git` y `curl`: no hace falta bats.

## 4. Cierre

- [x] 4.1 Sin UI web: la salida es la terminal (ficha 30). No hay pantalla que revisar en claro y oscuro.
- [x] 4.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde. No hay puertos ni clases nuevas: el diagrama no cambia. `pnpm check` pasó.
- [x] 4.3 `/opsx-archive`: archivado en el PR #42 antes del merge
