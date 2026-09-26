# notificaciones (M10)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): correos transaccionales de verificación de cuenta y recuperación de contraseña. Pantalla 24. Dueño: Eddy.

## Purpose

Entregar por correo los enlaces que M1 necesita, a través de un proveedor externo (no hay servidor de correo propio).

## Requirements

### Requirement: Puerto de correo

El envío SHALL hacerse a través de `CorreoPuerto` (sin prefijo `I`). El módulo no habla con el proveedor concreto. En desarrollo SHALL existir un adaptador que entregue a Mailpit o a la consola.

#### Scenario: Envío de verificación

- **WHEN** M1 pide notificar la verificación de correo
- **THEN** M10 entrega el mensaje al adaptador de `CorreoPuerto` y el correo aparece en Mailpit

### Requirement: Plantillas

El sistema SHALL tener dos plantillas en español con el kit visual: verificación de cuenta (caduca en 24 horas) y recuperación de contraseña (un solo uso, caduca en 30 minutos). Ambas SHALL incluir el enlace en texto plano por si el botón no funciona.

#### Scenario: Correo de recuperación

- **WHEN** M1 pide notificar una recuperación de contraseña
- **THEN** el cliente recibe la plantilla de recuperación con el botón y el enlace en texto plano

## Fuera de alcance · solo si da el tiempo

- Correos de resultado de despliegue (Saludable / Fallido).
- Avisos de plan Por vencer, Vencido y Suspendido (§4.4); en el núcleo esos estados solo se ven en el panel.
- Avisos por proximidad al límite de cuota.
