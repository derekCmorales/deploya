# Spec Delta

## MODIFIED Requirements

### Requirement: Acciones sobre despliegues

El cliente SHALL poder cancelar un despliegue en curso, reintentar uno fallido y redesplegar un commit anterior. Redesplegar **reconstruye** ese commit con su `Dockerfile` o receta y consume una construcción. Volver a una versión **sin reconstruir** es la reversión de M5 (spec `orquestacion`), que no consume construcciones. Cancelar SHALL estar permitido solo en Encolado, Construyendo y Revirtiendo; reintentar, solo desde Fallido.

#### Scenario: Cancelar

- **WHEN** el cliente cancela un despliegue en Encolado o Construyendo
- **THEN** el trabajo se detiene, el despliegue queda Cancelado y la versión activa no cambia

#### Scenario: Cancelar encolado

- **WHEN** el cliente cancela un despliegue que sigue Encolado
- **THEN** sale de la cola sin clonar ni construir y queda Cancelado

#### Scenario: Cancelar tarde

- **WHEN** el cliente cancela un despliegue en Aprovisionando
- **THEN** responde 409 `ya-no-se-puede-cancelar` y el despliegue sigue

#### Scenario: Reintentar un fallido

- **WHEN** el cliente reintenta el despliegue #11, que quedó Fallido
- **THEN** se crea un despliegue nuevo con el mismo commit y disparador `reintento`, y cuenta como una construcción del mes

#### Scenario: Reintentar uno saludable

- **WHEN** el cliente reintenta un despliegue Saludable
- **THEN** responde 409 y no se crea nada

#### Scenario: Redesplegar reconstruye

- **WHEN** el cliente redespliega el commit del despliegue #12
- **THEN** se crea un despliegue nuevo por construcción de ese commit y cuenta como una construcción del mes

#### Scenario: Commit desconocido

- **WHEN** el cliente pide redesplegar un commit que nunca se desplegó en el proyecto
- **THEN** responde 409 `commit-desconocido`
