# Spec Delta

## ADDED Requirements

### Requirement: Bloqueos por suscripción y cuota

Antes de crear un despliegue que construye, el sistema SHALL rechazarlo si la suscripción del dueño está Vencida o Suspendida, o si ya usó todas las construcciones de su plan en el mes calendario actual (UTC). La reversión no construye y SHALL quedar fuera de la cuenta. El rechazo SHALL ocurrir antes de crear el despliegue y llegar a la web con su código.

#### Scenario: Suscripción vencida bloquea el despliegue

- **WHEN** un cliente con la suscripción Vencida pide desplegar
- **THEN** se rechaza con `suscripcion-no-permite`, no se crea ningún despliegue y se ofrece renovar

#### Scenario: Suscripción suspendida bloquea el despliegue

- **WHEN** un cliente con la suscripción Suspendida pide desplegar
- **THEN** se rechaza con `suscripcion-no-permite` y no se crea ningún despliegue

#### Scenario: Cuota de construcciones agotada

- **WHEN** un cliente en Sandbox ya hizo 30 construcciones en el mes y pide otra
- **THEN** se rechaza con `cuota-construcciones-agotada` y se ofrece cambiar de plan

#### Scenario: Dentro de la cuota

- **WHEN** un cliente con la suscripción Activa y construcciones disponibles pide desplegar
- **THEN** el despliegue se crea Encolado

#### Scenario: Mes nuevo, cuota nueva

- **WHEN** un cliente agotó sus construcciones en septiembre y pide desplegar el 1 de octubre (UTC)
- **THEN** el despliegue se crea Encolado

#### Scenario: La reversión no cuenta

- **WHEN** se cuentan las construcciones del mes
- **THEN** los despliegues con disparador `reversion` no se suman
