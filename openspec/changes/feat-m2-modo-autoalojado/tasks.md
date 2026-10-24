# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Datos

- [x] 1.1 Migración `ConfiguracionInstalacion` + `PoliticaRegistro`; seed por modo; `datos-nucleo.md` v2

## 2. Estrategias

- [x] 2.1 Puertos y sus dos implementaciones; registro por modo en los módulos
- [x] 2.2 Pruebas: «Nube por defecto», «Límites de la instalación», «Sin límite de proyectos», «El ciclo no corre»

## 3. Primer administrador y web

- [x] 3.1 `ConCodigoDeConfiguracion` y `GET /instalacion/modo`; navegación sin Suscripción
- [x] 3.2 Pruebas: «Sin cobro en autoalojado», «Sin código no hay administrador»

## 4. Cierre

- [ ] 4.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 4.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 4.3 `/opsx-archive` después del merge
