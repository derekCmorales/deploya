# Kit — Derek (arquitecto e integrador)

[@derekCmorales](https://github.com/derekCmorales) · extra: ADR, entorno, revisión transversal, despliegue al VPS.

Alcance: [alcance.md](../../alcance.md) · Entregas: [plan-avances.md](../../plan-avances.md).

## Tus módulos

| Id | Qué entra (núcleo v4.1) | Código |
|---|---|---|
| M4 | Cola BullMQ, clonar, `docker build` con el `Dockerfile` del cliente, artefacto `#n` con digest, bitácora; cancelar, reintentar, redesplegar (reconstruye) | `apps/api/src/modules/construccion` |
| M5 | Contenedor con `--cpus` / `--memory` del plan, sin privilegios, red propia; verificación de salud; reiniciar, detener, borrar; detener por suspensión | `apps/api/src/modules/orquestacion` |
| M6 | `<proyecto>.deploya.app` vía Traefik, HTTPS comodín, conmutación sin corte | `apps/api/src/modules/enrutamiento` |
| M8 | **Fuera de alcance**: queda el stub `health` | `apps/api/src/modules/herramientas` |

También: `apps/api/src/adapters/`, `docker-compose.yml`, Dockerfiles, VPS.

## Tus pantallas

El motor no tiene pantallas propias: hace **reales** las de Eduardo. Lo que tu API tiene que alimentar:

| # | Qué necesita del motor |
|---|---|
| 12 | Etapa actual, duración por etapa, líneas de bitácora desde una posición, cancelar |
| 12b | Digest y tamaño de imagen, URL, vencimiento del certificado, contenedor anterior detenido |
| 12c | Código de salida, línea del error, versión que sigue sirviendo, reintentar |
| 13 | Versión activa, recursos aplicados, reiniciar, detener |
| 14 | Historial con digest y duración, redesplegar |
| 19b | Borrar contenedor e imágenes |

Estados de despliegue: Encolado, Construyendo, Aprovisionando, Publicando, Saludable, Fallido, Cancelado, Detenido (≠ §4.4 de suscripción).

## Qué entregas

| Avance | Historias | Pts |
|---|---|---|
| **A1 (30 %)** | ENG-01 compose con trabajador, Traefik y Mailpit · M4-01 cola + build + bitácora + API · M5-01 contenedor con límites + salud | 10 |
| A2 (50 %) | M6-01 subdominio · M5-02 conmutación, reiniciar, detener · M5-03 bloqueos por suscripción y cuota | 7 |
| A3 (80 %) | M4-02 cancelar, reintentar, redesplegar · M6-02 VPS con HTTPS · ADR | 10 |
| Final | DOC-03 diseño final y manual técnico | 3 |

Detalle del Avance 1 y lo que presentas: [plan-avances.md § Derek](../../plan-avances.md#derek--motor-10-pts).

**Dependencia crítica:** el contrato ya está en [docs/contratos/despliegues.md](../../contratos/despliegues.md); tu implementación debe cumplirlo para que Eduardo conecte **Desplegar** el martes. También migraste el design system v4.1 (WEB-01, hecho).

## Fuera de alcance · solo si da el tiempo

Reversión instantánea sin reconstruir · detección de stack sin `Dockerfile` · dominios personalizados · métricas en vivo (`docker stats`) · asistente e integración M8.

## Qué no tocas en solitario

Auth (Eddy), pagos (Javier), pantallas de proyecto (Eduardo). Revisa esos PRs; no los sustituyas.

## Diagramas

1. [m4-m5-m6-estados-despliegue.mmd](../../diagramas/m1-m10/m4-m5-m6-estados-despliegue.mmd) — Revirtiendo queda fuera; se agrega Cancelado
2. [m4-m5-m6-secuencia-despliegue.mmd](../../diagramas/m1-m10/m4-m5-m6-secuencia-despliegue.mmd)
3. [m4-m5-m6-secuencia-reversion.mmd](../../diagramas/m1-m10/m4-m5-m6-secuencia-reversion.mmd) — fuera de alcance
4. [m4-m5-m6-actividad-motor.mmd](../../diagramas/m1-m10/m4-m5-m6-actividad-motor.mmd)
5. [m4-m5-m6-componentes.mmd](../../diagramas/m1-m10/m4-m5-m6-componentes.mmd)
6. [m8-herramientas-componentes.mmd](../../diagramas/m1-m10/m8-herramientas-componentes.mmd) — fuera de alcance

C4 (tú lo mantienes único): [compartido/](../../diagramas/compartido/).

## Puertos (DIP)

`ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto` — sin `I`. Los stubs actuales se quedan para pruebas; el adaptador real habla con Docker y Traefik.

## ADR que tocan

`docs/adr/`: `Dockerfile` obligatorio, BullMQ para la cola, polling en vez de WebSocket, Traefik con certificado comodín.

## Specs OpenSpec

- [openspec/specs/motor-construccion/spec.md](../../../openspec/specs/motor-construccion/spec.md)
- [openspec/specs/orquestacion/spec.md](../../../openspec/specs/orquestacion/spec.md)
- [openspec/specs/enrutamiento/spec.md](../../../openspec/specs/enrutamiento/spec.md)
- [openspec/specs/herramientas/spec.md](../../../openspec/specs/herramientas/spec.md) — stub

Rama `feat/m4-<slug>`. Commit `feat(m4):`.

## Reviewer

Tú en motor, adapters y compose. Segundo reviewer en Prisma (con Javier) y en CI (con Eddy).
