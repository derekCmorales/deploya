# orquestacion (M5)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): correr la imagen en un contenedor aislado con los límites del plan, verificar su salud, reemplazar la versión anterior y detener o borrar contenedores. Pantallas 12b, 13 y 19. Dueño: Derek.

## Purpose

Ejecutar el artefacto con la cuota del plan vía `ContenedorPuerto` y `VerificacionEntornoPuerto`. El orquestador no llama a Docker directamente.

## Requirements

### Requirement: Límites del plan

CPU y memoria SHALL aplicarse al contenedor según `cuotaDe(usuarioId)` (`--cpus`, `--memory`, sin swap adicional). El contenedor SHALL correr sin privilegios (`Privileged: false`, `CapDrop: ALL`, `no-new-privileges`) y en la red propia del proyecto `deploya-p-<subdominio>`, a la que solo se conectan Traefik y el trabajador. El orquestador SHALL pedirlo a `ContenedorPuerto`; nunca llama a Docker directamente.

#### Scenario: Arranque con cuota

- **WHEN** hay un artefacto listo y el plan del dueño es Sandbox
- **THEN** `ContenedorPuerto.crear` recibe `cpus = 0.25` y `memoriaMb = 256`, y `docker inspect` muestra `NanoCpus = 250000000` y `Memory = 268435456`

#### Scenario: Sin privilegios y en su red

- **WHEN** se crea el contenedor de un proyecto
- **THEN** la especificación pide la red `deploya-p-<subdominio>`, sin privilegios y sin capacidades

### Requirement: Verificación de salud

Antes de publicar, el sistema SHALL verificar que el contenedor responde HTTP (cualquier estado menor que 500) en su puerto interno, reintentando cada segundo hasta un máximo de 60 segundos, vía `VerificacionEntornoPuerto`.

#### Scenario: Contenedor saludable

- **WHEN** el contenedor responde
- **THEN** M6 publica la ruta al contenedor nuevo, se detiene el contenedor anterior, el despliegue queda Saludable y pasa a ser el activo del proyecto

#### Scenario: Contenedor que no responde

- **WHEN** vencen los 60 segundos sin respuesta
- **THEN** se elimina el contenedor nuevo, el despliegue queda Fallido con motivo «no respondió en 60 s» y la versión anterior sigue sirviendo

### Requirement: Acciones del cliente

El cliente SHALL poder reiniciar y detener el contenedor activo. Al eliminar el proyecto SHALL borrarse el contenedor, sus imágenes y su ruta. La API SHALL pedir estas acciones por una cola de operación y nunca llamar a Docker directamente. Reiniciar SHALL reutilizar el contenedor activo sin reconstruir ni consumir construcciones.

#### Scenario: Detener

- **WHEN** el cliente detiene un proyecto Saludable
- **THEN** el contenedor se detiene, la ruta se retira y el despliegue queda Detenido

#### Scenario: Reiniciar

- **WHEN** el cliente reinicia un proyecto Saludable
- **THEN** el mismo contenedor vuelve a arrancar, pasa la verificación de salud y el despliegue queda Saludable sin crear uno nuevo

#### Scenario: Reiniciar un proyecto detenido

- **WHEN** el cliente reinicia un proyecto Detenido
- **THEN** el contenedor arranca, la ruta se publica otra vez y el despliegue queda Saludable

#### Scenario: Reinicio que no pasa la salud

- **WHEN** el contenedor reiniciado no responde en 60 segundos
- **THEN** el despliegue queda Fallido con el motivo y la ruta no se publica

#### Scenario: Sin despliegue activo

- **WHEN** el cliente pide reiniciar o detener un proyecto que nunca quedó Saludable
- **THEN** la API responde 409 `sin-despliegue-activo` y no encola nada

#### Scenario: Eliminar borra contenedor, imágenes y ruta

- **WHEN** el cliente elimina un proyecto
- **THEN** su contenedor y sus imágenes `deploya/<subdominio>:*` dejan de existir y el subdominio deja de responder

### Requirement: Suspensión

