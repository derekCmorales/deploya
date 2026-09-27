# 0004 — Versionado inmutable y reversión sin reconstruir

- **Estado:** Propuesto
- **Fecha:** 2026-09-27
- **Autor:** @derekCmorales · **Módulos:** M4, M5 (consumidor: M7 en pantalla 14)
- **Change de OpenSpec:** `feat/m5-reversion-instantanea`

## Contexto

El curso pidió enfocar el versionamiento y la reversión. Redesplegar un commit viejo reconstruye (minutos, consume cuota, puede fallar por dependencias que cambiaron). Hay un solo nodo con disco limitado.

## Decisión

Cada construcción exitosa registra un **`Artefacto` inmutable** `deploya/<subdominio>:<n>` con digest, tamaño, commit y receta. Se conservan en el nodo los **5 más recientes** por proyecto más el activo; al resto, `RetencionArtefactos` (Observer de `DespliegueTerminado`) les borra la imagen y los marca `disponible = false`. **Revertir** crea un despliegue nuevo con `disparador = reversion` que arranca en *Revirtiendo*, salta Recepción y Construcción (`omitida`) y sigue Ejecución → Enrutamiento → Operación con la misma conmutación sin corte. No consume construcciones del mes. Usa los límites y las variables **vigentes**, no los de entonces.

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Imágenes locales retenidas (5)** (elegida) | Segundos en vez de minutos; sin registro extra | Retención limitada por disco del nodo |
| Registro de imágenes (registry:2) | Retención larga | Un servicio más, push y pull en cada despliegue |
| Solo redesplegar el commit | Nada nuevo | Lento, consume cuota, no es reversión |
| Mantener vivo el contenedor anterior | Reversión instantánea real | Duplica memoria de cada cliente; rompe los límites del plan |

## Consecuencias

- **SRP:** `PoliticaRetencion` (pura) decide qué retirar; `RetencionArtefactos` ejecuta; `ReversionService` valida y crea.
- La máquina de estados gana `Revirtiendo` (`TransicionesDespliegue`), la web gana la insignia y la acción en 14 (contrato v2).
- Deuda aceptada: si el disco se llena antes de 5 versiones, la retención no lo detecta; se documenta en el manual técnico.
