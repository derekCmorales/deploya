# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. API

- [ ] 1.1 `POST /instalacion/codigo` y `/administrador` con el hash del código
- [ ] 1.2 Correo de prueba y «sin correo»
- [ ] 1.3 Pruebas: «Código válido», «Código vencido», «Código usado», «Correo de prueba», «SMTP rechazado», «Ya configurada»

## 2. Web

- [ ] 2.1 `/configurar` con los cinco pasos y la redirección desde la raíz mientras no esté configurada
- [ ] 2.2 Pruebas `node --test` de la máquina de pasos

## 3. Cierre

- [ ] 3.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 3.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 3.3 `/opsx-archive` después del merge