Si la suscripción pasa a Suspendida o la cuenta se suspende (M9), los contenedores del cliente SHALL detenerse. Los datos se conservan. Al reactivar la suscripción, el sistema SHALL volver a arrancar el despliegue activo de cada proyecto que quedó Detenido. M5 SHALL hacerlo por la cola de operación, sin que M2 ni M9 conozcan Docker.

#### Scenario: Suscripción suspendida

- **WHEN** M2 marca la suscripción como Suspendida
- **THEN** todos los contenedores del cliente se detienen y su configuración se conserva

#### Scenario: Reanudar al renovar

- **WHEN** M2 reactiva la suscripción de un cliente con dos proyectos Detenidos
- **THEN** se encola un `reiniciar` por cada uno y, tras la salud, vuelven a Saludable

#### Scenario: Proyecto sin despliegue activo

- **WHEN** se suspende a un cliente con un proyecto que nunca quedó Saludable
- **THEN** ese proyecto se omite y los demás se detienen

### Requirement: Versionado y retención

Cada construcción exitosa SHALL dejar un artefacto inmutable `deploya/<subdominio>:<n>` con digest, tamaño, commit y receta. Al terminar un despliegue Saludable, el sistema SHALL conservar en el nodo los 5 artefactos más recientes del proyecto más el activo, y SHALL borrar la imagen del resto y marcarlo `disponible = false`.

#### Scenario: Retención de cinco

- **WHEN** el proyecto tiene los artefactos #1 a #7 disponibles y #7 queda Saludable
- **THEN** se borran las imágenes de #1 y #2, quedan disponibles #3 a #7, y #1 y #2 siguen en el historial con `disponible = false`

#### Scenario: El activo nunca se retira

- **WHEN** el activo es #2 (por una reversión) y se construye #8
- **THEN** #2 sigue disponible aunque no esté entre los 5 más recientes

### Requirement: Reversión sin reconstruir

El dueño SHALL poder volver a un artefacto disponible del proyecto sin reconstruir. El sistema SHALL crear un despliegue nuevo con `disparador = reversion` en estado Revirtiendo, con las etapas Recepción y Construcción `omitida`, que sigue Ejecución, Enrutamiento y Operación con los límites y las variables vigentes. La reversión SHALL NOT consumir construcciones del mes. Si la salud falla, la versión activa SHALL NOT cambiar.

#### Scenario: Revertir a una versión disponible

- **WHEN** el activo es #15 y el cliente revierte al artefacto #13, que está disponible
- **THEN** se crea el despliegue #16 en Revirtiendo con Recepción y Construcción omitidas, corre la imagen `deploya/<subdominio>:13`, queda Saludable, pasa a ser el activo y se detiene el contenedor de #15

#### Scenario: No consume construcciones

- **WHEN** un cliente Sandbox con 30 de 30 construcciones usadas revierte
- **THEN** la reversión se acepta

#### Scenario: Artefacto no disponible

- **WHEN** el cliente revierte a un artefacto con `disponible = false`
- **THEN** responde 409 `artefacto-no-disponible` y no se crea despliegue

#### Scenario: Artefacto ya activo

- **WHEN** el cliente revierte al artefacto que ya está activo
- **THEN** responde 409 `artefacto-ya-activo`

#### Scenario: Despliegue en curso

- **WHEN** el proyecto tiene un despliegue Encolado, Construyendo, Aprovisionando, Publicando o Revirtiendo
- **THEN** responde 409 `despliegue-en-curso`

#### Scenario: Reversión que no pasa la salud

- **WHEN** el contenedor de la reversión no responde en 60 segundos
- **THEN** el despliegue queda Fallido, se elimina su contenedor y #15 sigue activo

### Requirement: Bloqueos por suscripción y cuota

Antes de crear un despliegue que construye, el sistema SHALL rechazarlo si la suscripción del dueño está Vencida o Suspendida, o si ya usó todas las construcciones de su plan en el mes calendario actual (UTC). La reversión no construye y SHALL quedar fuera de la cuenta. El rechazo SHALL ocurrir antes de crear el despliegue y llegar a la web con su código.

