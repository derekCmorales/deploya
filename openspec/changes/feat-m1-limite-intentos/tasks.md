# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [x] 1.1 Mover `LimiteIntentos` a `identidad/dominio/`, parametrizarlo, agregar `limpiar` y el error `DemasiadosIntentos`; el código de configuración sigue igual
- [x] 1.2 Pruebas de la regla: «Inicio correcto limpia el conteo», «La ventana vence»
- [x] 1.3 Aplicar los límites en sesión, registro, reenvío y recuperación; 429 con `Retry-After` en el filtro
- [x] 1.4 Pruebas: «Quinto fallo bloquea el inicio de sesión», «Registro en masa», «Correos sin revelar la cuenta»

## 2. Web

- [x] 2.1 `Banner` en 01 y 03 con los minutos de espera (`segundos`, el mismo valor que `Retry-After`; 04 no recibe 429, design.md § 7)
- [x] 2.2 Prueba `node --test`: «Aviso en la pantalla»

## 3. Cierre

- [x] 3.1 Revisión de 01 y 03 en claro y oscuro (04 no cambia: no recibe 429)
- [x] 3.2 `clases-unificado.mmd` y `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
