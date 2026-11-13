# datos Specification

## Purpose
TBD - created by archiving change feat-m5-recursos-datos. Update Purpose after archive.

## Requirements

### Requirement: Crear un recurso de datos

El dueño de un proyecto SHALL poder crear un recurso de datos `postgres` (PostgreSQL 17 + pgvector), `redis` (Redis 7 con AOF) o `s3` (compatible con S3) con `POST /proyectos/:id/datos`. La API SHALL responder 201 con la `VistaRecursoDatos` en estado `creando`, guardar una contraseña aleatoria de 32 caracteres `[A-Za-z0-9]` cifrada con el mismo cifrado de las variables y encolar el trabajo en la cola `datos`, sin llamar a Docker. El trabajador SHALL crear el volumen `deploya-datos-<subdominio>-<tipo>` y el contenedor del mismo nombre en la red del proyecto (creándola si no existe), esperar a que acepte conexiones y dejar el recurso `disponible`. La cuenta SHALL tener a lo sumo `maxRecursosDatos` recursos propios, cada proyecto a lo sumo uno de cada tipo (propio o compartido), y con la suscripción Vencida o Suspendida no SHALL crearse ninguno. Los estados del recurso (`creando`, `disponible`, `detenido`, `error`) no son estados de despliegue ni de suscripción.

#### Scenario: Crear un Postgres

- **WHEN** el dueño pide un `postgres` para su proyecto
- **THEN** recibe 201 con el recurso en `creando` y, cuando el trabajador procesa la cola, el recurso queda `disponible` con la extensión `vector` creada en la base `app`

#### Scenario: La red se crea aunque el proyecto no tenga despliegue

- **WHEN** se crea un recurso en un proyecto que nunca desplegó
- **THEN** el contenedor de datos nace conectado a `deploya-p-<subdominio>`

#### Scenario: Límite del plan

- **WHEN** la cuenta ya tiene tantos recursos propios como `maxRecursosDatos`
- **THEN** la API responde 409 `LIMITE_RECURSOS_DATOS` y no encola nada

#### Scenario: Un tipo por proyecto

- **WHEN** el proyecto ya tiene un recurso de ese tipo, propio o compartido
- **THEN** la API responde 409 `TIPO_YA_CONECTADO`

#### Scenario: Suscripción bloqueada

- **WHEN** la suscripción está Vencida o Suspendida
- **THEN** la API responde 409 `SUSCRIPCION_BLOQUEADA` y no crea nada

#### Scenario: Proyecto ajeno

- **WHEN** un usuario pide los recursos de un proyecto que no es suyo o no existe
- **THEN** la API responde 404

#### Scenario: Imagen que no arranca

- **WHEN** el contenedor de datos no acepta conexiones en el tiempo de preparación
- **THEN** el recurso queda en `error` con el detalle

#### Scenario: Autoalojado sin tope

- **WHEN** la instalación es autoalojada
- **THEN** `limite.maximo` llega sin tope (`null` en JSON) y se puede crear sin bloqueo del plan

### Requirement: Conexión y variables

`GET /proyectos/:id/datos` SHALL listar los recursos propios y compartidos del proyecto con su `VistaRecursoDatos` (sin secretos, solo los nombres de las variables), el límite de la cuenta y los tipos que aún se pueden agregar. `GET /proyectos/:id/datos/:recursoId/conexion` SHALL devolver los valores reales de las variables para copiarlos.

#### Scenario: Conexión para copiar

- **WHEN** el dueño pide la conexión de su S3
- **THEN** recibe `S3_ENDPOINT` interno, `S3_PUBLIC_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` = `app`, `S3_REGION` = `us-east-1` y las `DEPLOYA_S3_*`

### Requirement: Compartir entre proyectos del mismo usuario

El dueño SHALL poder compartir un recurso con otro proyecto suyo (`POST …/compartir`): el contenedor SHALL conectarse también a la red de ese proyecto y sus variables SHALL inyectarse allí en el siguiente despliegue. Compartir no SHALL contar otra vez contra `maxRecursosDatos`. SHALL poder dejar de compartirse (`DELETE …/compartir/:proyectoId`).

#### Scenario: Compartir con otro proyecto del mismo usuario

- **WHEN** el dueño comparte su `postgres` con otro proyecto suyo
- **THEN** el recurso aparece en `compartidoCon`, el contenedor se conecta a la red de ese proyecto y el contador de la cuenta no cambia

#### Scenario: Compartir con un proyecto que ya tiene ese tipo

