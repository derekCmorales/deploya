# Spec Delta

## MODIFIED Requirements

### Requirement: Plantillas

El sistema SHALL tener dos plantillas en español con el kit visual: verificación de cuenta (caduca en 24 horas) y recuperación de contraseña (un solo uso, caduca en 30 minutos). Ambas SHALL incluir el enlace en texto plano por si el botón no funciona. La de recuperación SHALL decir que el enlace caduca en 30 minutos, que sirve una sola vez y que, si el cliente no la pidió, puede ignorarla.

Las plantillas SHALL armarse con un esqueleto común (Template Method, `PlantillaCorreo`): marca, título, párrafo, botón, enlace en texto plano, aviso y pie «deploya · soporte@deploya.app». Cada plantilla aporta solo su asunto, título, párrafo, texto del botón y aviso. Los datos que vienen del usuario (nombre, correo, enlace) SHALL escaparse antes de entrar al HTML.

#### Scenario: Correo de verificación

- **WHEN** M1 pide notificar la verificación a «derek@tiendademo.com»
- **THEN** el mensaje dice «Hola Derek, para activar tu cuenta en deploya confirma que derek@tiendademo.com es tuyo. El enlace caduca en 24 horas.», con el botón «Verificar correo» y el enlace en texto plano

#### Scenario: Correo de recuperación

- **WHEN** M1 pide notificar una recuperación de contraseña
- **THEN** el cliente recibe la plantilla de recuperación con el botón y el enlace en texto plano

#### Scenario: Recuperación no pedida

- **WHEN** el cliente lee un correo de recuperación que no pidió
- **THEN** el texto le indica que puede ignorarlo y que su contraseña no cambia
