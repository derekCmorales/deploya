# Spec Delta

## MODIFIED Requirements

### Requirement: Catálogo

El sistema SHALL exponer, sin sesión, en `GET /suscripciones/planes`, los planes activos del seed ordenados por `orden`, con `codigo`, `nombre`, `descripcion`, `precio30`, `precio365` (`null` si no se vende anual), `maxProyectos`, `cpus`, `memoriaMb`, `construccionesMes`, `maxRecursosDatos` y `discoDatosMb`. Importes y `cpus` SHALL ir como número. La pantalla 06 (`/planes`) SHALL leerlos de ese endpoint, nunca de constantes, y alternar el precio entre 30 y 365 días.

#### Scenario: Listar planes

- **WHEN** un visitante o cliente consulta el catálogo
- **THEN** obtiene nombre, precio, vigencia y límites de cada plan activo, incluidos los de recursos de datos

#### Scenario: Solo planes activos, ordenados

- **WHEN** un plan está inactivo y los planes llegan desordenados de la base
- **THEN** el catálogo no lo incluye y devuelve el resto por `orden`

#### Scenario: Responde sin sesión

- **WHEN** se pide `GET /suscripciones/planes` sin cookie de sesión
- **THEN** responde los planes con `cpus` y precios como número

## ADDED Requirements

### Requirement: Límites de recursos de datos

Cada plan SHALL tener `maxRecursosDatos` (recursos de datos por cuenta) y `discoDatosMb` (disco por recurso, que se mide y se avisa sin cortar): Sandbox 1 / 512, Starter 3 / 2 048, Pro 10 / 10 240 y Business 25 / 25 600. `cuotaDe` SHALL incluirlos. En autoalojado `maxRecursosDatos` SHALL ser sin límite y `discoDatosMb` el del plan «Autoalojado».

#### Scenario: Límites de recursos de datos por plan

- **WHEN** se siembran los planes de la nube
- **THEN** Sandbox, Starter, Pro y Business tienen 1, 3, 10 y 25 recursos y 512, 2048, 10240 y 25600 MB

#### Scenario: Autoalojado sin tope

- **WHEN** se calcula la cuota de una instalación autoalojada
- **THEN** `maxRecursosDatos` es sin límite y `discoDatosMb` sale del plan «Autoalojado»
