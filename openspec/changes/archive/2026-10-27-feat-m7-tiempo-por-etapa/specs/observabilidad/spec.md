# Spec Delta

## ADDED Requirements

### Requirement: Tiempo por etapa

El cliente SHALL ver la duración por etapa de los últimos 14 despliegues de su proyecto, con la etapa donde falló cada Fallido y las reversiones sin Construcción, y la mediana de los Saludables.

#### Scenario: Mediana

- **WHEN** hay 11 despliegues Saludables
- **THEN** ve la mediana de sus duraciones totales

#### Scenario: Dónde falló

- **WHEN** #11 falló en Construcción
- **THEN** su columna termina en Construcción marcada como fallo

#### Scenario: Reversión

- **WHEN** #7 fue una reversión
- **THEN** su columna no tiene Recepción ni Construcción y lleva ↺
