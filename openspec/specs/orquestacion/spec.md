# orquestacion (M5)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): correr la imagen en un contenedor aislado con los límites del plan, verificar su salud, reemplazar la versión anterior y detener o borrar contenedores. Pantallas 12b, 13 y 19. Dueño: Derek.

## Purpose

Ejecutar el artefacto con la cuota del plan vía `ContenedorPuerto` y `VerificacionEntornoPuerto`. El orquestador no llama a Docker directamente.

## Requirements

### Requirement: Límites del plan

CPU y memoria SHALL aplicarse al contenedor según el plan activo (`--cpus`, `--memory`). El contenedor SHALL correr sin privilegios y en una red propia del proyecto.

#### Scenario: Arranque con cuota

- **WHEN** hay un artefacto listo y la suscripción está Activa o Por vencer
- **THEN** el contenedor arranca con los límites del plan

### Requirement: Verificación de salud

Antes de publicar, el sistema SHALL verificar que el contenedor responde HTTP en su puerto interno dentro de un tiempo máximo.

#### Scenario: Contenedor saludable

- **WHEN** el contenedor responde
- **THEN** M6 conmuta el tráfico, se detiene el contenedor anterior y el despliegue queda Saludable

#### Scenario: Contenedor que no responde

- **WHEN** vence el tiempo sin respuesta
- **THEN** el despliegue queda Fallido y la versión anterior sigue sirviendo

### Requirement: Acciones del cliente

El cliente SHALL poder reiniciar y detener el contenedor activo. Al eliminar el proyecto SHALL borrarse el contenedor y sus imágenes.

#### Scenario: Detener

- **WHEN** el cliente detiene un proyecto Saludable
- **THEN** el contenedor se detiene y el despliegue queda Detenido

### Requirement: Suspensión

Si la suscripción pasa a Suspendida o la cuenta se suspende (M9), los contenedores del cliente SHALL detenerse. Los datos se conservan.

#### Scenario: Suscripción suspendida

- **WHEN** M2 marca la suscripción como Suspendida
- **THEN** todos los contenedores del cliente se detienen y su configuración se conserva

## Fuera de alcance · solo si da el tiempo

- Reversión instantánea levantando un artefacto previo sin reconstruir (estado Revirtiendo).
- Límite de número de procesos y volúmenes persistentes por plan.
- Rearrancar automáticamente el último despliegue saludable al renovar tras una suspensión.
