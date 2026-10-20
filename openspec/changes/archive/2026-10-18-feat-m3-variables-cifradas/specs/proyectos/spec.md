# Spec Delta

## MODIFIED Requirements

### Requirement: Variables cifradas

Las variables de entorno SHALL almacenarse cifradas en reposo (`valorCifrado`, AES-256-GCM) y mostrarse enmascaradas; solo el dueño SHALL poder ver un valor con «Mostrar». Los cambios SHALL aplicar en el próximo despliegue; el cliente puede guardar o guardar y desplegar. Las claves SHALL ser `MAYUSCULAS_Y_GUIONES_BAJOS` de hasta 128 caracteres; `PORT` es reservada. El alta (11c) SHALL aceptar variables.

#### Scenario: Guardar variable

- **WHEN** el cliente guarda una variable
- **THEN** el valor no se persiste en claro y el contenedor actual sigue con las anteriores

#### Scenario: Guardar y desplegar

- **WHEN** el cliente pulsa «Guardar y desplegar»
- **THEN** las variables se guardan y se crea un despliegue con disparador `variables`

#### Scenario: Clave inválida

- **WHEN** el cliente escribe una clave con minúsculas, espacios o `PORT`
- **THEN** se rechaza indicando la regla y no se guarda nada

#### Scenario: Mostrar valor

- **WHEN** el dueño pulsa «Mostrar» en una variable
- **THEN** ve el valor descifrado; para cualquier otro cliente el proyecto no existe (404)
