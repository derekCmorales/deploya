# Spec Delta

## MODIFIED Requirements

### Requirement: Ciclo de vida §4.4

Una tarea diaria SHALL mover las suscripciones entre Activa, Por vencer (siete días o menos), Vencida (gracia de cinco días: entornos en línea, altas y despliegues bloqueados), Suspendida (contenedores detenidos vía M5, datos conservados) y Cancelada (treinta días suspendida). Sandbox SHALL NOT vencer. Cada corrida SHALL mover una suscripción como mucho un estado y SHALL ser idempotente. Al llegar a la fecha de vigencia con un descenso programado, SHALL aplicarse el plan nuevo. Renovar una suscripción Vencida o Suspendida SHALL dejarla Activa y, si estaba Suspendida, SHALL pedir a M5 que vuelva a arrancar sus contenedores.

#### Scenario: Por vencer

- **WHEN** a una suscripción Activa de Starter le quedan 7 días o menos
- **THEN** la tarea la pasa a Por vencer y los despliegues siguen permitidos

#### Scenario: Vencimiento sin renovar

- **WHEN** pasa la fecha de vigencia
- **THEN** el estado es Vencida: los entornos siguen en línea y los nuevos despliegues se bloquean

#### Scenario: Fin de la gracia

- **WHEN** pasan cinco días en Vencida sin renovar
- **THEN** el estado es Suspendida y M5 detiene los contenedores

#### Scenario: Treinta días suspendida

- **WHEN** una suscripción lleva 30 días en Suspendida
- **THEN** pasa a Cancelada y el código, las variables y el historial se conservan

#### Scenario: Sandbox no vence

- **WHEN** la tarea revisa una suscripción Sandbox creada hace un año
- **THEN** sigue Activa

#### Scenario: Descenso programado al vencer

- **WHEN** un cliente en Pro con descenso programado a Starter llega a la fecha de vigencia
- **THEN** la suscripción queda en Starter sin registrar ningún pago y se borra el descenso programado

#### Scenario: Dos corridas el mismo día

- **WHEN** la tarea corre dos veces con la misma fecha
- **THEN** la segunda corrida no cambia ningún estado

#### Scenario: Renovar una suscripción suspendida

- **WHEN** un cliente con la suscripción Suspendida renueva con un pago aprobado
- **THEN** la suscripción queda Activa con 30 días nuevos y M5 recibe el pedido de reanudar sus contenedores