- **WHEN** el proyecto destino ya tiene un recurso de ese tipo
- **THEN** la API responde 409 `TIPO_YA_CONECTADO`

#### Scenario: Compartir con un proyecto de otro usuario

- **WHEN** el destino es de otro usuario o no existe
- **THEN** la API responde 404

#### Scenario: Dejar de compartir

- **WHEN** el dueño deja de compartir el recurso con un proyecto
- **THEN** el contenedor se desconecta de la red de ese proyecto

### Requirement: Eliminar un recurso de datos

`DELETE /proyectos/:id/datos/:recursoId` SHALL exigir `{ confirmacion: "<tipo>" }`. Desde el proyecto dueño SHALL borrar el contenedor **y el volumen** y retirar la ruta pública si la había; desde un proyecto con el que solo se comparte SHALL únicamente desconectarlo.

#### Scenario: Eliminar desde el dueño

- **WHEN** el dueño confirma con el tipo
- **THEN** responde 204, el contenedor y el volumen dejan de existir y la ruta `<subdominio>-s3` se retira

#### Scenario: Eliminar desde un compartido

- **WHEN** se elimina desde un proyecto con el que solo se comparte
- **THEN** el recurso se desconecta de ese proyecto y sigue existiendo para su dueño

#### Scenario: Confirmación que no coincide

- **WHEN** el texto escrito no es el tipo
- **THEN** responde 400 y no se borra nada

### Requirement: Almacenamiento S3 público

El recurso `s3` SHALL publicarse en `https://<subdominio>-s3.<dominio>` por el enrutador de borde (certificado comodín) y SHALL crearse con el bucket `app` con versionado activado. Ningún otro tipo SHALL tener ruta pública ni puertos publicados en el host.

#### Scenario: Ruta pública del S3

- **WHEN** el trabajador termina de crear un `s3`
- **THEN** publica `<subdominio>-s3` hacia el contenedor en el puerto 9000

#### Scenario: Bucket con versionado

- **WHEN** el `s3` queda disponible
- **THEN** existe el bucket `app` y su versionado está activado

### Requirement: Medición de disco

El trabajador SHALL medir cada 5 minutos el disco que usa cada recurso disponible y guardarlo con la hora. Superar `discoDatosMb` SHALL mostrarse como aviso y no SHALL detener el recurso.

#### Scenario: Medición periódica

- **WHEN** corre la medición
- **THEN** cada recurso disponible guarda `usoDiscoMb` y `medidoEn`

#### Scenario: Sobre el límite no corta

- **WHEN** un recurso usa más que `discoDatosMb`
- **THEN** la vista muestra el uso y el límite y el recurso sigue disponible

### Requirement: Contenedores de datos aislados

Los contenedores de datos SHALL correr con `CapDrop: ALL` más solo `CHOWN`, `SETUID`, `SETGID`, `FOWNER` y `DAC_OVERRIDE`, `no-new-privileges`, el límite de memoria de su tipo, `RestartPolicy unless-stopped` y sin puertos publicados en el host.

#### Scenario: Sin puertos publicados y capacidades mínimas

- **WHEN** se crea cualquier recurso de datos
- **THEN** `docker inspect` muestra `CapDrop ALL`, las cinco capacidades, `no-new-privileges` y ningún `PortBindings`

### Requirement: Recursos listos antes de arrancar la app

Antes de crear el contenedor de la app (Ejecución), el motor SHALL esperar a que los recursos de datos del proyecto que siguen en `creando` pasen a `disponible` o `error`, consultando cada 2 s hasta un tope de 2 min. Un recurso que siga en `creando` al llegar al tope SHALL inyectarse igual y la bitácora SHALL avisarlo. La API SHALL ofrecer `verificarAltaInicial(usuarioId, tipos)` para que M3 valide suscripción, límite del plan y tipos repetidos antes de guardar un proyecto.

#### Scenario: Recurso creado durante la construcción

- **WHEN** el despliegue #1 llega a Ejecución y su PostgreSQL pasa de `creando` a `disponible` en la segunda consulta
- **THEN** el motor espera, conecta el recurso a la red del proyecto e inyecta `DATABASE_URL`

#### Scenario: Recurso que no termina a tiempo

- **WHEN** el recurso sigue en `creando` tras 2 min
- **THEN** el despliegue continúa con sus variables y la bitácora avisa «PostgreSQL 17 + pgvector todavía se está creando»

#### Scenario: Verificar el alta inicial

- **WHEN** M3 pide `verificarAltaInicial` con dos tipos y el plan solo admite uno más
- **THEN** se lanza `LimiteRecursosDatos` sin crear nada
