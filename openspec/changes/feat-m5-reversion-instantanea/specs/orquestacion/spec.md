# Spec Delta

## ADDED Requirements

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
