# Spec Delta

## MODIFIED Requirements

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
