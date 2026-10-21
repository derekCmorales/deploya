# motor-construccion (M4)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): cola de trabajos, clonado del repositorio, construcción con el `Dockerfile` del cliente, artefacto versionado y bitácora de construcción. Pantallas 12 y 14. Dueño: Derek.

## Purpose

Convertir un commit de un proyecto en una imagen versionada, fuera del ciclo HTTP, dejando cada línea de bitácora disponible para M7.

## Requirements

### Requirement: Recepción y cola

Al registrar un despliegue, la API SHALL crearlo con el número siguiente del proyecto (`#n`), estado Encolado y sus cinco etapas en Pendiente, y SHALL encolar un `TrabajoDespliegue { despliegueId, plan }` en la cola `despliegues` de BullMQ detrás de `ColaConstruccionPuerto`. El trabajador SHALL correr fuera del ciclo HTTP. Solo el dueño del proyecto SHALL poder crear y consultar sus despliegues. La API SHALL rechazar el despliegue si la suscripción está Vencida o Suspendida o si se agotaron las construcciones del mes (se aplica desde M5-03).

#### Scenario: Encolar

- **WHEN** el dueño pide `POST /proyectos/:id/despliegues`
- **THEN** responde 201 con `{ id, numero, estado: "encolado" }`, el despliegue tiene sus cinco etapas en Pendiente y existe un trabajo con ese `despliegueId` en la cola

#### Scenario: Números consecutivos

- **WHEN** un proyecto con el despliegue #3 registra otro
- **THEN** el nuevo es el #4

#### Scenario: Proyecto ajeno

- **WHEN** un usuario pide desplegar o consultar un proyecto que no es suyo
- **THEN** recibe 404 y no se encola nada

### Requirement: Construcción con Dockerfile

El trabajador SHALL clonar la rama con profundidad 1, registrar el commit (sha, mensaje, autor), detectar el stack y ejecutar `docker build` con el `Dockerfile` del repositorio o, si no hay, con el `Dockerfile.deploya` que genera la receta detectada, detrás de `ConstructorImagenPuerto`, con un tiempo máximo de 10 minutos. Cada construcción exitosa SHALL registrar un artefacto `deploya/<subdominio>:<n>` con digest, tamaño, commit y receta.

#### Scenario: Construcción exitosa

- **WHEN** `docker build` termina bien
- **THEN** se registra el artefacto #n con imagen, digest, tamaño y receta, la etapa Construcción queda Completada con su duración y el despliegue pasa a Aprovisionando

#### Scenario: Construcción con receta

- **WHEN** la receta detectada es `node`
- **THEN** la bitácora registra «Stack detectado: Node.js 22 · receta Deploya», se construye con `Dockerfile.deploya` y el artefacto guarda `receta = node`

#### Scenario: Construcción fallida

- **WHEN** un paso del `Dockerfile` termina con código 127
- **THEN** el despliegue queda Fallido con `codigoSalida = 127`, la etapa Construcción queda Fallida, la última línea de bitácora es de nivel error y la versión activa del proyecto no cambia

#### Scenario: Tiempo de construcción agotado

- **WHEN** la construcción pasa de 10 minutos
- **THEN** se detiene, el despliegue queda Fallido con motivo «tiempo de construcción agotado» y la versión activa no cambia

#### Scenario: Repositorio que no se puede clonar

- **WHEN** el clon falla (repositorio borrado, privado o rama inexistente)
- **THEN** el despliegue queda Fallido en la etapa Recepción con el motivo del error de git

### Requirement: Bitácora

Cada línea de la construcción SHALL persistirse con número consecutivo `n`, marca de tiempo con milisegundos, etapa y nivel, y consultarse desde una posición (`desde=`), con un máximo de 500 líneas por respuesta. La respuesta SHALL indicar si el despliegue ya terminó.

#### Scenario: Leer desde una posición

- **WHEN** el panel pide la bitácora desde la línea 10
- **THEN** recibe solo las líneas con `n` mayor que 10, en orden, y `siguiente` es el último `n` devuelto

#### Scenario: Despliegue terminado

- **WHEN** el despliegue está Saludable, Fallido o Cancelado y no hay líneas nuevas
- **THEN** la respuesta trae `lineas: []` y `terminado: true`

### Requirement: Acciones sobre despliegues

El cliente SHALL poder cancelar un despliegue en curso, reintentar uno fallido y redesplegar un commit anterior. Redesplegar **reconstruye** ese commit con su `Dockerfile` o receta y consume una construcción. Volver a una versión **sin reconstruir** es la reversión de M5 (spec `orquestacion`), que no consume construcciones. Cancelar SHALL estar permitido solo en Encolado, Construyendo y Revirtiendo; reintentar, solo desde Fallido.

#### Scenario: Cancelar

- **WHEN** el cliente cancela un despliegue en Encolado o Construyendo
- **THEN** el trabajo se detiene, el despliegue queda Cancelado y la versión activa no cambia

#### Scenario: Cancelar encolado

- **WHEN** el cliente cancela un despliegue que sigue Encolado
- **THEN** sale de la cola sin clonar ni construir y queda Cancelado

#### Scenario: Cancelar tarde

- **WHEN** el cliente cancela un despliegue en Aprovisionando
- **THEN** responde 409 `ya-no-se-puede-cancelar` y el despliegue sigue

