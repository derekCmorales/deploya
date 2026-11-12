# Spec Delta

## MODIFIED Requirements

### Requirement: Variables cifradas

Las variables de entorno SHALL almacenarse cifradas en reposo (`valorCifrado`, AES-256-GCM) y mostrarse enmascaradas; solo el dueño SHALL poder ver un valor con «Mostrar». Los cambios SHALL aplicar en el próximo despliegue; el cliente puede guardar o guardar y desplegar. Las claves SHALL ser `MAYUSCULAS_Y_GUIONES_BAJOS` de hasta 128 caracteres; `PORT` es reservada. Un proyecto SHALL admitir hasta 150 variables (sin contar las que inyectan sus recursos de datos). El alta (11c) SHALL aceptar variables.

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

#### Scenario: Hasta 150 variables

- **WHEN** el cliente guarda 150 variables y luego intenta 151
- **THEN** las 150 se aceptan y la 151 se rechaza con `demasiadas-variables`

### Requirement: Configuración y eliminación

El cliente SHALL poder cambiar nombre (no cambia el subdominio), repositorio, rama, ruta del `Dockerfile`, puerto y comando de inicio (`comandoInicio`, hasta 512 caracteres, `null` o vacío = el `CMD` de la imagen), con las mismas validaciones del alta. `PATCH /proyectos/:id` SHALL devolver `comandoInicio` en la vista de configuración. Los cambios SHALL aplicarse en el próximo despliegue, sin desplegar al guardar. Eliminar SHALL exigir escribir el nombre del proyecto y SHALL pedir a M5 detener y borrar contenedor e imágenes. Eliminar SHALL liberar el cupo del plan aunque el último despliegue haya fallado.

#### Scenario: Renombrar no cambia el subdominio

- **WHEN** el cliente renombra `hola-deploya` a «Hola demo»
- **THEN** el nombre cambia y la app sigue respondiendo en `hola-deploya.localhost`

#### Scenario: Cambiar la rama aplica en el próximo despliegue

- **WHEN** el cliente cambia la rama a `sin-dockerfile` y guarda
- **THEN** no se crea ningún despliegue y el siguiente que pida clona `sin-dockerfile`

#### Scenario: Rama inexistente

- **WHEN** el cliente guarda una rama que no existe en el repositorio
- **THEN** se rechaza con `RamaInexistente` y nada cambia

#### Scenario: Nombre repetido

- **WHEN** el cliente usa el nombre de otro de sus proyectos
- **THEN** se rechaza con `NombreRepetido`

#### Scenario: Eliminar proyecto

- **WHEN** el cliente escribe el nombre del proyecto y confirma
- **THEN** se detiene el servicio y se borran contenedor, imágenes, variables e historial

#### Scenario: Confirmación distinta

- **WHEN** el nombre escrito no coincide con el del proyecto
- **THEN** se rechaza y el proyecto se conserva

#### Scenario: Proyecto ajeno o inexistente

- **WHEN** el cliente intenta eliminar un proyecto que no es suyo o que no existe
- **THEN** se responde como no encontrado y no se borra nada

#### Scenario: Comando de inicio

- **WHEN** el cliente guarda `comandoInicio` = `node dist/worker-optimizer.main.js` y luego `null`
- **THEN** la vista devuelve el comando y después `null`, y el siguiente despliegue usa el `CMD` de la imagen

#### Scenario: Comando de inicio demasiado largo

- **WHEN** el comando pasa de 512 caracteres
- **THEN** se rechaza con `comando-invalido` (400)

#### Scenario: Comando con comilla sin cerrar

- **WHEN** el comando tiene una comilla sin cerrar o no es texto
- **THEN** se rechaza con `comando-invalido` (400)

## ADDED Requirements

### Requirement: Subdominios reservados para datos

Un proyecto nuevo SHALL NOT tomar un subdominio que termine en `-s3`: esa etiqueta es la ruta pública del almacenamiento S3 de otro proyecto (`<subdominio>-s3.<dominio>`).

#### Scenario: Subdominio que choca con una ruta S3

- **WHEN** el cliente crea un proyecto llamado «tienda-s3»
- **THEN** el alta se rechaza con `subdominio-en-uso` y no se guarda nada
