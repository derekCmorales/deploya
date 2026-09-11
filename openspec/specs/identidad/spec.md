# identidad (M1)

Alcance §6.1: registro, validación de correo, recuperación de contraseña, autenticación, sesiones, roles y bitácora de auditoría. Dueño: Eddy.

## Purpose

Permitir que un cliente cree y use una cuenta con correo verificado, sesión y roles, dejando rastro de auditoría.

## Requirements

### Requirement: Registro de cuenta

El sistema SHALL permitir el alta de una cuenta con correo único y contraseña, en estado pendiente de verificación.

#### Scenario: Registro válido

- **WHEN** un visitante envía correo y contraseña válidos
- **THEN** se crea la cuenta pendiente de verificación y se dispara una notificación M10

### Requirement: Verificación de correo

El sistema SHALL activar la cuenta solo tras confirmar el token de correo.

#### Scenario: Token válido

- **WHEN** el cliente abre el enlace de verificación vigente
- **THEN** el estado de cuenta pasa a activo y puede iniciar sesión

### Requirement: Recuperación de contraseña

El sistema SHALL permitir restablecer la contraseña con un token de un solo uso.

#### Scenario: Token de recuperación

- **WHEN** el cliente solicita recuperación y usa el token vigente
- **THEN** puede definir una nueva contraseña y las sesiones previas quedan invalidadas

### Requirement: Sesiones y roles

El sistema SHALL emitir sesiones con expiración y evaluar roles en las operaciones protegidas. Toda operación de cuenta SHALL registrar un evento de auditoría.
