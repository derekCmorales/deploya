# Spec Delta

## MODIFIED Requirements

### Requirement: Configuración y eliminación

El cliente SHALL poder cambiar nombre (no cambia el subdominio), repositorio, rama, ruta del `Dockerfile` y puerto, con las mismas validaciones del alta. Los cambios SHALL aplicarse en el próximo despliegue, sin desplegar al guardar. Eliminar SHALL exigir escribir el nombre del proyecto y SHALL pedir a M5 detener y borrar contenedor e imágenes.

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
