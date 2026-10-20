# Spec Delta

## ADDED Requirements

### Requirement: Tiempos por etapa

El motor SHALL exponer la duración de cada etapa de los últimos despliegues de un proyecto, con 0 en las etapas omitidas y la etapa donde terminó un Fallido.

#### Scenario: Reversión sin construcción

- **WHEN** el despliegue #7 fue una reversión
- **THEN** sus tiempos tienen Recepción y Construcción en 0

#### Scenario: Fallido en Construcción

- **WHEN** #11 falló en Construcción
- **THEN** sus tiempos marcan `falloEn: construccion` y las etapas siguientes en 0
