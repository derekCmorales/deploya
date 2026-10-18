# Spec Delta

## MODIFIED Requirements

### Requirement: Cuotas aplicadas

El sistema SHALL impedir crear proyectos por encima del límite del plan y lanzar construcciones por encima del límite mensual, y SHALL exponer el consumo del período. El período de construcciones SHALL ser el mes calendario en UTC.

#### Scenario: Límite de proyectos

- **WHEN** un cliente en Starter con 3 proyectos intenta crear otro
- **THEN** el alta se rechaza y se ofrece cambiar de plan

#### Scenario: Límite de construcciones

- **WHEN** un cliente en Sandbox ya usó sus 30 construcciones del mes
- **THEN** la siguiente construcción se rechaza hasta el día 1 del mes siguiente (UTC)

### Requirement: Seed idempotente

El seed SHALL crear o actualizar por clave natural los cuatro planes v4.1, el administrador (`ADMIN_CORREO`, `ADMIN_CLAVE` obligatoria) y `cliente@deploya.app`, ambos activos y con Sandbox, sin reescribir contraseñas existentes. Para demostrar los bloqueos antes del ciclo §4.4 SHALL crear además `vencida@deploya.app` y `suspendida@deploya.app`, activos, con la contraseña de `cliente@deploya.app` y en Starter de 30 días con `vence` en el pasado (Vencida y Suspendida), solo mientras su suscripción siga siendo la Sandbox recién asignada.

#### Scenario: Dos corridas

- **WHEN** el seed corre dos veces
- **THEN** quedan los mismos registros

#### Scenario: Falta la clave del administrador

- **WHEN** el seed corre sin `ADMIN_CLAVE`
- **THEN** falla con un mensaje claro y no escribe nada

#### Scenario: vencida@ queda en Starter con la suscripción Vencida

- **WHEN** el seed corre por primera vez
- **THEN** `vencida@deploya.app` tiene Starter Vencida con `vence` hace 2 días

#### Scenario: suspendida@ queda en Starter con la suscripción Suspendida

- **WHEN** el seed corre por primera vez
- **THEN** `suspendida@deploya.app` tiene Starter Suspendida desde el fin de la gracia de 5 días

#### Scenario: una suscripción que ya no es la Sandbox inicial no se reescribe

- **WHEN** una cuenta de demo ya cambió de plan y el seed corre de nuevo
- **THEN** su suscripción queda igual