#### Scenario: Suscripción vencida bloquea el despliegue

- **WHEN** un cliente con la suscripción Vencida pide desplegar
- **THEN** se rechaza con `suscripcion-no-permite`, no se crea ningún despliegue y se ofrece renovar

#### Scenario: Suscripción suspendida bloquea el despliegue

- **WHEN** un cliente con la suscripción Suspendida pide desplegar
- **THEN** se rechaza con `suscripcion-no-permite` y no se crea ningún despliegue

#### Scenario: Cuota de construcciones agotada

- **WHEN** un cliente en Sandbox ya hizo 30 construcciones en el mes y pide otra
- **THEN** se rechaza con `cuota-construcciones-agotada` y se ofrece cambiar de plan

#### Scenario: Dentro de la cuota

- **WHEN** un cliente con la suscripción Activa y construcciones disponibles pide desplegar
- **THEN** el despliegue se crea Encolado

#### Scenario: Mes nuevo, cuota nueva

- **WHEN** un cliente agotó sus construcciones en septiembre y pide desplegar el 1 de octubre (UTC)
- **THEN** el despliegue se crea Encolado

#### Scenario: La reversión no cuenta

- **WHEN** se cuentan las construcciones del mes
- **THEN** los despliegues con disparador `reversion` no se suman

### Requirement: Variables de entorno en el contenedor

Al crear el contenedor, el sistema SHALL pasarle las variables del proyecto descifradas, obtenidas de M3 por `VariablesEntornoPuerto`, además de `PORT` con el puerto interno. La bitácora SHALL registrar cuántas variables se aplicaron y nunca sus claves ni valores. Una variable que no se puede descifrar SHALL hacer fallar el despliegue sin tocar la versión activa.

#### Scenario: Variables llegan al contenedor

- **WHEN** un proyecto con `SALUDO=hola` se despliega
- **THEN** `ContenedorPuerto.crear` recibe `SALUDO=hola` y `PORT` con el puerto interno

#### Scenario: La bitácora no muestra valores

- **WHEN** se aplican tres variables
- **THEN** la bitácora dice «3 variables aplicadas» y no contiene ninguna clave ni valor

#### Scenario: Variable ilegible

- **WHEN** un valor cifrado fue alterado
- **THEN** el despliegue queda Fallido con motivo «variable ilegible» y la versión anterior sigue sirviendo

### Requirement: Métricas de contenedor

El trabajador SHALL tomar una muestra de CPU y memoria por minuto del contenedor activo Saludable de cada proyecto y SHALL purgar las muestras de más de 24 h. La API SHALL devolver la serie de 1 h (por minuto) o 24 h (promedio de cada cubo de 30 min alineado a :00/:30 UTC) con el límite aplicado, el pico de CPU y memoria de las muestras crudas de la ventana, un aviso cuando el contenedor no corre y los despliegues que entraron en la ventana.

#### Scenario: Muestra de un contenedor Saludable

- **WHEN** pasa un minuto con api-tienda Saludable
- **THEN** queda una muestra con su CPU y memoria

#### Scenario: Un Detenido no se muestrea

- **WHEN** el proyecto está Detenido
- **THEN** no se guarda ninguna muestra

#### Scenario: Purga de 24 h

- **WHEN** hay muestras de hace 25 h
- **THEN** se borran en la siguiente corrida

#### Scenario: Promedio cada 30 min

- **WHEN** se piden 24 h
- **THEN** la serie trae 48 puntos promediados

#### Scenario: Pico de la ventana

- **WHEN** se piden 24 h y la memoria llegó a 452 MB a las 14:00
- **THEN** `pico.memoriaMb` es `{ valor: 452, en: 14:00 }` aunque el promedio de ese cubo sea menor

#### Scenario: Despliegues en la ventana

- **WHEN** #14 se publicó hace 5 h
- **THEN** la respuesta incluye `{ version: 14 }` con su hora

## Fuera de alcance · solo si da el tiempo

- Límite de número de procesos y volúmenes persistentes por plan.
