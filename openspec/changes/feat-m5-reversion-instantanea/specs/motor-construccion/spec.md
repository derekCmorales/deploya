# Spec Delta

## MODIFIED Requirements

### Requirement: Acciones sobre despliegues

El cliente SHALL poder cancelar un despliegue en curso, reintentar uno fallido y redesplegar un commit anterior. Redesplegar **reconstruye** ese commit con su `Dockerfile` o receta y consume una construcción. Volver a una versión **sin reconstruir** es la reversión de M5 (spec `orquestacion`), que no consume construcciones.

#### Scenario: Cancelar

- **WHEN** el cliente cancela un despliegue en Encolado o Construyendo
- **THEN** el trabajo se detiene, el despliegue queda Cancelado y la versión activa no cambia

#### Scenario: Redesplegar reconstruye

- **WHEN** el cliente redespliega el commit del despliegue #12
- **THEN** se crea un despliegue nuevo por construcción de ese commit y cuenta como una construcción del mes
