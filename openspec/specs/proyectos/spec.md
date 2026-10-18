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

### Requirement: Límite y estado de la suscripción

El alta SHALL bloquearse si el cliente alcanzó el límite de proyectos de su plan (`cuotaDe(usuarioId).maxProyectos`), si su suscripción está Vencida o Suspendida o si agotó las construcciones del mes. El bloqueo por límite SHALL ocurrir antes de consultar GitHub, y todas las verificaciones SHALL hacerse antes de persistir el proyecto. Un proyecto cuyo último despliegue está Fallido SHALL NOT contar contra el límite. La lista de proyectos SHALL avisar del vencimiento antes de que el cliente intente desplegar. El panel SHALL mostrar un estado claro cuando la página no existe, cuando la API no responde y mientras carga.

#### Scenario: Límite de proyectos del plan

- **WHEN** un cliente en Sandbox con 1 proyecto intenta otro
- **THEN** se rechaza con `limite-proyectos` (409), no se consulta GitHub, no se guarda nada ni se pide despliegue, y en la web «Nuevo proyecto» queda deshabilitado con «Cambiar plan»

#### Scenario: Suscripción vencida

- **WHEN** la suscripción del cliente está Vencida
- **THEN** «Nuevo proyecto» y «Desplegar» quedan bloqueados y se ofrece renovar

#### Scenario: Proyecto fallido no cuenta

- **WHEN** el último despliegue de un proyecto está Fallido
- **THEN** el proyecto sigue en la lista, no suma al contador y el cliente puede crear otro aunque esté en el límite

#### Scenario: Alta con la suscripción vencida

- **WHEN** un cliente con la suscripción Vencida confirma el alta en Revisar
- **THEN** la API responde 409 `suscripcion-no-permite` y el proyecto no se guarda

#### Scenario: Construcciones agotadas en el alta

- **WHEN** un cliente sin construcciones disponibles confirma el alta
- **THEN** se muestra «Usaste las construcciones de tu plan este mes» con «Cambiar de plan» y el proyecto no se guarda

#### Scenario: Aviso con la fecha de gracia

- **WHEN** la suscripción Starter venció el 24 de septiembre
- **THEN** la lista muestra «Tu plan Starter venció el 24 sep · despliegues bloqueados» y que los servicios siguen en línea hasta el 29 sep

#### Scenario: Error de conexión con la API

- **WHEN** la lista de proyectos no puede conectar con la API
- **THEN** se muestra «No pudimos conectar con deploya», se reintenta solo a los 8 s y luego a los 16 s y 30 s, y «Reintentar ahora» lo hace de inmediato

#### Scenario: Página inexistente

- **WHEN** el cliente abre `/projects/api-tiendaa`, que no existe
- **THEN** ve «No encontramos esta página» con la ruta pedida e «Ir a proyectos»

### Requirement: Revisar y desplegar

Al confirmar el alta, el sistema SHALL persistir el proyecto y pedir a M4 el despliegue #1 con disparador `alta`. El motor SHALL leer el proyecto del mismo almacén en el que M3 lo guardó.

#### Scenario: Desplegar

- **WHEN** el cliente confirma en el paso Revisar
- **THEN** el proyecto queda persistido y existe el despliegue #1 en estado Encolado

#### Scenario: El motor encuentra el proyecto

- **WHEN** M3 guarda un proyecto y llama a `crearDespliegue`
- **THEN** el `ProyectosLecturaPuerto` del motor devuelve ese proyecto y el despliegue queda asociado a él

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

### Requirement: Configuración y eliminación

El cliente SHALL poder cambiar nombre (no cambia el subdominio), repositorio, rama, ruta del `Dockerfile` y puerto, con las mismas validaciones del alta. Los cambios SHALL aplicarse en el próximo despliegue, sin desplegar al guardar. Eliminar SHALL exigir escribir el nombre del proyecto y SHALL pedir a M5 detener y borrar contenedor e imágenes. Eliminar SHALL liberar el cupo del plan aunque el último despliegue haya fallado.

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

## Fuera de alcance · solo si da el tiempo

- Carga por archivo comprimido.
- Repositorios privados (OAuth de GitHub).
- Espacios de trabajo con varios miembros.
