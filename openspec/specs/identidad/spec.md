# identidad (M1)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): registro, verificación de correo, inicio y cierre de sesión, recuperación de contraseña, Mi cuenta y roles Cliente / Administrador. Pantallas 01–05 y 28. Dueño: Eddy.

## Purpose

Permitir que un cliente cree una cuenta con correo verificado, entre con una sesión que expira y gestione su perfil y contraseña, y que el administrador tenga un rol distinto.

## Requirements

### Requirement: Registro de cuenta

El sistema SHALL crear una cuenta con correo único y contraseña de al menos 12 caracteres con mayúsculas, minúsculas, número y símbolo. La cuenta SHALL quedar *pendiente de verificación* y con suscripción Sandbox (M2).

#### Scenario: Registro válido

- **WHEN** un visitante envía un correo nuevo y una contraseña válida
- **THEN** se crea la cuenta pendiente de verificación y M10 envía el correo de verificación

#### Scenario: Correo ya registrado

- **WHEN** el correo ya tiene una cuenta
- **THEN** se rechaza el alta y se ofrece iniciar sesión o recuperar contraseña (pantalla 01b)

### Requirement: Verificación de correo

El sistema SHALL activar la cuenta solo con un token de verificación vigente (24 horas) y de un solo uso. El cliente SHALL poder pedir un reenvío tras una cuenta atrás.

#### Scenario: Token válido

- **WHEN** el cliente abre el enlace vigente
- **THEN** la cuenta pasa a Activa y puede iniciar sesión

#### Scenario: Token expirado o usado

- **WHEN** el enlace caducó o ya se usó
- **THEN** se informa que ya no es válido y se ofrece reenviar el correo

### Requirement: Inicio y cierre de sesión

El sistema SHALL emitir una sesión al validar credenciales de una cuenta Activa. La sesión SHALL expirar tras 7 días sin actividad. El sistema SHALL exponer un guard de sesión y el usuario actual para el resto de módulos.

#### Scenario: Credenciales incorrectas

- **WHEN** el correo o la contraseña no coinciden
- **THEN** se muestra un error genérico sin revelar cuál falló

#### Scenario: Cuenta sin verificar

- **WHEN** una cuenta pendiente intenta entrar
- **THEN** se rechaza y se ofrece reenviar el correo de verificación

#### Scenario: Cuenta suspendida

- **WHEN** una cuenta suspendida por administración intenta entrar
- **THEN** se rechaza y se muestra el motivo registrado por M9

### Requirement: Roles

El sistema SHALL distinguir los roles Cliente y Administrador. El administrador se crea por seed. Las rutas de administración SHALL responder 403 a un Cliente.

#### Scenario: Cliente en ruta de administración

- **WHEN** un Cliente con sesión abre una ruta de administración
- **THEN** recibe 403 y ve la pantalla «solo para administración»

### Requirement: Recuperación de contraseña

El sistema SHALL permitir restablecer la contraseña con un token de un solo uso que caduca en 30 minutos. La respuesta a la solicitud SHALL ser neutra (no revela si la cuenta existe). Restablecer SHALL cerrar las demás sesiones.

#### Scenario: Token de recuperación vigente

- **WHEN** el cliente usa el enlace vigente y define una contraseña válida
- **THEN** la contraseña cambia y las sesiones previas quedan invalidadas

### Requirement: Mi cuenta

El cliente SHALL poder editar su nombre (máximo 64 caracteres), ver su correo y rol en solo lectura, cambiar su contraseña con la actual y cerrar sesión en todos los dispositivos.

#### Scenario: Cerrar sesión en todos los dispositivos

- **WHEN** el cliente confirma «Cerrar todas»
- **THEN** todas sus sesiones, incluida la actual, quedan invalidadas y debe iniciar sesión de nuevo

## Fuera de alcance · solo si da el tiempo

- Bitácora de auditoría de todas las operaciones de cuenta (solo se registra la suspensión, en M9).
- Roles Operador de infraestructura y Soporte técnico.
- Cambio de correo y segundo factor.
