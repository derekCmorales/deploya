# Spec Delta

## MODIFIED Requirements

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
