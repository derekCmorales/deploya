# Spec Delta

## ADDED Requirements

### Requirement: Métricas de contenedor

El trabajador SHALL tomar una muestra de CPU y memoria por minuto del contenedor activo Saludable de cada proyecto y SHALL purgar las muestras de más de 24 h. La API SHALL devolver la serie de 1 h (por minuto) o 24 h (promedio cada 30 min) con el límite aplicado y los despliegues que entraron en la ventana.

#### Scenario: Muestra de un contenedor Saludable

- **WHEN** pasa un minuto con api-tienda Saludable
- **THEN** queda una muestra con su CPU y memoria

#### Scenario: Un Detenido no se muestrea

- **WHEN** el proyecto está Detenido
- **THEN** no se guarda ninguna muestra

#### Scenario: Purga de 24 h

- **WHEN** hay muestras de hace 25 h
- **THEN** se borran en la siguiente corrida

#### Scenario: Promedio cada 30 min

- **WHEN** se piden 24 h
- **THEN** la serie trae 48 puntos promediados

#### Scenario: Despliegues en la ventana

- **WHEN** #14 se publicó hace 5 h
- **THEN** la respuesta incluye `{ version: 14 }` con su hora