#### Scenario: Reintentar un fallido

- **WHEN** el cliente reintenta el despliegue #11, que quedó Fallido
- **THEN** se crea un despliegue nuevo con el mismo commit y disparador `reintento`, y cuenta como una construcción del mes

#### Scenario: Reintentar uno saludable

- **WHEN** el cliente reintenta un despliegue Saludable
- **THEN** responde 409 y no se crea nada

#### Scenario: Redesplegar reconstruye

- **WHEN** el cliente redespliega el commit del despliegue #12
- **THEN** se crea un despliegue nuevo por construcción de ese commit y cuenta como una construcción del mes

#### Scenario: Commit desconocido

- **WHEN** el cliente pide redesplegar un commit que nunca se desplegó en el proyecto
- **THEN** responde 409 `commit-desconocido`

### Requirement: Máquina de estados del despliegue

Los cambios de estado SHALL pasar por `TransicionesDespliegue`, una función pura que es la única fuente de verdad de las transiciones válidas (diagrama `m4-m5-m6-estados-despliegue.mmd`). Una transición no permitida SHALL lanzar `TransicionInvalida` y no persistir nada.

#### Scenario: Transición válida

- **WHEN** un despliegue en Construyendo registra su artefacto
- **THEN** pasa a Aprovisionando

#### Scenario: Transición inválida

- **WHEN** se intenta pasar un despliegue Fallido a Saludable
- **THEN** se lanza `TransicionInvalida` y el estado no cambia

### Requirement: Vista del despliegue con cinco etapas

`GET /despliegues/:id` SHALL devolver el despliegue con las cinco etapas en orden (recepción, construcción, ejecución, enrutamiento, operación), cada una con su estado y duración, el commit, la imagen, la URL y el código de salida, según el contrato v1.

#### Scenario: Etapas en curso

- **WHEN** el despliegue está Construyendo
- **THEN** Recepción está Completada con su duración, Construcción En curso y las demás Pendientes

### Requirement: Detección de stack

Cuando la rama no tiene `Dockerfile` en `rutaDockerfile`, el sistema SHALL reconocer el stack probando recetas en este orden: Node (`package.json` con script `start`), Python (`requirements.txt` o `pyproject.toml`, y `main.py` o `app.py`), Go (`go.mod`) y sitio estático (`index.html` en la raíz). Si hay `Dockerfile`, SHALL usarse siempre el del repositorio. La detección SHALL ser la misma en el alta (M3, sobre GitHub) y en el trabajador (sobre el clon), vía `LectorFuente`. Todas las recetas SHALL escuchar en el puerto 8080 (`PORT`).

#### Scenario: El Dockerfile manda

- **WHEN** la rama tiene `Dockerfile` y también `package.json`
- **THEN** la receta es `dockerfile` y el puerto sugerido es el primer `EXPOSE` (o 8080 si no hay)

#### Scenario: Proyecto Node sin Dockerfile

- **WHEN** la rama tiene `package.json` con script `start` y no tiene `Dockerfile`
- **THEN** la receta es `node`, la descripción dice «Node.js 22 · npm start» y la evidencia incluye `package.json`

#### Scenario: Proyecto Python sin Dockerfile

- **WHEN** la rama tiene `requirements.txt` y `main.py`
- **THEN** la receta es `python`

#### Scenario: Proyecto Go sin Dockerfile

- **WHEN** la rama tiene `go.mod`
- **THEN** la receta es `go`

#### Scenario: Sitio estático

- **WHEN** la rama solo tiene `index.html` y recursos estáticos
- **THEN** la receta es `estatica` y se sirve con un servidor sin privilegios en 8080

#### Scenario: Stack no reconocido

- **WHEN** la rama no tiene `Dockerfile` ni coincide con ninguna receta
- **THEN** se lanza `StackNoReconocido` y el despliegue (o el alta) se rechaza con el motivo «falta Dockerfile y no se reconoce el stack»

#### Scenario: Node sin script start

- **WHEN** hay `package.json` sin script `start` y ningún otro archivo reconocible
- **THEN** se lanza `StackNoReconocido` con la pista «agrega un script start o un Dockerfile»

### Requirement: Consulta por número de despliegue

El sistema SHALL permitir consultar un despliegue por su número dentro del proyecto, con el mismo detalle que por su identificador. Solo el dueño del proyecto SHALL poder hacerlo.

#### Scenario: Consultar por número

- **WHEN** el dueño pide el despliegue #3 de su proyecto
- **THEN** recibe el mismo detalle que por su identificador

#### Scenario: Número inexistente o proyecto ajeno

- **WHEN** se pide un número que no existe o un proyecto de otro cliente
- **THEN** la respuesta es 404

### Requirement: Tiempos por etapa

El motor SHALL exponer la duración de cada etapa de los últimos despliegues de un proyecto, con 0 en las etapas omitidas y la etapa donde terminó un Fallido.

#### Scenario: Reversión sin construcción

- **WHEN** el despliegue #7 fue una reversión
- **THEN** sus tiempos tienen Recepción y Construcción en 0

#### Scenario: Fallido en Construcción

- **WHEN** #11 falló en Construcción
- **THEN** sus tiempos marcan `falloEn: construccion` y las etapas siguientes en 0
