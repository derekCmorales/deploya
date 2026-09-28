# Spec Delta

## MODIFIED Requirements

### Requirement: Registro de cuenta

El sistema SHALL crear una cuenta con correo único (sin distinguir mayúsculas ni espacios) y contraseña de al menos 12 caracteres con mayúsculas, minúsculas, número y símbolo; la API aplica las mismas reglas que muestra la web. La contraseña SHALL guardarse solo como hash. La cuenta SHALL quedar *pendiente de verificación*, con rol Cliente y con suscripción Sandbox pedida a M2. La respuesta SHALL traer el correo enmascarado para la pantalla 01b.

#### Scenario: Registro válido

- **WHEN** un visitante envía un correo nuevo y una contraseña válida
- **THEN** se crea la cuenta pendiente de verificación, se pide a M2 la suscripción Sandbox y M10 envía el correo de verificación con el enlace a `/verificar?token=`

#### Scenario: Correo ya registrado

- **WHEN** el correo ya tiene una cuenta
- **THEN** se rechaza el alta con `CorreoYaRegistrado` (409) y la pantalla 01b ofrece iniciar sesión o recuperar contraseña

#### Scenario: Contraseña débil

- **WHEN** la contraseña no cumple alguna regla
- **THEN** se rechaza con `ContrasenaDebil` (400) y la lista de reglas incumplidas, sin crear la cuenta

#### Scenario: Falla del correo al registrarse

- **WHEN** `CorreoPuerto` lanza `CorreoNoEnviado`
- **THEN** la cuenta queda creada y la respuesta indica `correoEnviado: false`

### Requirement: Verificación de correo

El sistema SHALL activar la cuenta solo con un token de verificación vigente (24 horas) y de un solo uso. En la base SHALL guardarse solo la huella del token. El token SHALL consumirse con `POST /identidad/verificacion`. El reenvío con cuenta atrás llega en M1-04.

#### Scenario: Token válido

- **WHEN** el cliente abre el enlace vigente
- **THEN** la cuenta pasa a Activa y la pantalla 02 ofrece iniciar sesión

#### Scenario: Token expirado o usado

- **WHEN** el enlace caducó (24 horas), ya se usó o no existe
- **THEN** la API responde `TokenNoValido` (410) sin revelar cuál de los tres fue y la pantalla 02 dice «El enlace ya no es válido»
