# proyectos (M3)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): lista y alta de proyectos desde un repositorio público de GitHub con `Dockerfile`, variables de entorno cifradas, configuración y eliminación. Pantallas 10, 11, 17 y 19. Dueño: Eduardo.

## Purpose

Registrar el proyecto, su fuente y su configuración, y pedir a M4 el primer despliegue. M3 no construye ni corre nada.

## Requirements

### Requirement: Lista de proyectos

El sistema SHALL listar los proyectos del cliente con búsqueda, estado del último despliegue y el contador frente al límite del plan. Sin proyectos SHALL mostrar la guía del primer proyecto (10b).

#### Scenario: Sin proyectos

- **WHEN** el cliente no tiene proyectos
- **THEN** ve la guía del primer proyecto con lo que necesita (repo público, `Dockerfile`, puerto HTTP)

### Requirement: Alta desde repositorio

El sistema SHALL crear un proyecto desde la URL de un repositorio **público de GitHub**, una rama, un nombre (define el subdominio y es único) y un puerto interno. El sistema SHALL verificar que el repositorio es accesible y que hay un `Dockerfile` en la raíz, y SHALL proponer el puerto a partir de `EXPOSE`.

#### Scenario: Repositorio válido

- **WHEN** el cliente indica un repositorio público con `Dockerfile`
- **THEN** ve la rama, el último commit, el `Dockerfile` detectado y el puerto propuesto

#### Scenario: Repositorio no accesible

- **WHEN** el repositorio no existe o es privado
- **THEN** se rechaza con el código recibido y la lista de qué revisar (11e)

#### Scenario: Falta el Dockerfile

- **WHEN** la rama no tiene `Dockerfile` en la raíz
- **THEN** se rechaza y se muestra un `Dockerfile` de ejemplo (11e)

### Requirement: Límite y estado de la suscripción

El alta SHALL bloquearse si el cliente alcanzó el límite de proyectos de su plan o si su suscripción está Vencida o Suspendida.

#### Scenario: Suscripción vencida

- **WHEN** la suscripción del cliente está Vencida
- **THEN** «Nuevo proyecto» y «Desplegar» quedan bloqueados y se ofrece renovar

### Requirement: Revisar y desplegar

Al confirmar el alta, el sistema SHALL persistir el proyecto y pedir a M4 el despliegue #1.

#### Scenario: Desplegar

- **WHEN** el cliente confirma en el paso Revisar
- **THEN** el proyecto queda persistido y existe el despliegue #1 en estado Encolado

### Requirement: Variables cifradas

Las variables de entorno SHALL almacenarse cifradas en reposo (`valorCifrado`) y mostrarse enmascaradas. Los cambios SHALL aplicar en el próximo despliegue; el cliente puede guardar o guardar y desplegar.

#### Scenario: Guardar variable

- **WHEN** el cliente guarda una variable
- **THEN** el valor no se persiste en claro y el contenedor actual sigue con las anteriores

### Requirement: Configuración y eliminación

El cliente SHALL poder cambiar nombre (no cambia el subdominio), repositorio, rama, ruta del `Dockerfile` y puerto. Eliminar SHALL exigir escribir el nombre del proyecto y SHALL pedir a M5 detener y borrar contenedor e imágenes.

#### Scenario: Eliminar proyecto

- **WHEN** el cliente escribe el nombre del proyecto y confirma
- **THEN** se detiene el servicio y se borran contenedor, imágenes, variables e historial

## Fuera de alcance · solo si da el tiempo

- Carga por archivo comprimido.
- Repositorios privados (OAuth de GitHub).
- Receta y comando de arranque sin `Dockerfile` (detección de stack).
- Espacios de trabajo con varios miembros.
