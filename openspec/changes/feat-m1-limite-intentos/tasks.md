# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [ ] 1.1 Mover `LimiteIntentos` a `identidad/dominio/`, parametrizarlo, agregar `limpiar` y el error `DemasiadosIntentos`; el código de configuración sigue igual
- [ ] 1.2 Pruebas de la regla: «Inicio correcto limpia el conteo», «La ventana vence»
- [ ] 1.3 Aplicar los límites en sesión, registro, reenvío y recuperación; 429 con `Retry-After` en el filtro
- [ ] 1.4 Pruebas: «Quinto fallo bloquea el inicio de sesión», «Registro en masa», «Correos sin revelar la cuenta»

## 2. Web

- [ ] 2.1 `Banner` en 01, 03 y 04 con los minutos de `Retry-After`
- [ ] 2.2 Prueba `node --test`: «Aviso en la pantalla»

## 3. Cierre

- [ ] 3.1 Revisión de 01, 03 y 04 en claro y oscuro
- [ ] 3.2 `clases-unificado.mmd` y `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
