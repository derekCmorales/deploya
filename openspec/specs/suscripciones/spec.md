# suscripciones (M2)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): catálogo fijo de cuatro planes, contratación con pago simulado, Mi suscripción, renovación manual, cambio de plan, historial de pagos y ciclo de vida §4.4. Pantallas 06–09. Dueño: Javier.

## Purpose

Vender y renovar planes cuya cuota se aplica de verdad a proyectos, construcciones y contenedores, con pagos simulados.

## Requirements

### Requirement: Catálogo

El sistema SHALL exponer, sin sesión, los planes Sandbox, Starter, Pro y Business del seed con precio, vigencia (30 o 365 días) y los cuatro recursos: proyectos, CPU por proyecto, memoria por proyecto y construcciones por mes (tabla en `docs/alcance.md`).

#### Scenario: Listar planes

- **WHEN** un visitante o cliente consulta el catálogo
- **THEN** obtiene nombre, precio, vigencia y límites de cada plan activo

### Requirement: Sandbox inicial

Toda cuenta nueva SHALL tener una suscripción Sandbox Activa sin costo y sin vencimiento.

#### Scenario: Cuenta nueva

- **WHEN** se registra una cuenta
- **THEN** tiene una suscripción Sandbox Activa y puede crear un proyecto sin pagar

### Requirement: Contratación con pago simulado

El cobro SHALL pasar por `PasarelaPago` (sin prefijo `I`). No hay dinero real. La pasarela simulada SHALL reconocer tarjetas de prueba que aprueban (`4242 4242 4242 4242`), rechazan (`4000 0000 0000 0002`) y tardan 5 segundos (`4000 0000 0000 3220`).

#### Scenario: Contratación aprobada

- **WHEN** el pago simulado se aprueba
- **THEN** la suscripción queda Activa con su vigencia, se registra el pago con comprobante y las cuotas nuevas aplican de inmediato

#### Scenario: Contratación rechazada

- **WHEN** el pago simulado se rechaza
- **THEN** se registra el pago Rechazado con su motivo y el plan no cambia

### Requirement: Renovación y cambio de plan

La renovación SHALL ser manual («Renovar ahora»). Un ascenso SHALL cobrar el plan completo y arrancar una vigencia nueva desde hoy. Un descenso SHALL aplicar al terminar la vigencia actual.

#### Scenario: Ascenso

- **WHEN** un cliente en Starter cambia a Pro y el pago se aprueba
- **THEN** paga el precio completo de Pro, la vigencia arranca hoy y las cuotas de Pro aplican de inmediato

#### Scenario: Descenso

- **WHEN** un cliente en Pro elige Sandbox
- **THEN** sigue en Pro hasta el fin de la vigencia y después pasa a Sandbox

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

## Fuera de alcance · solo si da el tiempo

- Renovación automática.
- Prorrateo al cambiar de plan.
- Complementos (§4.3).
- Cancelación por el cliente y exportación de datos.
- Límites de almacenamiento, transferencia, retención de bitácoras, dominios, consultas al asistente y miembros.
