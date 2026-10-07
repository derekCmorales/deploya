# suscripciones (M2)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): catálogo fijo de cuatro planes, contratación con pago simulado, Mi suscripción, renovación manual, cambio de plan, historial de pagos y ciclo de vida §4.4. Pantallas 06–09. Dueño: Javier.

## Purpose

Vender y renovar planes cuya cuota se aplica de verdad a proyectos, construcciones y contenedores, con pagos simulados.

## Requirements

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

### Requirement: Contratación con pago simulado

El cobro SHALL pasar por `PasarelaPago` (sin prefijo `I`). No hay dinero real. La pasarela simulada SHALL reconocer tarjetas de prueba que aprueban (`4242 4242 4242 4242`), rechazan (`4000 0000 0000 0002`, «Fondos insuficientes (simulado).») y tardan 5 segundos (`4000 0000 0000 3220`); cualquier otra se rechaza. `POST /suscripciones/contratar` SHALL exigir sesión, validar plan, vigencia (30 o 365 días) y tarjeta, y responder 200 con `resultado: "aprobado"` o `"rechazado"`. Del número de tarjeta solo se guardan los últimos 4 dígitos. Los pagos aprobados SHALL llevar comprobante `DPY-AAAA-NNNNNN` consecutivo por año; los rechazados, ninguno. La pantalla 07 (`/planes/contratar`) SHALL mostrar el resumen que calcula `GET /suscripciones/cotizacion` y la 07b los estados Procesando, Aprobado y Rechazado.

#### Scenario: Contratación aprobada

- **WHEN** el pago simulado se aprueba
- **THEN** la suscripción queda Activa con su vigencia, se registra el pago con comprobante y las cuotas nuevas aplican de inmediato

#### Scenario: Contratación rechazada

- **WHEN** el pago simulado se rechaza
- **THEN** se registra el pago Rechazado con su motivo y el plan no cambia

#### Scenario: Tarjeta que tarda

- **WHEN** se paga con `4000 0000 0000 3220`
- **THEN** la pasarela espera 5 segundos y aprueba

#### Scenario: Tarjeta que no es de prueba

- **WHEN** se paga con un número que no es de prueba
- **THEN** la pasarela lo rechaza con `card_not_supported`

#### Scenario: Comprobante consecutivo

- **WHEN** se aprueban dos pagos en el mismo año con un rechazo entre ellos
- **THEN** los comprobantes son `DPY-AAAA-000001` y `DPY-AAAA-000002`

### Requirement: Renovación y cambio de plan

La renovación SHALL ser manual («Renovar ahora»): cobra el plan actual y suma la vigencia al final de la actual, o desde hoy si ya terminó. Un ascenso SHALL cobrar el plan completo y arrancar una vigencia nueva desde hoy. Un descenso SHALL no cobrarse: se programa con `POST /suscripciones/descenso` y aplica al terminar la vigencia actual (lo ejecuta el ciclo §4.4). Pagar por un plan de menor nivel con la vigencia en curso SHALL rechazarse con `es-descenso`. Un pago aprobado cancela el descenso pendiente.

#### Scenario: Ascenso

- **WHEN** un cliente en Starter cambia a Pro y el pago se aprueba
- **THEN** paga el precio completo de Pro, la vigencia arranca hoy y las cuotas de Pro aplican de inmediato

#### Scenario: Descenso

- **WHEN** un cliente en Pro elige Sandbox
- **THEN** sigue en Pro hasta el fin de la vigencia y después pasa a Sandbox

#### Scenario: Renovar ahora

- **WHEN** un cliente en Starter con 9 días restantes renueva 30 días
- **THEN** paga Starter y su vigencia termina 30 días después de la fecha en que vencía

#### Scenario: Bajar de plan no se cobra

- **WHEN** un cliente en Pro con la vigencia en curso intenta pagar Starter
- **THEN** se rechaza con `es-descenso` y no se registra ningún pago

### Requirement: Historial de pagos

El sistema SHALL listar los pagos del cliente con fecha, concepto, monto, estado y comprobante descargable en PDF, indicando que es simulado y sin valor fiscal.

#### Scenario: Descargar comprobante

- **WHEN** el cliente abre un pago y pide el PDF
- **THEN** descarga un comprobante con número, fecha, concepto, vigencia, método y total

### Requirement: Cuotas aplicadas

El sistema SHALL impedir crear proyectos por encima del límite del plan y lanzar construcciones por encima del límite mensual, y SHALL exponer el consumo del período.

#### Scenario: Límite de proyectos

- **WHEN** un cliente en Starter con 3 proyectos intenta crear otro
- **THEN** el alta se rechaza y se ofrece cambiar de plan

### Requirement: Ciclo de vida §4.4

Una tarea diaria SHALL mover las suscripciones entre Activa, Por vencer (siete días o menos), Vencida (gracia de cinco días: entornos en línea, altas y despliegues bloqueados), Suspendida (contenedores detenidos vía M5, datos conservados) y Cancelada (treinta días suspendida).

#### Scenario: Vencimiento sin renovar

- **WHEN** pasa la fecha de vigencia
- **THEN** el estado es Vencida: los entornos siguen en línea y los nuevos despliegues se bloquean

#### Scenario: Fin de la gracia

- **WHEN** pasan cinco días en Vencida sin renovar
- **THEN** el estado es Suspendida y M5 detiene los contenedores

### Requirement: Seed idempotente

El seed SHALL crear o actualizar por clave natural los cuatro planes v4.1, el administrador (`ADMIN_CORREO`, `ADMIN_CLAVE` obligatoria) y `cliente@deploya.app`, ambos activos y con Sandbox, sin reescribir contraseñas existentes.

#### Scenario: Dos corridas

- **WHEN** el seed corre dos veces
- **THEN** quedan los mismos registros

#### Scenario: Falta la clave del administrador

- **WHEN** el seed corre sin `ADMIN_CLAVE`
- **THEN** falla con un mensaje claro y no escribe nada

### Requirement: Mi suscripción

`GET /suscripciones/mia` SHALL devolver, con sesión, el plan con sus límites, el estado, la vigencia (inicio, vence, días restantes), el precio de renovar y el descenso programado. La pantalla 08 (`/suscripcion`) SHALL mostrar el plan actual con `EstadoSuscripcion`, la barra de vigencia, «Renovar ahora», el consumo de proyectos frente al límite y el panel «Cambiar plan» (ascenso hacia 07, descenso programado).

#### Scenario: Ver mi suscripción

- **WHEN** un cliente en Starter que vence en 9 días abre Mi suscripción
- **THEN** ve Starter Activa, USD 5.00 / 30 días, 9 días restantes y sus límites

#### Scenario: Cotizar antes de pagar

- **WHEN** un cliente en Sandbox abre Contratar Starter
- **THEN** ve el monto, el inicio y el fin que se aplicarán, sin registrar ningún pago

#### Scenario: Sin sesión

- **WHEN** se pide cualquier ruta de `CobroController` sin cookie de sesión
- **THEN** `SesionGuard` responde 401

## Fuera de alcance · solo si da el tiempo

- Renovación automática.
- Prorrateo al cambiar de plan.
- Complementos (§4.3).
- Cancelación por el cliente y exportación de datos.
- Límites de almacenamiento, transferencia, retención de bitácoras, dominios, consultas al asistente y miembros.
