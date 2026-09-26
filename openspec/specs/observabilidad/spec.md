# observabilidad (M7)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): estado del despliegue por etapas, bitácora de construcción, resumen e historial del proyecto y consumo del período. Pantallas 12, 13, 14 y parte de 08. Dueño: Eduardo.

## Purpose

Mostrar al cliente en qué etapa va su despliegue, por qué falló y qué versión sirve tráfico, con los datos que producen M4, M5 y M6.

## Requirements

### Requirement: Vista de despliegue

El sistema SHALL mostrar el riel de cinco etapas (Recepción, Construcción, Ejecución, Enrutamiento, Operación) con estado y duración de cada una, y la bitácora de construcción numerada, que se actualiza por polling cada 3 segundos y se puede copiar.

#### Scenario: Construcción en curso

- **WHEN** M4 emite líneas de bitácora
- **THEN** el panel las muestra en orden sin recargar la página

#### Scenario: Construcción fallida

- **WHEN** el despliegue termina en Fallido
- **THEN** se resalta la línea del error y se indica que la versión anterior sigue sirviendo tráfico

### Requirement: Resumen del proyecto

El sistema SHALL mostrar el estado actual, la URL pública, la versión activa (número, commit, digest y tamaño de imagen) y los recursos aplicados del plan.

#### Scenario: Proyecto saludable

- **WHEN** el cliente abre un proyecto con un despliegue Saludable
- **THEN** ve la URL, la versión activa con su digest y los CPU y memoria aplicados por su plan

### Requirement: Historial de despliegues

El sistema SHALL listar los despliegues del proyecto con versión, commit, fecha, duración, estado e imagen, filtrables por todos, saludables y fallidos.

#### Scenario: Filtrar fallidos

- **WHEN** el cliente filtra por fallidos
- **THEN** solo ve los despliegues en estado Fallido

### Requirement: Consumo del período

El sistema SHALL exponer el consumo del período (proyectos y construcciones frente al límite del plan) para Mi suscripción (M2) y la actividad de despliegues de las últimas 12 semanas.

#### Scenario: Consumo cerca del límite

- **WHEN** el cliente abre Mi suscripción
- **THEN** ve proyectos y construcciones usados frente al límite del plan y la fecha en que se reinicia el período

## Fuera de alcance · solo si da el tiempo

- Métricas de CPU, memoria y transferencia en vivo.
- Bitácoras de ejecución del contenedor (runtime).
- Transmisión por WebSocket o SSE (polling alcanza).
- Avisos de cuota por correo.
