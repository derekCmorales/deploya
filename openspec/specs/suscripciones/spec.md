# suscripciones (M2)

Alcance §6.1: catálogo de planes y complementos (§4), contratación con pago simulado, historial, renovación, cambio de plan y aplicación efectiva de cuotas. Dueño: Javier.

## Purpose

Vender y renovar planes cuya cuota se aplica de verdad al orquestador (M5), con pagos simulados.

## Requirements

### Requirement: Catálogo

El sistema SHALL exponer planes Sandbox, Starter, Pro y Business con límites §4.2 y complementos §4.3.

#### Scenario: Listar planes

- **WHEN** un cliente consulta el catálogo
- **THEN** obtiene nombre, precio, vigencia y límites de cada plan activo

### Requirement: Contratación con pago simulado

El cobro SHALL pasar por `PasarelaPago` (sin prefijo `I`). No hay dinero real.

#### Scenario: Contratación aprobada

- **WHEN** el pago simulado se aprueba
- **THEN** la suscripción queda Activa y las cuotas quedan disponibles para M5

### Requirement: Ciclo de vida §4.4

Los estados SHALL ser Activa, Por vencer, Vencida, Suspendida, Cancelada, con los efectos de la propuesta (gracia de cinco días, contenedores detenidos en Suspendida).

#### Scenario: Vencimiento sin renovar

- **WHEN** pasa la fecha de vigencia
- **THEN** el estado es Vencida: entornos en línea, nuevos despliegues bloqueados
