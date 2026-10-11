# identidad (M1)

Alcance núcleo v4.1 ([docs/alcance.md](../../../docs/alcance.md)): registro, verificación de correo, inicio y cierre de sesión, recuperación de contraseña, Mi cuenta y roles Cliente / Administrador. Pantallas 01–05 y 28. Dueño: Eddy.

## Purpose

Permitir que un cliente cree una cuenta con correo verificado, entre con una sesión que expira y gestione su perfil y contraseña, y que el administrador tenga un rol distinto.

## Requirements

### Requirement: Registro de cuenta

El sistema SHALL crear una cuenta con correo único y contraseña de al menos 12 caracteres con mayúsculas, minúsculas, número y símbolo. La cuenta SHALL quedar *pendiente de verificación* y con suscripción Sandbox (M2).

El correo SHALL compararse sin distinguir mayúsculas ni espacios, y la API SHALL aplicar las mismas reglas de contraseña que muestra la web. La contraseña SHALL guardarse solo como hash. La cuenta nueva SHALL tener rol Cliente. Si el correo de verificación no se puede enviar, la cuenta SHALL quedar creada y la respuesta SHALL indicarlo (`correoEnviado: false`). La respuesta SHALL traer el correo enmascarado para la pantalla 01b.

#### Scenario: Registro válido

- **WHEN** un visitante envía un correo nuevo y una contraseña válida
- **THEN** se crea la cuenta pendiente de verificación y M10 envía el correo de verificación

#### Scenario: Correo ya registrado

- **WHEN** el correo ya tiene una cuenta
- **THEN** se rechaza el alta y se ofrece iniciar sesión o recuperar contraseña (pantalla 01b)

#### Scenario: Contraseña débil

- **WHEN** la contraseña no cumple alguna regla
- **THEN** se rechaza con `ContrasenaDebil` (400) y la lista de reglas incumplidas, sin crear la cuenta

#### Scenario: Falla del correo al registrarse

- **WHEN** `CorreoPuerto` lanza `CorreoNoEnviado`
- **THEN** la cuenta queda creada y la respuesta indica `correoEnviado: false`

### Requirement: Verificación de correo

El sistema SHALL activar la cuenta solo con un token de verificación vigente (24 horas) y de un solo uso. El cliente SHALL poder pedir un reenvío tras una cuenta atrás de 60 segundos; el reenvío SHALL invalidar el token anterior y su respuesta SHALL ser neutra.

En la base SHALL guardarse solo la huella del token, nunca el token en claro. El token SHALL consumirse con `POST /identidad/verificacion`, no al abrir el enlace. Un token inexistente, vencido o usado SHALL responder el mismo error (`TokenNoValido`, 410), sin revelar cuál de los tres fue.

#### Scenario: Token válido

- **WHEN** el cliente abre el enlace vigente
- **THEN** la cuenta pasa a Activa y puede iniciar sesión

#### Scenario: Token expirado o usado

- **WHEN** el enlace caducó o ya se usó
- **THEN** se informa que ya no es válido y se ofrece reenviar el correo

#### Scenario: Reenviar verificación

- **WHEN** una cuenta pendiente pide reenviar el correo pasada la cuenta atrás
- **THEN** recibe un enlace nuevo de 24 horas y el anterior deja de servir

#### Scenario: Reenvío antes de la cuenta atrás

- **WHEN** el cliente pide otro reenvío antes de 60 segundos
- **THEN** se rechaza indicando cuántos segundos faltan y no se envía correo

#### Scenario: Reenvío a una cuenta ya activa

- **WHEN** se pide reenviar la verificación de una cuenta Activa o de un correo que no existe
- **THEN** la respuesta es la misma confirmación neutra y no se envía correo

### Requirement: Inicio y cierre de sesión

El sistema SHALL emitir una sesión al validar credenciales de una cuenta Activa. La sesión SHALL expirar tras 7 días sin actividad. El sistema SHALL exponer un guard de sesión y el usuario actual para el resto de módulos.

El token de la sesión SHALL viajar solo en una cookie HttpOnly y en la base SHALL guardarse solo su huella. Cerrar sesión SHALL revocarla. Las rutas de proyectos y despliegues SHALL responder 401 sin una sesión vigente. Una cuenta suspendida SHALL ver el motivo y la fecha que registró M9, y una sesión vencida SHALL llevar a iniciar sesión con el aviso «Sesión expirada».

#### Scenario: Credenciales válidas

- **WHEN** una cuenta Activa envía su correo y contraseña
- **THEN** recibe la cookie de sesión y la respuesta trae solo su usuario

#### Scenario: Credenciales incorrectas

- **WHEN** el correo o la contraseña no coinciden
- **THEN** se muestra un error genérico sin revelar cuál falló

#### Scenario: Cuenta sin verificar

- **WHEN** una cuenta pendiente intenta entrar
- **THEN** se rechaza y se ofrece reenviar el correo de verificación

#### Scenario: Cuenta suspendida

- **WHEN** una cuenta suspendida por administración intenta entrar
- **THEN** se rechaza y se muestra el motivo registrado por M9 y la fecha de la suspensión

#### Scenario: Sesión expirada

- **WHEN** pasan 7 días sin actividad
- **THEN** el token ya no resuelve a ningún usuario, la ruta protegida responde 401 y la web lleva a `/ingresar` con el aviso «Sesión expirada»

#### Scenario: Ruta protegida sin sesión

- **WHEN** alguien sin cookie de sesión vigente pide `/proyectos` o un despliegue
- **THEN** la API responde 401 y la web lleva a `/ingresar`

#### Scenario: Cerrar sesión

- **WHEN** el usuario cierra sesión
- **THEN** la sesión queda revocada y la cookie vencida

### Requirement: Roles

El sistema SHALL distinguir los roles Cliente y Administrador. El administrador se crea por seed. M1 SHALL exportar un guard de rol para que los demás módulos protejan sus rutas. Las rutas de administración SHALL responder 403 a un Cliente.

#### Scenario: Cliente en ruta de administración

- **WHEN** un Cliente con sesión abre una ruta de administración
- **THEN** recibe 403 y ve la pantalla «solo para administración»

#### Scenario: Administrador en ruta de administración

- **WHEN** el administrador del seed abre una ruta de administración
- **THEN** la ruta responde normalmente

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

### Requirement: Mi cuenta

El cliente SHALL poder editar su nombre (máximo 64 caracteres), ver su correo y rol en solo lectura, cambiar su contraseña con la actual y cerrar sesión en todos los dispositivos.

#### Scenario: Cerrar sesión en todos los dispositivos

- **WHEN** el cliente confirma «Cerrar todas»
- **THEN** todas sus sesiones, incluida la actual, quedan invalidadas y debe iniciar sesión de nuevo

## Fuera de alcance · solo si da el tiempo

- Bitácora de auditoría de todas las operaciones de cuenta (solo se registra la suspensión, en M9).
- Roles Operador de infraestructura y Soporte técnico.
- Cambio de correo y segundo factor.
