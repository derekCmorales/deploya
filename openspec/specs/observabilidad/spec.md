# observabilidad (M7)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): estado del despliegue por etapas, bitácora de construcción, resumen e historial del proyecto y consumo del período. Pantallas 12, 13, 14 y parte de 08. Dueño: Eduardo.

## Purpose

Mostrar al cliente en qué etapa va su despliegue, por qué falló y qué versión sirve tráfico, con los datos que producen M4, M5 y M6.

## Requirements

### Requirement: Vista de despliegue

El sistema SHALL mostrar el riel de cinco etapas (Recepción, Construcción, Ejecución, Enrutamiento, Operación) con estado y duración de cada una, y la bitácora de construcción numerada, que se actualiza por polling cada 3 segundos y se puede copiar. El polling SHALL detenerse cuando el despliegue termina. La vista SHALL abrirse por el número del despliegue dentro de su proyecto.

#### Scenario: Construcción en curso

- **WHEN** M4 emite líneas de bitácora
- **THEN** el panel las muestra en orden sin recargar la página

#### Scenario: Construcción fallida

- **WHEN** el despliegue termina en Fallido
- **THEN** se resalta la línea del error y se indica que la versión anterior sigue sirviendo tráfico

#### Scenario: Despliegue saludable

- **WHEN** el despliegue termina en Saludable
- **THEN** se muestran la URL pública con «Visitar», el digest de la imagen, la receta con la que se construyó y los recursos aplicados

#### Scenario: Copiar bitácora

- **WHEN** el cliente pulsa «Copiar»
- **THEN** se copia la bitácora completa con número, hora y texto de cada línea

#### Scenario: El polling termina con el despliegue

- **WHEN** la API responde `terminado = true`
- **THEN** la vista deja de pedir la bitácora y el estado

### Requirement: Resumen del proyecto

El sistema SHALL mostrar el estado actual, la URL pública, la versión activa (número, commit, digest y tamaño de imagen), los recursos aplicados del plan y la línea de tiempo del último despliegue, con las acciones Visitar, Reiniciar, Detener y Desplegar.

#### Scenario: Proyecto saludable

- **WHEN** el cliente abre un proyecto con un despliegue Saludable
- **THEN** ve la URL, la versión activa con su digest y los CPU y memoria aplicados por su plan

#### Scenario: Proyecto sin despliegue Saludable

- **WHEN** el cliente abre un proyecto cuyo único despliegue terminó Fallido
- **THEN** no ve versión activa ni URL y el último despliegue aparece con su estado y un enlace a su vista

#### Scenario: Línea de tiempo del último despliegue

- **WHEN** el último despliegue terminó Saludable
- **THEN** la línea de tiempo muestra Commit recibido, Imagen construida, Contenedor iniciado y Tráfico redirigido con su hora

### Requirement: Historial de despliegues

El sistema SHALL listar los despliegues del proyecto con versión, commit, fecha, duración, estado e imagen, filtrables por todos, saludables y fallidos, de 20 en 20 del más reciente al más antiguo, con la versión activa resaltada. Por fila SHALL ofrecer la acción que corresponda: revertir (artefacto disponible y no activo), redesplegar o reintentar (fallido).

#### Scenario: Filtrar fallidos

- **WHEN** el cliente filtra por fallidos
- **THEN** solo ve los despliegues en estado Fallido

#### Scenario: Cargar más

- **WHEN** el proyecto tiene 25 despliegues y el cliente pide «Cargar más»
- **THEN** ve los 5 más antiguos sin repetir ninguno de los 20 primeros

#### Scenario: Fila activa marcada

- **WHEN** el activo es #13 y el más reciente es #14 Fallido
- **THEN** #13 aparece como «Versión activa» y #14 ofrece «Reintentar»

#### Scenario: Imagen retirada

- **WHEN** una fila tiene su artefacto con `disponible = false`
- **THEN** la acción de revertir aparece deshabilitada con «imagen retirada»

### Requirement: Consumo del período

El sistema SHALL exponer el consumo del período (proyectos y construcciones frente al límite del plan) para Mi suscripción (M2) y la actividad de despliegues de las últimas 12 semanas. El período SHALL ser el mes calendario UTC, el mismo que usa el bloqueo de construcciones, y la reversión SHALL NOT contar como construcción.

#### Scenario: Consumo cerca del límite

- **WHEN** el cliente abre Mi suscripción
- **THEN** ve proyectos y construcciones usados frente al límite del plan y la fecha en que se reinicia el período

#### Scenario: Mes nuevo

- **WHEN** el cliente hizo 28 construcciones en septiembre y abre Mi suscripción el 1 de octubre (UTC)
- **THEN** ve 0 construcciones usadas y «Se reinicia el 1 nov»

#### Scenario: Actividad de 12 semanas

- **WHEN** el cliente abre el resumen de un proyecto con 38 despliegues en las últimas 12 semanas, 2 fallidos
- **THEN** ve el mapa de 84 días con «12 semanas · 38 despliegues · 2 con fallo»

## Fuera de alcance · solo si da el tiempo

- Métricas de CPU, memoria y transferencia en vivo.
- Bitácoras de ejecución del contenedor (runtime).
- Transmisión por WebSocket o SSE (polling alcanza).
- Avisos de cuota por correo.
