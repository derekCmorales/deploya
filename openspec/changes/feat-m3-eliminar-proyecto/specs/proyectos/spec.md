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

### Requirement: Límite y estado de la suscripción

El alta SHALL bloquearse si el cliente alcanzó el límite de proyectos de su plan o si su suscripción está Vencida o Suspendida. Un proyecto cuyo último despliegue está Fallido SHALL NOT contar contra el límite.

#### Scenario: Suscripción vencida

- **WHEN** la suscripción del cliente está Vencida
- **THEN** «Nuevo proyecto» y «Desplegar» quedan bloqueados y se ofrece renovar

#### Scenario: Proyecto fallido no cuenta

- **WHEN** el último despliegue de un proyecto está Fallido
- **THEN** el proyecto sigue en la lista, no suma al contador y el cliente puede crear otro aunque esté en el límite
