# motor-construccion (M4)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): cola de trabajos, clonado del repositorio, construcción con el `Dockerfile` del cliente, artefacto versionado y bitácora de construcción. Pantallas 12 y 14. Dueño: Derek.

## Purpose

Convertir un commit de un proyecto en una imagen versionada, fuera del ciclo HTTP, dejando cada línea de bitácora disponible para M7.

## Requirements

### Requirement: Recepción y cola

Al registrar un despliegue, el trabajo SHALL encolarse en Redis (BullMQ). El trabajador no corre en el ciclo HTTP. La API SHALL rechazar el despliegue si la suscripción está Vencida o Suspendida o si se agotaron las construcciones del mes.

#### Scenario: Encolar

- **WHEN** la API registra un despliegue
- **THEN** el estado es Encolado y existe un trabajo en la cola

### Requirement: Construcción con Dockerfile

El trabajador SHALL clonar la rama, registrar el commit y ejecutar `docker build` con el `Dockerfile` del repositorio, con un tiempo máximo de construcción.

#### Scenario: Construcción exitosa

- **WHEN** `docker build` termina bien
- **THEN** se registra un artefacto con número de versión, digest y tamaño, y el despliegue pasa a Ejecución (M5)

#### Scenario: Construcción fallida

- **WHEN** `docker build` falla o excede el tiempo
- **THEN** el despliegue queda Fallido con el código de salida y la versión anterior sigue sirviendo

### Requirement: Bitácora

Cada línea de la construcción SHALL persistirse con número, marca de tiempo y etapa, y consultarse desde una posición (`desde=`).

#### Scenario: Leer desde una posición

- **WHEN** el panel pide la bitácora desde la línea 10
- **THEN** recibe solo las líneas posteriores, en orden

### Requirement: Acciones sobre despliegues

El cliente SHALL poder cancelar un despliegue en curso, reintentar uno fallido y redesplegar un commit anterior. Redesplegar **reconstruye** ese commit desde su `Dockerfile`.

#### Scenario: Cancelar

- **WHEN** el cliente cancela un despliegue en Encolado o Construyendo
- **THEN** el trabajo se detiene, el despliegue queda Cancelado y la versión activa no cambia

## Fuera de alcance · solo si da el tiempo

- Detección de stack y recetas sin `Dockerfile`.
- Reutilizar un artefacto ya construido para revertir sin reconstruir.
