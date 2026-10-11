# proyectos (M3)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): lista y alta de proyectos desde un repositorio público de GitHub con `Dockerfile`, variables de entorno cifradas, configuración y eliminación. Pantallas 10, 11, 17 y 19. Dueño: Eduardo.

## Purpose

Registrar el proyecto, su fuente y su configuración, y pedir a M4 el primer despliegue. M3 no construye ni corre nada.

## Requirements

### Requirement: Lista de proyectos

El sistema SHALL listar solo los proyectos del cliente de la sesión, del más reciente al más antiguo, con búsqueda por nombre, el estado del último despliegue y el contador frente al límite del plan (`usados` de `maximo`). Sin proyectos SHALL mostrar la guía del primer proyecto (10b). Mientras algún último despliegue siga en curso, la lista SHALL volver a pedirse cada 3 s y SHALL dejar de hacerlo cuando todos terminen.

#### Scenario: Sin proyectos

- **WHEN** el cliente no tiene proyectos
- **THEN** recibe una lista vacía con `usados: 0`, el máximo y los recursos de su plan, y ve la guía del primer proyecto con lo que necesita (repo público, `Dockerfile`, puerto HTTP)

#### Scenario: Estado del último despliegue

- **WHEN** el cliente tiene proyectos y alguno ya se desplegó
- **THEN** cada proyecto trae `ultimoDespliegue` del motor (`ultimosDespliegues`) o `null` si nunca se desplegó

#### Scenario: Solo sus proyectos

- **WHEN** otro usuario tiene proyectos
- **THEN** no aparecen en la lista del cliente

#### Scenario: Sondeo mientras hay algo en curso

- **WHEN** un último despliegue está Encolado o Construyendo
- **THEN** la web vuelve a pedir la lista cada 3 s y deja de pedirla cuando queda Saludable, Fallido, Cancelado o Detenido

### Requirement: Alta desde repositorio

El sistema SHALL crear un proyecto desde la URL de un repositorio **público de GitHub** (`https://github.com/<dueño>/<repo>`, se acepta `.git` o `/` al final), una rama (por defecto `main`), un nombre y un puerto interno. El sistema SHALL verificar que el repositorio es accesible, que la rama existe y que hay un `Dockerfile` en la raíz, y SHALL proponer el puerto a partir del primer `EXPOSE` (8080 si no hay). El nombre SHALL derivar un subdominio DNS válido (minúsculas, sin acentos, `[a-z0-9-]`, sin guion al inicio ni al final, máximo 63), único e inmutable.

#### Scenario: Repositorio válido

- **WHEN** el cliente indica un repositorio público con `Dockerfile`
- **THEN** ve que es accesible, sus ramas, el último commit, el `Dockerfile` detectado y el puerto propuesto

#### Scenario: Repositorio no accesible

- **WHEN** el repositorio no existe o es privado
- **THEN** se rechaza con `repositorio-no-accesible` y el código HTTP recibido, y la web muestra la lista de qué revisar (11e)

#### Scenario: Falta el Dockerfile

- **WHEN** la rama no tiene `Dockerfile` en la raíz
- **THEN** se rechaza con `sin-dockerfile` y la rama, y la web muestra un `Dockerfile` de ejemplo (11e)

#### Scenario: Rama inexistente

- **WHEN** la rama indicada no existe en el repositorio
- **THEN** se rechaza con `rama-no-encontrada` junto al campo Rama

#### Scenario: URL que no es de GitHub

- **WHEN** la URL es de otro host, usa `http` o apunta a una ruta interna del repositorio
- **THEN** se rechaza con `url-invalida` sin llamar a GitHub

#### Scenario: GitHub no disponible

- **WHEN** GitHub no responde, falla con 5xx o se agotó el límite de peticiones
- **THEN** se rechaza con `fuente-no-disponible` (503), no como repositorio no accesible

#### Scenario: Puerto desde EXPOSE

- **WHEN** el `Dockerfile` tiene uno o varios `EXPOSE`
- **THEN** se propone el primero; sin `EXPOSE` se propone 8080; el cliente puede cambiarlo y el elegido es el que se guarda

#### Scenario: Subdominio desde el nombre

- **WHEN** el cliente escribe «Mi App Web»
- **THEN** el subdominio es `mi-app-web`

#### Scenario: Subdominio duplicado

- **WHEN** el subdominio derivado ya existe
- **THEN** se rechaza con `subdominio-en-uso` (409) junto al campo Nombre

### Requirement: Límite y estado de la suscripción

El alta SHALL bloquearse si el cliente alcanzó el límite de proyectos de su plan o si su suscripción está Vencida o Suspendida. El bloqueo por límite SHALL ocurrir antes de consultar GitHub. Un proyecto cuyo último despliegue está Fallido SHALL NOT contar contra el límite.

#### Scenario: Límite de proyectos del plan

- **WHEN** un cliente en Sandbox con 1 proyecto intenta otro
- **THEN** se rechaza con `limite-proyectos` (409), no se consulta GitHub, no se guarda nada ni se pide despliegue, y en la web «Nuevo proyecto» queda deshabilitado con «Cambiar plan»

#### Scenario: Suscripción vencida

- **WHEN** la suscripción del cliente está Vencida
- **THEN** «Nuevo proyecto» y «Desplegar» quedan bloqueados y se ofrece renovar

#### Scenario: Proyecto fallido no cuenta

- **WHEN** el último despliegue de un proyecto está Fallido
- **THEN** el proyecto sigue en la lista, no suma al contador y el cliente puede crear otro aunque esté en el límite

### Requirement: Revisar y desplegar

Al confirmar el alta, el sistema SHALL persistir el proyecto y pedir a M4 el despliegue #1 con disparador `alta`. El motor SHALL leer el proyecto del mismo almacén en el que M3 lo guardó.

#### Scenario: Desplegar

- **WHEN** el cliente confirma en el paso Revisar
- **THEN** el proyecto queda persistido y existe el despliegue #1 en estado Encolado

#### Scenario: El motor encuentra el proyecto

- **WHEN** M3 guarda un proyecto y llama a `crearDespliegue`
- **THEN** el `ProyectosLecturaPuerto` del motor devuelve ese proyecto y el despliegue queda asociado a él

### Requirement: Variables cifradas

Las variables de entorno SHALL almacenarse cifradas en reposo (`valorCifrado`) y mostrarse enmascaradas. Los cambios SHALL aplicar en el próximo despliegue; el cliente puede guardar o guardar y desplegar.

#### Scenario: Guardar variable

- **WHEN** el cliente guarda una variable
- **THEN** el valor no se persiste en claro y el contenedor actual sigue con las anteriores

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

## Fuera de alcance · solo si da el tiempo

- Carga por archivo comprimido.
- Repositorios privados (OAuth de GitHub).
- Receta y comando de arranque sin `Dockerfile` (detección de stack).
- Espacios de trabajo con varios miembros.
