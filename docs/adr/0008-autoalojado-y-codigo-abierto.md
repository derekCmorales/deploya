# 0008 — Deploya de código abierto y autoalojado con un modo de instalación

- **Estado:** Propuesto (pasa a Aceptado al mergear `feat-m2-modo-autoalojado`). `chore-open-source` elige AGPL-3.0; el estado sigue Propuesto hasta ese merge.
- **Fecha:** 2026-10-20
- **Autor:** @derekCmorales · **Módulos:** M1, M2, M9, transversal
- **Change de OpenSpec:** `feat/m2-modo-autoalojado`, `chore/open-source`, `feat/instalador-autoalojado`

## Contexto

Deploya es un PaaS en la nube con planes y pago simulado. En la entrega final se califica el producto, y el curso ha insistido en la libertad frente a los PaaS cerrados. Coolify y otros proyectos publican el código y dejan instalar la plataforma en un servidor propio, mientras su nube conserva los planes. La arquitectura de puertos ya separa lo que depende del cobro (M2) del resto (alta, motor, reversión, Traefik, correos).

Restricciones: un sprint, cuatro personas, no romper la nube ni los contratos del núcleo, y nada de cobrar por usar tu propio servidor.

## Decisión

Publicamos el repositorio con licencia AGPL-3.0 (elegida en `chore-open-source`; el texto está en `LICENSE`) y agregamos `MODO_INSTALACION=nube|autoalojado`. El estado de este ADR sigue Propuesto hasta el merge de `feat-m2-modo-autoalojado`. Cada módulo registra la implementación de sus puertos según el modo (Strategy): en autoalojado hay un plan «Autoalojado» sin cobro ni vencimiento, los límites por proyecto los fija el administrador, no corre el ciclo §4.4, el primer administrador se crea con un código de un solo uso que imprime el instalador y el registro puede ser abierto, con invitación o cerrado. `scripts/instalar.sh`, `respaldar.sh` y `actualizar.sh` hacen la instalación y la operación con un comando. Contrato: [instalacion.md](../contratos/instalacion.md).

## Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Mantener los planes en autoalojado | Cero cambios en M2 | Cobrar por tu propio servidor no tiene sentido; confunde |
| `if (modo === …)` en cada servicio | Rápido | Viola Open/Closed; el modo se filtra por todo el código |
| Rama o fork aparte para autoalojado | Aísla | Dos productos que divergen; doble mantenimiento |
| **Strategy por puerto según el modo** | Una base de código; se prueba cada implementación sola | Más clases pequeñas que registrar |
| Licencia Apache-2.0 | Simple, la usa Coolify | Permite una nube cerrada con nuestro código |
| Licencia AGPL-3.0 (elegida en `chore-open-source`) | Quien ofrezca Deploya como servicio publica sus cambios | Algunas empresas la evitan. El ADR sigue Propuesto hasta el merge de `feat-m2-modo-autoalojado` |

## Consecuencias

- Más fácil: demostrar el producto en cualquier servidor; contribuciones externas; la nube no cambia.
- Más difícil: la seguridad del servidor queda en manos de quien instala (contenedores sin privilegios y con límites, como hoy; se documenta en `SECURITY.md`); hay que mantener los scripts y probarlos con `shellcheck`.
- Deuda aceptada: sin actualizaciones automáticas ni multi-nodo; respaldos locales (el administrador los copia fuera).
- SOLID: Open/Closed y Dependency Inversion (los servicios dependen de `CatalogoPlanes`, `PoliticaCuotas`, `AltaPrimerUsuario`, `PoliticaRegistroPuerto`, no del modo). Patrones: Strategy, Composite (`SaludInstalacion`), Pipeline en el instalador.
- El repositorio **ya es público** (confirmado el 20 de octubre). Por eso `gitleaks` sobre todo el historial va primero en `chore-open-source`: cualquier secreto que aparezca ya está expuesto y se **rota de inmediato** (token del DNS, SMTP, `CLAVE_CIFRADO_VARIABLES` del VPS); no se reescribe la historia de `main`.
