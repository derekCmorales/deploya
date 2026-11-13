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

El sistema SHALL crear un proyecto desde la URL de un repositorio **público de GitHub**, una rama, un nombre (define el subdominio y es único), un puerto interno y, opcionalmente, la ruta del `Dockerfile` relativa al repositorio (por omisión `Dockerfile`, en la raíz). El sistema SHALL verificar que el repositorio es accesible y SHALL pedir a M4 (`DeteccionStackService.detectar`) cómo se construye: con el `Dockerfile` de la ruta indicada o con una receta de stack reconocida. El puerto propuesto SHALL salir de `EXPOSE` de ese `Dockerfile` o, con receta, ser 8080. La ruta SHALL validarse con la misma regla que en Configuración y SHALL guardarse en el proyecto.

#### Scenario: Repositorio válido

- **WHEN** el cliente indica un repositorio público con `Dockerfile`
- **THEN** ve la rama, el último commit, «Dockerfile detectado» y el puerto propuesto

#### Scenario: Ruta del Dockerfile en el alta

- **WHEN** el cliente indica `apps/api/Dockerfile` en un repositorio que tiene ese archivo con `EXPOSE 4000` y nada en la raíz
- **THEN** ve «Dockerfile encontrado en apps/api/Dockerfile», el puerto 4000, y el proyecto se guarda con esa ruta

#### Scenario: Ruta del Dockerfile vacía

- **WHEN** el cliente deja la ruta vacía o no la envía
- **THEN** se usa `Dockerfile` en la raíz, como antes

#### Scenario: Ruta del Dockerfile inválida

- **WHEN** la ruta sale del repositorio (`..`), tiene segmentos vacíos o `\`
- **THEN** se rechaza con `ruta-invalida` junto al campo «Ruta del Dockerfile» sin llamar a GitHub

#### Scenario: Ruta del Dockerfile inexistente sin stack reconocido

- **WHEN** no hay `Dockerfile` en la ruta indicada y M4 no reconoce el stack
- **THEN** se rechaza con «falta Dockerfile y no se reconoce el stack» y no se guarda nada

#### Scenario: Cambiar la rama con un Dockerfile fuera de la raíz

- **WHEN** en Configuración se cambia la rama de un proyecto cuyo `Dockerfile` está en `apps/api/Dockerfile`
- **THEN** la validación consulta esa ruta, no la raíz

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

### Requirement: Web lista para el público

Un error inesperado al dibujar una pantalla SHALL mostrar el estado de error del design system con «Reintentar», nunca una página en blanco. El cambio entre rutas SHALL mostrar un esqueleto. La web SHALL mandar cabeceras que impidan incrustarla en otro sitio y adivinar tipos de contenido. Cada página SHALL tener título propio con el sufijo «· Deploya» y la pestaña SHALL mostrar el ícono de Deploya.

#### Scenario: Error inesperado en una pantalla

- **WHEN** un componente de `(projects)` lanza una excepción al dibujarse
- **THEN** se ve `ErrorConexionApi` con «Reintentar» dentro del shell, y al reintentar se vuelve a dibujar

#### Scenario: Carga entre rutas

- **WHEN** se navega a la lista de proyectos y los datos aún no llegan
- **THEN** se ve `EsqueletoProyectos`

#### Scenario: Cabeceras de seguridad

- **WHEN** se pide cualquier página de la web
- **THEN** la respuesta trae `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`

#### Scenario: Título por página

- **WHEN** se abre «Mi suscripción»
- **THEN** la pestaña dice «Mi suscripción · Deploya»

### Requirement: Subdominios reservados para datos

Un proyecto nuevo SHALL NOT tomar un subdominio que termine en `-s3`: esa etiqueta es la ruta pública del almacenamiento S3 de otro proyecto (`<subdominio>-s3.<dominio>`).

#### Scenario: Subdominio que choca con una ruta S3

- **WHEN** el cliente crea un proyecto llamado «tienda-s3»
- **THEN** el alta se rechaza con `subdominio-en-uso` y no se guarda nada

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

## Fuera de alcance · solo si da el tiempo

- Carga por archivo comprimido.
- Repositorios privados (OAuth de GitHub).
- Espacios de trabajo con varios miembros.
