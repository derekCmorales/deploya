## MODIFIED Requirements

### Requirement: Configuración y eliminación

El cliente SHALL poder cambiar nombre (no cambia el subdominio), repositorio, rama, ruta del `Dockerfile` y puerto. Eliminar SHALL exigir escribir el nombre del proyecto y SHALL pedir a M5 detener y borrar contenedor e imágenes. Eliminar SHALL liberar el cupo del plan aunque el último despliegue haya fallado.

#### Scenario: Eliminar proyecto

- **WHEN** el cliente escribe el nombre del proyecto y confirma
- **THEN** se detiene el servicio y se borran contenedor, imágenes, variables e historial

#### Scenario: Confirmación distinta

- **WHEN** el nombre escrito no coincide con el del proyecto
- **THEN** se rechaza y el proyecto se conserva

#### Scenario: Proyecto ajeno o inexistente

- **WHEN** el cliente intenta eliminar un proyecto que no es suyo o que no existe
- **THEN** se responde como no encontrado y no se borra nada
