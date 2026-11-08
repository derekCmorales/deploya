# Spec Delta

## ADDED Requirements

### Requirement: Límite de intentos

El sistema SHALL limitar los intentos de iniciar sesión (5 fallos por IP y correo en 15 minutos), de registrarse (10 por IP por hora) y de pedir correos de verificación o recuperación (3 por correo por hora). Pasado el límite de inicio de sesión o de registro, SHALL responder 429 con `Retry-After`. Pasado el límite de correos, SHALL responder igual que siempre sin mandar el correo. La web SHALL mostrar cuánto falta para volver a intentar.

#### Scenario: Quinto fallo bloquea el inicio de sesión

- **WHEN** desde una IP se falla 5 veces la contraseña de un correo en 15 minutos
- **THEN** el sexto intento responde 429 con `Retry-After` aunque la contraseña sea correcta

#### Scenario: Inicio correcto limpia el conteo

- **WHEN** después de 4 fallos la cuenta entra con la contraseña correcta
- **THEN** el conteo de esa IP y ese correo vuelve a cero

#### Scenario: La ventana vence

- **WHEN** pasan 15 minutos desde el primer fallo
- **THEN** se puede volver a intentar

#### Scenario: Registro en masa

- **WHEN** una IP pide el registro número 11 en una hora
- **THEN** responde 429 y no se crea la cuenta

#### Scenario: Correos sin revelar la cuenta

- **WHEN** se pide la recuperación de un correo por cuarta vez en una hora
- **THEN** la respuesta es la misma de siempre y no se manda ningún correo

#### Scenario: Aviso en la pantalla

- **WHEN** 03 recibe un 429 con `Retry-After: 600`
- **THEN** muestra «Demasiados intentos. Vuelve a intentar en 10 min.»
