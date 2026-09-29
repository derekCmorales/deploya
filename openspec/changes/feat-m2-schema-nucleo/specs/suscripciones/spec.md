# Spec Delta

## MODIFIED Requirements

### Requirement: Catálogo

El sistema SHALL exponer, sin sesión, en `GET /suscripciones/planes`, los planes activos del seed ordenados por `orden`, con `codigo`, `nombre`, `descripcion`, `precio30`, `precio365` (`null` si no se vende anual), `maxProyectos`, `cpus`, `memoriaMb` y `construccionesMes`. Importes y `cpus` SHALL ir como número. La pantalla 06 (`/planes`) SHALL leerlos de ese endpoint, nunca de constantes, y alternar el precio entre 30 y 365 días.

#### Scenario: Listar planes

- **WHEN** un visitante o cliente consulta el catálogo
- **THEN** obtiene nombre, precio, vigencia y límites de cada plan activo

#### Scenario: Solo planes activos, ordenados

- **WHEN** un plan está inactivo y los planes llegan desordenados de la base
- **THEN** el catálogo no lo incluye y devuelve el resto por `orden`

#### Scenario: Responde sin sesión

- **WHEN** se pide `GET /suscripciones/planes` sin cookie de sesión
- **THEN** responde los planes con `cpus` y precios como número

### Requirement: Sandbox inicial

Toda cuenta nueva SHALL tener una suscripción Sandbox Activa sin costo y sin vencimiento. `asignarSandbox` SHALL ser idempotente y `cuotaDe` SHALL lanzar `SuscripcionNoEncontrada` si la cuenta no tiene suscripción.

#### Scenario: Cuenta nueva

- **WHEN** se registra una cuenta
- **THEN** tiene una suscripción Sandbox Activa y puede crear un proyecto sin pagar

#### Scenario: Asignar Sandbox dos veces

- **WHEN** se llama a `asignarSandbox` de nuevo para la misma cuenta
- **THEN** no se crea otra suscripción

#### Scenario: Cuota por plan

- **WHEN** un servicio pide `cuotaDe` de una cuenta en Sandbox, Starter, Pro o Business
- **THEN** recibe proyectos, CPU, memoria y construcciones por mes de ese plan

#### Scenario: Cuenta sin suscripción

- **WHEN** se pide `cuotaDe` de una cuenta sin suscripción
- **THEN** se lanza `SuscripcionNoEncontrada`

## ADDED Requirements

### Requirement: Seed idempotente

El seed SHALL crear o actualizar por clave natural los cuatro planes v4.1, el administrador (`ADMIN_CORREO`, `ADMIN_CLAVE` obligatoria) y `cliente@deploya.app`, ambos activos y con Sandbox, sin reescribir contraseñas existentes.

#### Scenario: Dos corridas

- **WHEN** el seed corre dos veces
- **THEN** quedan los mismos registros

#### Scenario: Falta la clave del administrador

- **WHEN** el seed corre sin `ADMIN_CLAVE`
- **THEN** falla con un mensaje claro y no escribe nada
