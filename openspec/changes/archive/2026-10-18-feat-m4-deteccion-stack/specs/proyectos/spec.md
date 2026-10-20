# Spec Delta

## MODIFIED Requirements

### Requirement: Alta desde repositorio

El sistema SHALL crear un proyecto desde la URL de un repositorio **público de GitHub**, una rama, un nombre (define el subdominio y es único) y un puerto interno. El sistema SHALL verificar que el repositorio es accesible y SHALL pedir a M4 (`DeteccionStackService.detectar`) cómo se construye: con el `Dockerfile` de la raíz o con una receta de stack reconocida. El puerto propuesto SHALL salir de `EXPOSE` o, con receta, ser 8080.

#### Scenario: Repositorio válido

- **WHEN** el cliente indica un repositorio público con `Dockerfile`
- **THEN** ve la rama, el último commit, «Dockerfile detectado» y el puerto propuesto

#### Scenario: Repositorio sin Dockerfile con stack reconocido

- **WHEN** el cliente indica un repositorio público sin `Dockerfile` con `package.json` y script `start`
- **THEN** ve «Stack detectado: Node.js 22 · receta Deploya», el puerto 8080 y puede continuar

#### Scenario: Repositorio no accesible

- **WHEN** el repositorio no existe o es privado
- **THEN** se rechaza con el código recibido y la lista de qué revisar (11e)

#### Scenario: Falta el Dockerfile

- **WHEN** la rama no tiene `Dockerfile` en la ruta indicada
- **THEN** antes de rechazar se pide a M4 que reconozca el stack; solo si no lo reconoce se muestra el error de 11e

#### Scenario: Falta el Dockerfile y no se reconoce el stack

- **WHEN** la rama no tiene `Dockerfile` y M4 lanza `StackNoReconocido`
- **THEN** se rechaza con «falta Dockerfile y no se reconoce el stack», la pista de M4 y un `Dockerfile` de ejemplo (11e)

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
