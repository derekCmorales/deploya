# Spec Delta

## MODIFIED Requirements

### Requirement: Consumo del período

El sistema SHALL exponer el consumo del período (proyectos y construcciones frente al límite del plan) para Mi suscripción (M2) y la actividad de despliegues de las últimas 12 semanas. El período SHALL ser el mes calendario UTC, el mismo que usa el bloqueo de construcciones, y la reversión SHALL NOT contar como construcción.

#### Scenario: Consumo cerca del límite

- **WHEN** el cliente abre Mi suscripción
- **THEN** ve proyectos y construcciones usados frente al límite del plan y la fecha en que se reinicia el período

#### Scenario: Mes nuevo

- **WHEN** el cliente hizo 28 construcciones en septiembre y abre Mi suscripción el 1 de octubre (UTC)
- **THEN** ve 0 construcciones usadas y «Se reinicia el 1 nov»

#### Scenario: Actividad de 12 semanas

- **WHEN** el cliente abre el resumen de un proyecto con 38 despliegues en las últimas 12 semanas, 2 fallidos
- **THEN** ve el mapa de 84 días con «12 semanas · 38 despliegues · 2 con fallo»
