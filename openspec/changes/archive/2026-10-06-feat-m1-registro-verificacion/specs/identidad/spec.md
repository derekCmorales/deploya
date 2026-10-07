# Spec Delta

Cada requisito conserva completo el texto del spec vivo y solo agrega lo que concreta este change. El reenvío con cuenta atrás sigue siendo requisito: la ficha 02 lo deja para A2 y se implementa en M1-04, así que este change no lo cubre (ver `design.md` y `tasks.md`).

## MODIFIED Requirements

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

El sistema SHALL activar la cuenta solo con un token de verificación vigente (24 horas) y de un solo uso. El cliente SHALL poder pedir un reenvío tras una cuenta atrás.

En la base SHALL guardarse solo la huella del token, nunca el token en claro. El token SHALL consumirse con `POST /identidad/verificacion`, no al abrir el enlace. Un token inexistente, vencido o usado SHALL responder el mismo error (`TokenNoValido`, 410), sin revelar cuál de los tres fue.

#### Scenario: Token válido

- **WHEN** el cliente abre el enlace vigente
- **THEN** la cuenta pasa a Activa y puede iniciar sesión

#### Scenario: Token expirado o usado

- **WHEN** el enlace caducó o ya se usó
- **THEN** se informa que ya no es válido y se ofrece reenviar el correo
