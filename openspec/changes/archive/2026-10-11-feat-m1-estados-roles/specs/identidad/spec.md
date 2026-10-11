# Spec Delta

## MODIFIED Requirements

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
