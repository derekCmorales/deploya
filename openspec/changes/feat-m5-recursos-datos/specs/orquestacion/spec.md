# Spec Delta

## MODIFIED Requirements

### Requirement: Variables de entorno en el contenedor

Al crear el contenedor, el sistema SHALL pasarle las variables del proyecto descifradas, obtenidas de M3 por `VariablesEntornoPuerto`, las de sus recursos de datos conectados (propios o compartidos), obtenidas por `RecursosDatosDespliegue`, y `PORT` con el puerto interno. Las variables del usuario SHALL ganar sobre las inyectadas de nombre corto (`DATABASE_URL`, `PG*`, `REDIS_URL`, `S3_*`); las `DEPLOYA_*` SHALL inyectarse siempre y no pisarse. Antes de crear el contenedor, cada recurso disponible SHALL quedar conectado a la red del proyecto. Si el proyecto define `comandoInicio`, SHALL reemplazar el `CMD` de la imagen, partido en argumentos y sin shell, también en una reversión. La bitácora SHALL registrar cuántas variables se aplicaron, qué recursos se conectaron y cuántas variables se inyectaron, y nunca sus claves ni valores. Una variable que no se puede descifrar SHALL hacer fallar el despliegue sin tocar la versión activa.

#### Scenario: Variables llegan al contenedor

- **WHEN** un proyecto con `SALUDO=hola` se despliega
- **THEN** `ContenedorPuerto.crear` recibe `SALUDO=hola` y `PORT` con el puerto interno

#### Scenario: La bitácora no muestra valores

- **WHEN** se aplican tres variables
- **THEN** la bitácora dice «3 variables aplicadas» y no contiene ninguna clave ni valor

#### Scenario: Variable ilegible

- **WHEN** un valor cifrado fue alterado
- **THEN** el despliegue queda Fallido con motivo «variable ilegible» y la versión anterior sigue sirviendo

#### Scenario: Variables inyectadas

- **WHEN** un proyecto con su `postgres` y un `redis` compartido se despliega
- **THEN** el contenedor recibe `DATABASE_URL`, `PG*`, `REDIS_URL`, `DEPLOYA_POSTGRES_URL` y `DEPLOYA_REDIS_URL`, y el `redis` queda conectado a la red del proyecto

#### Scenario: Variables del usuario ganan

- **WHEN** el proyecto ya define `DATABASE_URL`
- **THEN** el contenedor recibe la del usuario y además `DEPLOYA_POSTGRES_URL`

#### Scenario: Las DEPLOYA_* siempre se inyectan

- **WHEN** el usuario define una variable `DEPLOYA_REDIS_URL`
- **THEN** el contenedor recibe la que inyecta Deploya

#### Scenario: Bitácora sin valores

- **WHEN** se conectan un `postgres` y un `redis`
- **THEN** la bitácora dice «Recursos de datos conectados: PostgreSQL 17 + pgvector, Redis 7 · N variables inyectadas» sin ninguna clave ni valor

#### Scenario: Sobrevive al redespliegue

- **WHEN** el proyecto se despliega otra vez, se revierte o se reinicia
- **THEN** sus recursos de datos no se borran ni se recrean y los datos siguen ahí

#### Scenario: Comando de inicio

- **WHEN** el proyecto tiene `comandoInicio` = `node dist/worker-optimizer.main.js --cola "optimizar imagenes"`
- **THEN** el contenedor arranca con `Cmd` = `["node", "dist/worker-optimizer.main.js", "--cola", "optimizar imagenes"]`; sin comando usa el de la imagen

#### Scenario: Comando de inicio en la reversión

- **WHEN** se revierte a una versión anterior después de cambiar `comandoInicio`
- **THEN** el contenedor de esa versión arranca con el comando actual del proyecto

### Requirement: Suspensión

Si la suscripción pasa a Suspendida o la cuenta se suspende (M9), los contenedores del cliente SHALL detenerse, y también sus recursos de datos (estado `detenido`, volumen intacto). Los datos se conservan. Al reactivar la suscripción, el sistema SHALL volver a arrancar el despliegue activo de cada proyecto que quedó Detenido y los recursos de datos detenidos. M5 SHALL hacerlo por las colas de operación y de datos, sin que M2 ni M9 conozcan Docker.

#### Scenario: Suscripción suspendida

- **WHEN** M2 marca la suscripción como Suspendida
- **THEN** todos los contenedores del cliente se detienen y su configuración se conserva

#### Scenario: Reanudar al renovar

- **WHEN** M2 reactiva la suscripción de un cliente con dos proyectos Detenidos
- **THEN** se encola un `reiniciar` por cada uno y, tras la salud, vuelven a Saludable

#### Scenario: Proyecto sin despliegue activo

- **WHEN** se suspende a un cliente con un proyecto que nunca quedó Saludable
- **THEN** ese proyecto se omite y los demás se detienen

#### Scenario: Suspensión detiene

- **WHEN** se suspende a un cliente con un `postgres` disponible
- **THEN** su contenedor se detiene, el volumen queda y el recurso pasa a `detenido`

#### Scenario: Reactivación inicia

- **WHEN** se reactiva al cliente
- **THEN** cada recurso `detenido` vuelve a arrancar y queda `disponible`

## ADDED Requirements

### Requirement: Recursos de datos al eliminar el proyecto

Al eliminar un proyecto, el trabajador SHALL borrar sus recursos de datos con su volumen y su ruta `<subdominio>-s3`, y SHALL desconectar de su red los recursos de otros proyectos compartidos con él. Las filas caen en cascada en la base; Docker no, por eso lo hace `EliminarManejador`.

#### Scenario: Eliminar proyecto dueño

- **WHEN** se elimina el proyecto dueño de un `postgres`
- **THEN** el contenedor y el volumen dejan de existir y la ruta `<subdominio>-s3` se retira

#### Scenario: Eliminar proyecto con el que se comparte

- **WHEN** se elimina un proyecto con el que solo se comparte un recurso
- **THEN** el recurso se desconecta de su red y sigue disponible para el dueño
