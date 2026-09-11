# notificaciones (M10)

Alcance §6.1: correo transaccional para eventos de cuenta, resultado de despliegues y vencimiento de planes. Dueño: Eddy.

## Purpose

Notificar al cliente por correo (proveedor externo; no hay servidor de correo propio) cuando cambia su cuenta, un despliegue o su plan.

## Requirements

### Requirement: Puerto de correo

El envío SHALL hacerse a través de `CorreoPuerto` (sin prefijo `I`). El módulo no habla con el proveedor concreto.

#### Scenario: Envío de verificación

- **WHEN** M1 pide notificar verificación de correo
- **THEN** M10 entrega el mensaje al adaptador de `CorreoPuerto`

### Requirement: Eventos de despliegue y plan

El sistema SHALL notificar resultado de despliegue (saludable o fallido) y avisos de plan por vencer / vencido / suspendido (§4.4).

#### Scenario: Plan por vencer

- **WHEN** la suscripción entra en Por vencer
- **THEN** el cliente recibe correo y el aviso queda registrado
