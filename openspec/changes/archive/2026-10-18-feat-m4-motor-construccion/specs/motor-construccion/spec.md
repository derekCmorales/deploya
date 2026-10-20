# Spec Delta

## MODIFIED Requirements

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

El trabajador SHALL clonar la rama con profundidad 1, registrar el commit (sha, mensaje, autor) y ejecutar `docker build` con el `Dockerfile` del repositorio detrás de `ConstructorImagenPuerto`, con un tiempo máximo de 10 minutos. Cada construcción exitosa SHALL registrar un artefacto `deploya/<subdominio>:<n>` con digest, tamaño y commit.

#### Scenario: Construcción exitosa

- **WHEN** `docker build` termina bien
- **THEN** se registra el artefacto #n con imagen, digest y tamaño, la etapa Construcción queda Completada con su duración y el despliegue pasa a Aprovisionando

#### Scenario: Construcción fallida

- **WHEN** un paso del `Dockerfile` termina con código 127
- **THEN** el despliegue queda Fallido con `codigoSalida = 127`, la etapa Construcción queda Fallida, la última línea de bitácora es de nivel error y la versión activa del proyecto no cambia

#### Scenario: Tiempo de construcción agotado

- **WHEN** la construcción pasa de 10 minutos
- **THEN** se detiene, el despliegue queda Fallido con motivo «tiempo de construcción agotado» y la versión activa no cambia

#### Scenario: Repositorio que no se puede clonar

- **WHEN** el clon falla (repositorio borrado, privado o rama inexistente)
- **THEN** el despliegue queda Fallido en la etapa Recepción con el motivo del error de git

#### Scenario: Rama sin Dockerfile

- **WHEN** la rama no tiene `Dockerfile` en `rutaDockerfile`
- **THEN** el despliegue queda Fallido en Construcción con motivo «falta Dockerfile» (hasta que llegue la detección de stack)

### Requirement: Bitácora

Cada línea de la construcción SHALL persistirse con número consecutivo `n`, marca de tiempo con milisegundos, etapa y nivel, y consultarse desde una posición (`desde=`), con un máximo de 500 líneas por respuesta. La respuesta SHALL indicar si el despliegue ya terminó.

#### Scenario: Leer desde una posición

- **WHEN** el panel pide la bitácora desde la línea 10
- **THEN** recibe solo las líneas con `n` mayor que 10, en orden, y `siguiente` es el último `n` devuelto

#### Scenario: Despliegue terminado

- **WHEN** el despliegue está Saludable, Fallido o Cancelado y no hay líneas nuevas
- **THEN** la respuesta trae `lineas: []` y `terminado: true`

## ADDED Requirements

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
