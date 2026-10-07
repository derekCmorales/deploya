# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
