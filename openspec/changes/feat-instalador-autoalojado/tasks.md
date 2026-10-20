# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Instalador (SP-16)

- [x] 1.1 Cinco etapas, estado y bitácora; secretos y `.env` 600; código de configuración
- [x] 1.2 Pruebas: «Servidor limpio», «DNS que no apunta», «Retomar»

## 2. Operación (SP-19)

- [x] 2.1 `respaldar.sh` y `actualizar.sh` con su JSON de estado
- [x] 2.2 Pruebas: «Actualizar sin cortar», «Volver», «Respaldo sin la clave»

## 3. CI

- [ ] 3.1 `shellcheck` y `bats` en el workflow (con Eddy). Este PR no toca `.github/workflows`. `shellcheck -x` pasa en local (`scripts/.shellcheckrc`). Las seis pruebas corren con `node --test` dentro de `pnpm test`, sin bats ni Docker, para no exigir un cambio de CI.

## 4. Cierre

- [x] 4.1 Sin UI web: la salida es la terminal (ficha 30). No hay pantalla que revisar en claro y oscuro.
- [x] 4.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde. No hay puertos ni clases nuevas: el diagrama no cambia. `pnpm check` pasó.
- [ ] 4.3 `/opsx-archive` después del merge
