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
