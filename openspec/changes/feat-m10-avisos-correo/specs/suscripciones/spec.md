# Spec Delta

## ADDED Requirements

### Requirement: Avisos del ciclo

El ciclo §4.4 SHALL avisar por `AvisosPuerto` solo en la transición a Por vencer (con fecha y precio del plan) y a Suspendida (con los contenedores detenidos).

#### Scenario: Por vencer avisa una vez

- **WHEN** la tarea diaria corre dos veces el mismo día con una suscripción que entró en Por vencer
- **THEN** se manda un solo correo «Tu plan Starter vence en 7 días»

#### Scenario: Suspendida avisa una vez

- **WHEN** una suscripción pasa a Suspendida con 3 contenedores
- **THEN** se manda un solo correo «Tu suscripción está suspendida» que dice que se detuvieron 3 contenedores
