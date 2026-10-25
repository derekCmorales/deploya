# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre.

## 1. Plantillas y puerto (Eddy)

- [x] 1.1 Cuatro plantillas sobre `PlantillaCorreo` con los textos de 24b (ganchos opcionales en el esqueleto; verificación y recuperación sin cambios)
- [x] 1.2 `AvisosPuerto` y `AvisosCorreo`; exportados por `AvisosModule` (sin ciclo con identidad); `DirectorioCuentas` exportado por identidad; `docs/contratos/avisos.md` v1.1
- [x] 1.3 Pruebas: «Despliegue saludable», «Despliegue fallido», «Error del SMTP»; plantillas, formatos y textos de Por vencer y Suspendida para SP-04

## 2. Gancho del pipeline (Derek, SP-08)

- [x] 2.1 `AvisoDespliegueOyente` en `OYENTES_DESPLIEGUE` (el pipeline guarda la bitácora antes de anunciar un Fallido)
- [x] 2.2 Pruebas: «Cancelado no avisa», el aviso de Saludable y Fallido llega al puerto

## 3. Gancho del ciclo (Javier, SP-04)

- [x] 3.1 Llamar a `suscripcionCambio` en la transición
- [x] 3.2 Pruebas: «Por vencer avisa una vez», «Suspendida avisa una vez»

## 4. Demo

- [ ] 4.1 Los cuatro correos llegan a un buzón real desde el VPS — verificación manual de la demo (plan-avances § Qué se demuestra); no se puede probar desde CI

## 5. Cierre

- [x] 5.1 Revisión contra la ficha 24b: los textos de las cuatro plantillas los fijan sus pruebas (sin UI en la web)
- [x] 5.2 `clases-unificado.mmd` si cambió un puerto o una clase; `pnpm check` en verde
- [x] 5.3 `/opsx-archive` (se archiva en el PR que cierra SP-08)
