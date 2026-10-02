# Spec Delta

## MODIFIED Requirements

### Requirement: Recuperación de contraseña

El sistema SHALL permitir restablecer la contraseña con un token de un solo uso que caduca en 30 minutos. La respuesta a la solicitud SHALL ser neutra (no revela si la cuenta existe). Solo una cuenta Activa SHALL recibir el enlace, y pedir uno nuevo SHALL invalidar el anterior. La nueva contraseña SHALL cumplir la misma política que el registro. Restablecer SHALL cerrar todas las sesiones de la cuenta.

#### Scenario: Solicitud con correo registrado

- **WHEN** el cliente pide recuperar la contraseña de una cuenta Activa
- **THEN** recibe la confirmación neutra y se envía el correo de recuperación con un enlace que caduca en 30 minutos

#### Scenario: Solicitud con correo no registrado

- **WHEN** el cliente pide recuperar la contraseña de un correo que no existe
- **THEN** recibe exactamente la misma confirmación neutra y no se envía ningún correo

#### Scenario: Token de recuperación vigente

- **WHEN** el cliente usa el enlace vigente y define una contraseña válida
- **THEN** la contraseña cambia y las sesiones previas quedan invalidadas

#### Scenario: Token de recuperación vencido

- **WHEN** el cliente abre el enlace 31 minutos después de pedirlo
- **THEN** se informa que el enlace ya no sirve y se ofrece pedir uno nuevo

#### Scenario: Token de recuperación usado

- **WHEN** el cliente usa por segunda vez un enlace con el que ya restableció
- **THEN** se informa que el enlace ya no sirve y la contraseña no cambia

#### Scenario: Nueva solicitud invalida la anterior

- **WHEN** el cliente pide un segundo enlace y luego abre el primero
- **THEN** el primero ya no sirve

#### Scenario: Contraseña débil al restablecer

- **WHEN** la nueva contraseña no cumple la política (12 caracteres, mayúscula, minúscula, número y símbolo)
- **THEN** se rechaza con el requisito que falta y el token sigue vigente
