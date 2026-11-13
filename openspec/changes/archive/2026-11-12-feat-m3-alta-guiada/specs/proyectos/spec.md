# Spec Delta

## ADDED Requirements

### Requirement: Alta guiada en cinco pasos

El asistente «Nuevo proyecto» SHALL guiar al cliente por Repositorio, Construcción, Datos, Variables y Revisar, de modo que el despliegue #1 salga con todo lo que la app necesita. Construcción, Datos y Variables SHALL ser opcionales. El paso Variables SHALL ofrecer la misma experiencia que la pestaña Variables (17): tabla clave/valor, «Pegar .env», mostrar y ocultar valores y el contador hasta 150. Revisar SHALL tener una fila por paso con «Editar», que vuelve a ese paso sin perder lo escrito.

#### Scenario: Pegar un .env en el alta

- **WHEN** en el paso Variables el cliente pega `NODE_ENV=production` y `API_KEY="abc"`
- **THEN** quedan dos variables nuevas, `API_KEY` con el valor `abc`, y el contador dice «2 / 150»

#### Scenario: Variables que inyectan los recursos elegidos

- **WHEN** el cliente eligió PostgreSQL en el paso Datos y llega a Variables
- **THEN** ve que `DATABASE_URL` y `PG*` llegarán solas, y una variable propia con la misma clave se marca como «gana la tuya»

#### Scenario: Comando de construcción sin receta

- **WHEN** el repositorio trae su propio `Dockerfile`
- **THEN** el campo «Comando de construcción» no se ofrece y el texto explica que el `Dockerfile` manda

#### Scenario: Límite de datos del plan en el asistente

- **WHEN** el plan permite 1 recurso de datos y la cuenta ya usa 1
- **THEN** las tarjetas de PostgreSQL, Redis y S3 aparecen deshabilitadas con «Llegaste al límite de tu plan»

### Requirement: Alta con comandos y recursos de datos

`POST /proyectos` SHALL aceptar `comandoInicio`, `comandoConstruccion` y `datos` (lista de `postgres`, `redis`, `s3`, sin repetir), todos opcionales. Los comandos SHALL validarse como en Configuración (hasta 512 caracteres, comillas cerradas; el de construcción además en una sola línea). El sistema SHALL verificar la suscripción y el límite de recursos de datos **antes** de guardar el proyecto; con todo válido SHALL guardar el proyecto, sus variables y sus recursos, y SHALL encolar el despliegue #1 al final.

#### Scenario: Alta con PostgreSQL y Redis

- **WHEN** el cliente confirma un alta con `datos: ["postgres", "redis"]` y su plan admite dos recursos más
- **THEN** el proyecto se guarda, se piden los dos recursos a M5 y después se crea el despliegue #1 en Encolado

#### Scenario: Alta con más recursos de los que admite el plan

- **WHEN** el cliente pide dos recursos y su plan solo admite uno más
- **THEN** se rechaza con 409 `datos-no-permitidos` y el motivo del plan, y no se guarda el proyecto ni se crea el despliegue

#### Scenario: Recurso repetido en el alta

- **WHEN** `datos` trae `postgres` dos veces o un tipo desconocido
- **THEN** se rechaza con 400 `datos-invalidos` sin llamar a GitHub

#### Scenario: Comandos en el alta

- **WHEN** el alta trae `comandoInicio: "node dist/worker.js"` y `comandoConstruccion: "npm run build:prod"`
- **THEN** el proyecto se guarda con ambos y Configuración (19) los muestra

#### Scenario: Comando de construcción con salto de línea

- **WHEN** `comandoConstruccion` trae un salto de línea
- **THEN** se rechaza con 400 `comando-invalido` y no se guarda nada

## MODIFIED Requirements

### Requirement: Configuración y eliminación

En Configuración (19) el cliente SHALL poder cambiar nombre, repositorio, rama, ruta del `Dockerfile`, puerto interno, comando de inicio y comando de construcción; los cambios SHALL aplicar en el próximo despliegue. Renombrar no cambia el subdominio. Eliminar SHALL pedir escribir el nombre del proyecto.

#### Scenario: Renombrar no cambia el subdominio

- **WHEN** el cliente cambia el nombre del proyecto
- **THEN** el subdominio sigue igual

#### Scenario: Cambiar la rama aplica en el próximo despliegue

- **WHEN** el cliente cambia la rama
- **THEN** se guarda y no se crea un despliegue

#### Scenario: Cambiar el comando de construcción

- **WHEN** el cliente escribe un comando de construcción y guarda
- **THEN** el `PATCH` lo guarda; vacío vuelve a `null` (el de la receta)

#### Scenario: Rama inexistente

- **WHEN** el cliente pone una rama que no existe en el repositorio
- **THEN** se rechaza con `rama-no-encontrada` junto al campo

#### Scenario: Nombre repetido

- **WHEN** el cliente usa el nombre de otro de sus proyectos
- **THEN** se rechaza con `nombre-repetido`

#### Scenario: Eliminar proyecto

- **WHEN** el cliente escribe el nombre exacto y confirma
- **THEN** se borran el proyecto, sus variables, despliegues y contenedores

#### Scenario: Confirmación distinta

- **WHEN** el texto no coincide con el nombre
- **THEN** se rechaza con `confirmacion-no-coincide`

#### Scenario: Proyecto ajeno o inexistente

- **WHEN** el cliente pide un proyecto que no es suyo o no existe
- **THEN** responde 404 `proyecto-no-encontrado`

#### Scenario: Comando de inicio

- **WHEN** el cliente guarda `comandoInicio` = `node dist/worker-optimizer.main.js` y luego `null`
- **THEN** la vista devuelve el comando y después `null`, y el siguiente despliegue usa el `CMD` de la imagen

#### Scenario: Comando de inicio demasiado largo

- **WHEN** el comando pasa de 512 caracteres
- **THEN** se rechaza con `comando-invalido` (400)

#### Scenario: Comando con comilla sin cerrar

- **WHEN** el comando tiene una comilla sin cerrar o no es texto
- **THEN** se rechaza con `comando-invalido` (400)

