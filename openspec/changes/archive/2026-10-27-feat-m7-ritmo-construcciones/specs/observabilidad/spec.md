# Spec Delta

## ADDED Requirements

### Requirement: Ritmo de construcciones

Mi suscripción SHALL mostrar las construcciones acumuladas por día del mes calendario contra la cuota y una proyección al cierre al ritmo actual. La reversión SHALL NOT contar.

#### Scenario: Proyección en zona de aviso

- **WHEN** van 84 construcciones el día 20 de un mes de 31 con cuota 150
- **THEN** ve «~130» al cierre marcado como en zona de aviso

#### Scenario: Se acaba antes

- **WHEN** la proyección pasa la cuota
- **THEN** la frase dice el día en que se acaban las construcciones

#### Scenario: Primer día

- **WHEN** es el día 1 del mes
- **THEN** no se dibuja proyección
