# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Plantillas y puerto (Eddy)

- [x] 1.1 Cuatro plantillas sobre `PlantillaCorreo` con los textos de 24b (ganchos opcionales en el esqueleto; verificación y recuperación sin cambios)
- [x] 1.2 `AvisosPuerto` y `AvisosCorreo`; exportados por `AvisosModule` (sin ciclo con identidad); `DirectorioCuentas` exportado por identidad; `docs/contratos/avisos.md` v1.1
- [x] 1.3 Pruebas: «Despliegue saludable», «Despliegue fallido», «Error del SMTP»; plantillas, formatos y textos de Por vencer y Suspendida para SP-04

## 2. Gancho del pipeline (Derek, SP-08)

- [ ] 2.1 `AvisoDespliegueOyente` en `OYENTES_DESPLIEGUE`
- [ ] 2.2 Pruebas: «Cancelado no avisa», el aviso de Saludable y Fallido llega al puerto

## 3. Gancho del ciclo (Javier, SP-04)

- [ ] 3.1 Llamar a `suscripcionCambio` en la transición
- [ ] 3.2 Pruebas: «Por vencer avisa una vez», «Suspendida avisa una vez»

## 4. Demo

- [ ] 4.1 Los cuatro correos llegan a un buzón real desde el VPS

## 5. Cierre

- [ ] 5.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro, si hay UI
- [ ] 5.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [ ] 5.3 `/opsx-archive` después del merge
