# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Instalador (SP-16)

- [ ] 1.1 Cinco etapas, estado y bitácora; secretos y `.env` 600; código de configuración
- [ ] 1.2 Pruebas: «Servidor limpio», «DNS que no apunta», «Retomar»

## 2. Operación (SP-19)

- [ ] 2.1 `respaldar.sh` y `actualizar.sh` con su JSON de estado
- [ ] 2.2 Pruebas: «Actualizar sin cortar», «Volver», «Respaldo sin la clave»

## 3. CI

- [ ] 3.1 `shellcheck` y `bats` en el workflow (con Eddy)

## 4. Cierre

- [ ] 4.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 4.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 4.3 `/opsx-archive` después del merge
